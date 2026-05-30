'use client';

import Card from '@/components/ui/Card';
import { MessageCircle } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function DiskusiAsprakPage() {
  return (
    <div>
      <h1 className="section-title section-title-asprak">DISKUSI & KEBERATAN</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbox */}
        <Card padding="md" className="lg:col-span-1">
          <h3 className="text-sm font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Inbox
          </h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['Semua', 'Keberatan', 'Diskusi', 'Selesai'].map((tab) => (
              <button key={tab} className="neo-pill bg-[var(--white)] text-[var(--dark)] cursor-pointer text-xs">
                {tab}
              </button>
            ))}
          </div>
          <EmptyState
            icon={<MessageCircle size={48} />}
            title="Belum Ada Pesan"
            description="Pesan dari praktikan akan muncul di sini."
          />
        </Card>

        {/* Chat Panel */}
        <Card padding="md" className="lg:col-span-2">
          <EmptyState
            icon={<MessageCircle size={48} />}
            title="Pilih Percakapan"
            description="Pilih percakapan dari inbox untuk melihat detailnya."
          />
        </Card>
      </div>
    </div>
  );
}
