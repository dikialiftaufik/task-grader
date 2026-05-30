/**
 * Seed Users Script
 * Jalankan SEKALI dengan: npx tsx src/lib/supabase/seed-users.ts
 * Pastikan .env.local sudah terisi!
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ACCOUNTS = [
  // Asprak
  {
    username: 'dikialiftaufik',
    full_name: 'Diki Alif Taufik',
    nim: null,
    role: 'asprak' as const,
    password: '607012400005',
    email: 'dikialiftaufik@taskgrader.internal',
    password_changed: true,
  },
  // Praktikan
  {
    username: 'deliasahlanurfadilah',
    full_name: 'DELIA SAHLA NURFADILAH',
    nim: '607012500096',
    role: 'praktikan' as const,
    password: '607012500096',
    email: 'deliasahlanurfadilah@taskgrader.internal',
    password_changed: false,
  },
  {
    username: 'rajieljibranziyzidnafann',
    full_name: 'RAJIEL JIBRAN ZIYA ZIDNA FANN',
    nim: '607012500099',
    role: 'praktikan' as const,
    password: '607012500099',
    email: 'rajieljibranziyzidnafann@taskgrader.internal',
    password_changed: false,
  },
  {
    username: 'laikaathayaputrikhanza',
    full_name: 'LAIKA ATHAYA PUTRI KHANZA',
    nim: '607012500103',
    role: 'praktikan' as const,
    password: '607012500103',
    email: 'laikaathayaputrikhanza@taskgrader.internal',
    password_changed: false,
  },
  {
    username: 'muhammadreeyhan',
    full_name: 'MUHAMMAD REEYHAN',
    nim: '607012500105',
    role: 'praktikan' as const,
    password: '607012500105',
    email: 'muhammadreeyhan@taskgrader.internal',
    password_changed: false,
  },
  {
    username: 'mochamadhafizhakwan',
    full_name: 'MOCHAMAD HAFIZH HAKWAN',
    nim: '607012500109',
    role: 'praktikan' as const,
    password: '607012500109',
    email: 'mochamadhafizhakwan@taskgrader.internal',
    password_changed: false,
  },
  {
    username: 'afifa',
    full_name: 'AFIFA',
    nim: '607012530001',
    role: 'praktikan' as const,
    password: '607012530001',
    email: 'afifa@taskgrader.internal',
    password_changed: false,
  },
  {
    username: 'nikovapramaputri',
    full_name: 'NIKOVA PRAMA PUTRI',
    nim: '6701220063',
    role: 'praktikan' as const,
    password: '6701220063',
    email: 'nikovapramaputri@taskgrader.internal',
    password_changed: false,
  },
];

async function seed() {
  console.log('🚀 Mulai seeding...\n');

  for (const account of ACCOUNTS) {
    // 1. Buat user di Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        username: account.username,
        role: account.role,
      },
    });

    if (authError) {
      console.error(`❌ Auth error for ${account.username}:`, authError.message);
      continue;
    }

    // 2. Insert ke tabel users
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      username: account.username,
      full_name: account.full_name,
      nim: account.nim,
      role: account.role,
      password_changed: account.password_changed,
    });

    if (dbError) {
      console.error(`❌ DB error for ${account.username}:`, dbError.message);
    } else {
      console.log(`✅ Created: ${account.username} (${account.role})`);
    }
  }

  // 3. Buat attendance records kosong untuk semua praktikan × 12 modul
  console.log('\n📋 Seeding attendance records...');

  const { data: praktikans } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'praktikan');

  const { data: modules } = await supabaseAdmin.from('modules').select('id');

  if (praktikans && modules) {
    const attendanceRecords = praktikans.flatMap((p) =>
      modules.map((m) => ({
        user_id: p.id,
        module_id: m.id,
        status: 'alpa' as const,
        point: 0,
      }))
    );

    const { error } = await supabaseAdmin
      .from('attendance')
      .upsert(attendanceRecords, { onConflict: 'user_id,module_id' });

    if (error) console.error('❌ Attendance seed error:', error.message);
    else console.log(`✅ Attendance records seeded (${attendanceRecords.length} rows)`);
  }

  console.log('\n✅ Seed selesai!');
}

seed().catch(console.error);
