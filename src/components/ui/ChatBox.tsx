import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Image as ImageIcon, Paperclip } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ChatBox({ praktikanId, disputeId }: { praktikanId?: string, disputeId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserAndMessages();
    
    const supabase = createClient();
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: praktikanId ? `praktikan_id=eq.${praktikanId}` : undefined
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        setTimeout(scrollToBottom, 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [praktikanId]);

  const loadUserAndMessages = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
      setCurrentUser({ ...user, role: data?.role });
    }

    const url = new URL(window.location.origin + '/api/messages');
    if (praktikanId) url.searchParams.append('praktikan_id', praktikanId);
    
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.success) {
      setMessages(data.data);
      setTimeout(scrollToBottom, 100);
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (praktikanId) formData.append('praktikan_id', praktikanId);
      if (disputeId) formData.append('dispute_id', disputeId);

      const res = await fetch('/api/messages', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setContent('');
        setMessages(prev => {
          if (prev.find(m => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
        setTimeout(scrollToBottom, 100);
      } else {
        toast.error(data.error || 'Gagal mengirim pesan');
      }
    } catch (error) {
      toast.error('Koneksi gagal');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-sm">Memuat pesan...</div>;

  return (
    <div className="flex flex-col h-full bg-[var(--muted)] border-2 border-[var(--dark)]">
      <div className="p-3 border-b-2 border-[var(--dark)] bg-[var(--dark)] text-white font-bold flex justify-between items-center">
        <span>Diskusi Real-time</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white" style={{ minHeight: '300px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-[var(--muted-text)] text-sm py-10">Belum ada pesan. Mulai diskusi sekarang!</div>
        ) : (
          messages.map((m, i) => {
            const isMe = currentUser?.id === m.sender_id;
            const isSystem = m.sender_type === 'ai_system';
            
            if (isSystem) {
              return (
                <div key={i} className="text-center text-xs text-[var(--muted-text)] my-4">
                  <span className="bg-[var(--muted)] px-3 py-1 rounded-full border border-[var(--dark)]">{m.content}</span>
                </div>
              );
            }

            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-[var(--muted-text)] mb-1 mx-1 font-bold">
                  {m.users?.full_name || (isMe ? 'Anda' : (m.sender_type === 'asprak' ? 'Asprak' : 'Praktikan'))}
                </div>
                <div className={`max-w-[80%] p-3 text-sm relative border-2 border-[var(--dark)] ${
                  isMe ? 'bg-[var(--yellow)]' : 'bg-white'
                }`} style={{
                  borderBottomRightRadius: isMe ? 0 : undefined,
                  borderBottomLeftRadius: !isMe ? 0 : undefined,
                }}>
                  {m.content}
                </div>
                <div className="text-[10px] text-[var(--muted-text)] mt-1 mx-1">
                  {formatRelativeTime(m.created_at)} {isMe && m.is_read && <span className="text-[var(--blue)] font-bold">✓ Dibaca</span>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t-2 border-[var(--dark)]">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            className="neo-input flex-1 py-2 px-3 text-sm"
            placeholder="Ketik pesan di sini..."
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            disabled={sending || !content.trim()}
            className="bg-[var(--dark)] text-white p-3 border-2 border-[var(--dark)] hover:bg-[var(--yellow)] hover:text-[var(--dark)] transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
