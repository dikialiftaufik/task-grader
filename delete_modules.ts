import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function deleteModules() {
  console.log('Menghapus Modul 6 dan Modul 10...');
  
  // Karena ada relasi ke grades dan attendance, kita harus hapus grades dan attendance untuk modul 6 dan 10 dulu
  // Hapus attendance
  const { error: errAtt } = await supabaseAdmin.from('attendance').delete().in('module_id', [6, 10]);
  if (errAtt) console.error('Error delete attendance:', errAtt.message);
  
  // Hapus grade history (jika ada)
  // Grade history refer ke grade_id, jadi kita harus cari grade id nya dulu
  const { data: grades } = await supabaseAdmin.from('grades').select('id').in('module_id', [6, 10]);
  if (grades && grades.length > 0) {
    const gradeIds = grades.map(g => g.id);
    const { error: errHist } = await supabaseAdmin.from('grade_history').delete().in('grade_id', gradeIds);
    if (errHist) console.error('Error delete grade history:', errHist.message);
    
    // Hapus grades
    const { error: errGrades } = await supabaseAdmin.from('grades').delete().in('module_id', [6, 10]);
    if (errGrades) console.error('Error delete grades:', errGrades.message);
  }
  
  // Terakhir hapus modul
  const { error: errMod } = await supabaseAdmin.from('modules').delete().in('id', [6, 10]);
  if (errMod) {
    console.error('Error delete modules:', errMod.message);
  } else {
    console.log('✅ Modul 6 dan 10 berhasil dihapus dari database!');
  }
}

deleteModules();
