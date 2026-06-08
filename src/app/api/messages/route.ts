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
    const praktikanId = searchParams.get('praktikan_id');

    if (!praktikanId && isAsprak) {
      return NextResponse.json({ error: 'praktikan_id diperlukan untuk asprak' }, { status: 400 });
    }

    const targetPraktikanId = isAsprak ? praktikanId : user.id;

    // Get messages for this praktikan (either sent by them or to them, or general thread)
    const { data, error } = await supabase
      .from('messages')
      .select('*, users!messages_sender_id_fkey(full_name, role)')
      .eq('praktikan_id', targetPraktikanId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark as read if getting messages
    if (data && data.length > 0) {
      const admin = createAdmin();
      const unreadIds = data
        .filter(m => !m.is_read && m.sender_id !== user.id)
        .map(m => m.id);
        
      if (unreadIds.length > 0) {
        await admin.from('messages').update({ is_read: true }).in('id', unreadIds);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role, full_name').eq('id', user.id).single();
    const isAsprak = userData?.role === 'asprak';

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const praktikan_id = formData.get('praktikan_id') as string;
    const dispute_id = formData.get('dispute_id') as string | null;

    if (!content) {
      return NextResponse.json({ error: 'Konten pesan tidak boleh kosong' }, { status: 400 });
    }

    const targetPraktikanId = isAsprak ? praktikan_id : user.id;
    if (!targetPraktikanId) {
      return NextResponse.json({ error: 'Target praktikan tidak valid' }, { status: 400 });
    }

    // Handle attachments
    const attachment_paths: string[] = [];
    for (const [key, file] of formData.entries()) {
      if (key.startsWith('file_') && file instanceof Blob) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `chat/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(filePath, file);

        if (!uploadError) {
          attachment_paths.push(filePath);
        }
      }
    }

    const admin = createAdmin();
    const { data: message, error: insertErr } = await admin
      .from('messages')
      .insert({
        praktikan_id: targetPraktikanId,
        sender_id: user.id,
        sender_type: isAsprak ? 'asprak' : 'praktikan',
        content,
        attachment_paths: attachment_paths.length > 0 ? attachment_paths : null,
        dispute_id: dispute_id || null,
        is_read: false
      })
      .select('*, users!messages_sender_id_fkey(full_name, role)')
      .single();

    if (insertErr) throw insertErr;

    // Create notification for the other party
    if (isAsprak) {
      await admin.from('notifications').insert({
        user_id: targetPraktikanId,
        type: 'pesan_baru',
        title: 'Pesan Baru dari Asprak',
        body: 'Asprak telah membalas pesan Anda.',
        metadata: { message_id: message.id }
      });
    } else {
      // Find an asprak to notify (or all aspraks)
      const { data: aspraks } = await admin.from('users').select('id').eq('role', 'asprak');
      if (aspraks) {
        const notifs = aspraks.map(a => ({
          user_id: a.id,
          type: 'pesan_baru',
          title: `Pesan Baru dari Praktikan`,
          body: `Praktikan ${userData?.full_name} mengirim pesan baru.`,
          metadata: { message_id: message.id, praktikan_id: targetPraktikanId }
        }));
        await admin.from('notifications').insert(notifs as any);
      }
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
