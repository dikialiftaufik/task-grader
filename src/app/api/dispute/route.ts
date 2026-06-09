import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';
import { createAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const isAsprak = userData?.role === 'asprak';
    
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('disputes')
      .select('*, users!disputes_user_id_fkey(full_name, nim), modules!disputes_module_id_fkey(number, title), grades!disputes_grade_id_fkey(*)');

    if (!isAsprak) {
      query = query.eq('user_id', user.id);
    }
    
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/dispute error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'praktikan') return NextResponse.json({ error: 'Hanya praktikan yang dapat mengajukan keberatan' }, { status: 403 });

    const formData = await request.formData();
    const grade_id = formData.get('grade_id') as string;
    const module_id = parseInt(formData.get('module_id') as string);
    const komponenJson = formData.get('komponen_dipersoalkan') as string;
    const alasan = formData.get('alasan') as string;
    const nilai_diminta = formData.get('nilai_diminta') as string;
    
    if (!grade_id || !module_id || !komponenJson || !alasan) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const komponen_dipersoalkan = JSON.parse(komponenJson);

    // Validasi grade dan waktu
    const { data: grade, error: gradeErr } = await supabase
      .from('grades')
      .select('*')
      .eq('id', grade_id)
      .eq('user_id', user.id)
      .eq('status', 'final')
      .single();

    if (gradeErr || !grade) {
      return NextResponse.json({ error: 'Nilai tidak valid atau belum dipublish' }, { status: 400 });
    }



    // Upload files if any
    const bukti_paths: string[] = [];
    for (const [key, file] of formData.entries()) {
      if (key.startsWith('bukti_') && file instanceof Blob) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `disputes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(filePath, file);

        if (!uploadError) {
          bukti_paths.push(filePath);
        }
      }
    }

    const admin = createAdmin();
    // Create dispute
    const { data: dispute, error: disputeErr } = await admin
      .from('disputes')
      .insert({
        user_id: user.id,
        module_id,
        grade_id,
        komponen_dipersoalkan,
        alasan,
        bukti_paths,
        nilai_diminta: nilai_diminta ? parseFloat(nilai_diminta) : null,
        nilai_sebelum: grade.nilai_final,
        status: 'baru'
      })
      .select()
      .single();

    if (disputeErr) throw disputeErr;

    // Update grade status to disputed
    await admin.from('grades').update({ status: 'disputed' }).eq('id', grade_id);

    return NextResponse.json({ success: true, data: dispute });
  } catch (error: any) {
    console.error('POST /api/dispute error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
