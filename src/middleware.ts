import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (penting untuk keep session alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes — tidak perlu auth
  if (pathname === '/login' || pathname.startsWith('/api/auth/login')) {
    // Jika sudah login, redirect ke dashboard sesuai role
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role === 'asprak') {
        return NextResponse.redirect(new URL('/asprak/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/praktikan/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // Semua route lain butuh auth
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Ambil data user dari database
  const { data: userData } = await supabase
    .from('users')
    .select('role, password_changed')
    .eq('id', user.id)
    .single();

  if (!userData) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Route protection berdasarkan role
  if (pathname.startsWith('/asprak') && userData.role !== 'asprak') {
    return NextResponse.redirect(new URL('/praktikan/dashboard', request.url));
  }

  if (pathname.startsWith('/praktikan') && userData.role !== 'praktikan') {
    return NextResponse.redirect(new URL('/asprak/dashboard', request.url));
  }

  // Praktikan wajib ganti password dulu
  if (
    userData.role === 'praktikan' &&
    !userData.password_changed &&
    pathname !== '/praktikan/profil' &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.redirect(new URL('/praktikan/profil', request.url));
  }

  // Root redirect
  if (pathname === '/') {
    if (userData.role === 'asprak') {
      return NextResponse.redirect(new URL('/asprak/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/praktikan/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
