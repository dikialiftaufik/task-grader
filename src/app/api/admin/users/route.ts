import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side admin client
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const adminClient = getAdminClient();
    
    // Get all praktikans
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .eq('role', 'praktikan')
      .order('full_name');

    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { full_name, username, nim } = body;

    if (!full_name || !username || !nim) {
      return NextResponse.json({ success: false, error: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const email = `${username}@taskgrader.internal`;
    const password = nim; // Password default = NIM

    // 1. Create Auth User
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role: 'praktikan' },
    });

    if (authError) throw authError;
    if (!authUser.user) throw new Error('Failed to create auth user');

    // 2. Create DB User
    const { error: dbError } = await adminClient.from('users').insert({
      id: authUser.user.id,
      username,
      full_name,
      nim,
      role: 'praktikan',
      password_changed: false,
    });

    if (dbError) throw dbError;

    // 3. Init Attendance
    const { data: modules } = await adminClient.from('modules').select('id');
    if (modules && modules.length > 0) {
      const attendanceRecords = modules.map((m) => ({
        user_id: authUser.user.id,
        module_id: m.id,
        status: 'alpa',
        point: 0,
      }));
      await adminClient.from('attendance').upsert(attendanceRecords);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID dibutuhkan' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Hapus dari Auth (Otomatis CASCADE hapus data dari tabel users, attendance, dll)
    const { error } = await adminClient.auth.admin.deleteUser(id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
