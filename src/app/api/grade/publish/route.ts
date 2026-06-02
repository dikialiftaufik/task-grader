import { createServer } from '@/lib/supabase/server';
import { createAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    // Verify asprak role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'asprak') {
      return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { grade_ids } = body;

    if (!grade_ids || !Array.isArray(grade_ids) || grade_ids.length === 0) {
      return NextResponse.json({ success: false, error: 'grade_ids tidak valid' }, { status: 400 });
    }

    const admin = createAdmin();

    // Get the grades first to know the users
    const { data: gradesData, error: fetchError } = await admin
      .from('grades')
      .select('id, user_id, module_id, status')
      .in('id', grade_ids);

    if (fetchError) throw new Error(fetchError.message);

    // Update statuses to 'final'
    const { error: updateError } = await admin
      .from('grades')
      .update({
        status: 'final',
        published_at: new Date().toISOString(),
      })
      .in('id', grade_ids);

    if (updateError) throw new Error(updateError.message);

    // Create notifications for users
    const notifications = gradesData.map(g => ({
      user_id: g.user_id,
      type: 'nilai_dipublish',
      title: 'Nilai Baru Tersedia',
      body: `Nilai Anda untuk Modul ${g.module_id} telah dipublish oleh asprak.`,
      metadata: { grade_id: g.id, module_id: g.module_id },
    }));

    if (notifications.length > 0) {
      await admin.from('notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, count: grade_ids.length });

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
