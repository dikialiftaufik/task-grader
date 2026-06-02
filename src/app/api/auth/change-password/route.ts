import { createServer } from '@/lib/supabase/server';
import { createAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { new_password } = await request.json();

    if (!new_password) {
      return NextResponse.json(
        { success: false, error: 'Password baru wajib diisi' },
        { status: 400 }
      );
    }

    // Validate password strength
    const checks = [
      { test: new_password.length >= 8, msg: 'Minimal 8 karakter' },
      { test: /[A-Z]/.test(new_password), msg: 'Harus ada huruf besar' },
      { test: /[a-z]/.test(new_password), msg: 'Harus ada huruf kecil' },
      { test: /[0-9]/.test(new_password), msg: 'Harus ada angka' },
      { test: /[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]/.test(new_password), msg: 'Harus ada simbol' },
    ];

    const failed = checks.filter((c) => !c.test);
    if (failed.length > 0) {
      return NextResponse.json(
        { success: false, error: failed.map((f) => f.msg).join(', ') },
        { status: 400 }
      );
    }

    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Update password using the current user's authenticated session
    // This ensures their session is refreshed and they remain logged in
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Gagal mengubah password' },
        { status: 500 }
      );
    }

    // Set password_changed = true via admin client
    const admin = createAdmin();
    await admin.from('users').update({ password_changed: true }).eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
