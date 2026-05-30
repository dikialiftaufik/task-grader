'use client';

import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { MessageCircle } from 'lucide-react';

export default function DiskusiPraktikanPage() {
  return (
    <div>
      <h1 className="section-title section-title-praktikan">DISKUSI</h1>

      <Card padding="lg">
        <EmptyState
          icon={<MessageCircle size={48} />}
          title="Belum Ada Percakapan"
          description="Diskusi dengan asprak akan muncul di sini setelah Anda mengajukan keberatan atau asprak mengirim pesan."
        />
      </Card>
    </div>
  );
}
