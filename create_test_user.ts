import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createTestUser() {
  const username = 'ucokbaba';
  const password = '123';
  const email = 'ucokbaba@taskgrader.internal';

  // 1. Auth User
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, role: 'praktikan' },
  });

  if (authError) {
    console.error('Error Auth:', authError.message);
    return;
  }

  // 2. Table users
  const { error: dbError } = await supabaseAdmin.from('users').insert({
    id: authUser.user.id,
    username,
    full_name: 'Ucok Baba (Testing)',
    nim: 'TEST-123',
    role: 'praktikan',
    password_changed: false,
  });

  if (dbError) {
    console.error('Error DB:', dbError.message);
    return;
  }

  // 3. Attendance init
  const { data: modules } = await supabaseAdmin.from('modules').select('id');
  if (modules) {
    const attendanceRecords = modules.map((m) => ({
      user_id: authUser.user.id,
      module_id: m.id,
      status: 'alpa' as const,
      point: 0,
    }));
    await supabaseAdmin.from('attendance').upsert(attendanceRecords);
  }

  console.log('✅ User ucokbaba berhasil dibuat!');
}

createTestUser();
