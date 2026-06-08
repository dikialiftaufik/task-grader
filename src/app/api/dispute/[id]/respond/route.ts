import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';
import { createAdmin } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const { action, response, new_grade } = body; // action: 'terima' | 'tolak'
    
    if (!action || !['terima', 'tolak'].includes(action) || !response) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'asprak') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const admin = createAdmin();
    const { data: dispute, error: fetchErr } = await admin.from('disputes').select('*').eq('id', id).single();
    
    if (fetchErr || !dispute) return NextResponse.json({ error: 'Keberatan tidak ditemukan' }, { status: 404 });
    if (dispute.status === 'diterima' || dispute.status === 'ditolak') {
      return NextResponse.json({ error: 'Keberatan sudah diproses sebelumnya' }, { status: 400 });
    }

    const newStatus = action === 'terima' ? 'diterima' : 'ditolak';
    const gradeStatus = action === 'terima' && new_grade !== undefined ? 'final' : 'final';
    
    // Update dispute
    const { data: updatedDispute, error: updateErr } = await admin.from('disputes').update({
      status: newStatus,
      asprak_response: response,
      nilai_sesudah: action === 'terima' && new_grade !== undefined ? new_grade : null,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();

    if (updateErr) throw updateErr;

    // Update grade
    if (action === 'terima' && new_grade !== undefined) {
      await admin.from('grades').update({
        nilai_final: new_grade,
        status: 'final'
      }).eq('id', dispute.grade_id);

      // Insert grade history
      await admin.from('grade_history').insert({
        grade_id: dispute.grade_id,
        actor_id: user.id,
        actor_type: 'asprak',
        action: 'dispute_accepted',
        field_changed: 'nilai_final',
        old_value: String(dispute.nilai_sebelum),
        new_value: JSON.stringify({ value: new_grade, reason: response })
      });
    } else {
      // Just set grade back to final
      await admin.from('grades').update({ status: 'final' }).eq('id', dispute.grade_id);
    }

    // Create notification
    await admin.from('notifications').insert({
      user_id: dispute.user_id,
      type: 'dispute_resolved',
      title: action === 'terima' ? 'Keberatan Diterima' : 'Keberatan Ditolak',
      body: `Keberatan Anda untuk modul telah ${action}.`,
      metadata: { dispute_id: id }
    });

    return NextResponse.json({ success: true, data: updatedDispute });
  } catch (error: any) {
    console.error('PATCH /api/dispute/[id]/respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
