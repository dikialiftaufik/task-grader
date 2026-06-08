import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';
import { createAdmin } from '@/lib/supabase/admin';
import { 
  isOverridableField, 
  getFieldMax, 
  calcKomponen1, 
  calcKomponen2, 
  calcKomponen3, 
  calcNilaiFinal 
} from '@/lib/scoring/rubric';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gradeId } = await props.params;
    const body = await request.json();
    const { field, value, reason } = body;
    
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { data: roleData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (roleData?.role !== 'asprak') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    if (!isOverridableField(field)) return NextResponse.json({ error: 'Field tidak valid' }, { status: 400 });
    const max = getFieldMax(field);
    if (typeof value !== 'number' || value < 0 || value > max) {
      return NextResponse.json({ error: `Nilai harus antara 0 dan ${max}` }, { status: 400 });
    }
    if (!reason || reason.length < 10) return NextResponse.json({ error: 'Alasan minimal 10 karakter' }, { status: 400 });
    
    const admin = createAdmin();
    const { data: currentGrade, error: fetchErr } = await admin.from('grades').select('*').eq('id', gradeId).single();
    if (fetchErr || !currentGrade) return NextResponse.json({ error: 'Nilai tidak ditemukan' }, { status: 404 });
    
    const updatedGrade = { ...currentGrade, [field]: value };
    const komponen1_total = calcKomponen1(updatedGrade.kehadiran_poin, updatedGrade.percobaan_poin);
    const komponen2_total = calcKomponen2(updatedGrade.fungsionalitas_poin, updatedGrade.sintaks_poin, updatedGrade.kualitas_poin);
    const komponen3_total = calcKomponen3(updatedGrade.kelengkapan_poin, updatedGrade.kerapihan_poin, updatedGrade.ketepatan_poin);
    const nilai_final = calcNilaiFinal(updatedGrade);
    
    const { error: updateErr } = await admin.from('grades').update({
      [field]: value,
      komponen1_total,
      komponen2_total,
      komponen3_total,
      nilai_final
    }).eq('id', gradeId);
    
    if (updateErr) throw updateErr;
    
    await admin.from('grade_history').insert({
      grade_id: gradeId,
      actor_id: user.id,
      actor_type: 'asprak',
      action: 'manual_override',
      field_changed: field,
      old_value: String(currentGrade[field]),
      new_value: JSON.stringify({ value, reason })
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PATCH /api/grade/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gradeId } = await props.params;
    const supabase = await createServer();
    
    // Authorization check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roleData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (roleData?.role !== 'asprak') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!gradeId) {
      return NextResponse.json({ error: 'ID nilai tidak valid' }, { status: 400 });
    }

    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', gradeId);

    if (error) {
      console.error('Database deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Nilai berhasil dihapus' });
  } catch (error: any) {
    console.error('DELETE /api/grade/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
