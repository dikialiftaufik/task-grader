'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Flag } from 'lucide-react';

export default function KeberatanPage() {
  return (
    <div>
      <h1 className="section-title section-title-praktikan">AJUKAN KEBERATAN NILAI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card padding="md">
            <EmptyState
              icon={<Flag size={48} />}
              title="Belum Ada Nilai Final"
              description="Anda bisa mengajukan keberatan setelah nilai dipublish oleh asprak. Pilih modul yang ingin dipersoalkan dari halaman Nilai Saya."
              action={
                <Button variant="primary-praktikan" size="sm">
                  Lihat Nilai Saya
                </Button>
              }
            />
          </Card>
        </div>

        {/* Panduan */}
        <div className="lg:col-span-2">
          <Card padding="md" style={{ background: 'var(--dark)', color: 'var(--white)' } as React.CSSProperties}>
            <h3 className="text-sm font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--yellow)' }}>
              Sebelum Mengajukan
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                'Pastikan nilai sudah FINAL (bukan draft)',
                'Batas waktu keberatan: 3×24 jam setelah nilai dipublish',
                'Sertakan bukti pendukung (wajib minimal 1 file)',
                'Alasan harus spesifik dan dapat diverifikasi',
                'Asprak akan merespons dalam 2×24 jam',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: 'var(--green)' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="mt-4" padding="md">
            <h3 className="text-sm font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Riwayat Keberatan
            </h3>
            <p className="text-sm text-center py-4" style={{ color: 'var(--muted-text)' }}>
              Belum ada riwayat keberatan.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
