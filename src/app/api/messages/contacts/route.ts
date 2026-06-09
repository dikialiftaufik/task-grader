import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'asprak') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ambil daftar praktikan
    const { data: praktikans, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, nim')
      .eq('role', 'praktikan');

    if (usersErr) throw usersErr;

    // Ambil semua pesan
    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('praktikan_id, created_at, is_read, sender_id');

    if (msgErr) throw msgErr;

    // Kelompokkan dan hitung
    const contacts = praktikans.map((p: any) => {
      const pMessages = messages.filter((m: any) => m.praktikan_id === p.id);
      
      const unreadCount = pMessages.filter((m: any) => !m.is_read && m.sender_id === p.id).length;
      
      let lastMessageTime = null;
      if (pMessages.length > 0) {
        // Sort descending
        pMessages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        lastMessageTime = pMessages[0].created_at;
      }

      return {
        ...p,
        unread_count: unreadCount,
        last_message_time: lastMessageTime
      };
    });

    // Urutkan berdasarkan yang ada unread_count, lalu last_message_time terbaru
    contacts.sort((a: any, b: any) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (b.unread_count > 0 && a.unread_count === 0) return 1;
      
      if (a.last_message_time && b.last_message_time) {
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      }
      if (a.last_message_time) return -1;
      if (b.last_message_time) return 1;
      
      return a.full_name.localeCompare(b.full_name);
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    console.error('GET /api/messages/contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
