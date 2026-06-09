'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Search, MessageSquare } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ChatBox from '@/components/ui/ChatBox';
import { formatRelativeTime } from '@/lib/utils';

export default function DiskusiAsprakPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const res = await fetch('/api/messages/contacts');
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (err) {
      console.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    (c.nim && c.nim.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h1 className="section-title section-title-asprak">CHAT PRAKTIKAN</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Inbox List */}
        <Card padding="none" className="lg:col-span-1 flex flex-col h-full overflow-hidden border-r-2 border-[var(--dark)]">
          <div className="p-4 border-b-2 border-[var(--dark)] bg-[var(--yellow)]">
            <h3 className="text-sm font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Daftar Praktikan
            </h3>
            <div className="neo-input bg-white flex items-center p-0 overflow-hidden">
              <div className="px-2 text-[var(--muted-text)]"><Search size={16} /></div>
              <input 
                type="text" 
                placeholder="Cari nama atau NIM..." 
                className="w-full text-sm p-2 outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm font-medium">Memuat...</div>
            ) : filteredContacts.length === 0 ? (
              <EmptyState icon={<MessageSquare size={32} />} title="Tidak ada kontak" description="Tidak ada praktikan yang cocok dengan pencarian." />
            ) : (
              filteredContacts.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    setSelectedContact(c);
                    // Reset unread locally when clicked
                    if (c.unread_count > 0) {
                      setContacts(prev => prev.map(p => p.id === c.id ? { ...p, unread_count: 0 } : p));
                    }
                  }}
                  className={`p-4 border-b border-[var(--dark)] cursor-pointer transition-colors ${selectedContact?.id === c.id ? 'bg-[var(--dark)] text-white' : 'hover:bg-[var(--muted)]'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm truncate pr-2">{c.full_name}</p>
                    {c.unread_count > 0 && (
                      <span className="bg-[var(--red)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${selectedContact?.id === c.id ? 'text-gray-300' : 'text-gray-600'}`}>{c.nim}</p>
                  {c.last_message_time && (
                    <p className={`text-[10px] mt-2 ${selectedContact?.id === c.id ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatRelativeTime(c.last_message_time)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Detail Panel */}
        <Card padding="none" className="lg:col-span-2 h-full flex flex-col overflow-hidden">
          {!selectedContact ? (
            <div className="h-full flex items-center justify-center p-6">
              <EmptyState
                icon={<MessageSquare size={48} />}
                title="Pilih Percakapan"
                description="Pilih salah satu praktikan dari daftar untuk memulai atau melanjutkan chat."
              />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b-2 border-[var(--dark)] bg-[var(--muted)] flex justify-between items-center shrink-0">
                <div>
                  <h2 className="font-bold text-lg">{selectedContact.full_name} <span className="font-mono text-sm text-[var(--muted-text)]">({selectedContact.nim})</span></h2>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden relative">
                <ChatBox praktikanId={selectedContact.id} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
