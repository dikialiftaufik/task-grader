'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Settings, Users, Cpu, Shield } from 'lucide-react';

export default function PengaturanPage() {
  return (
    <div>
      <h1 className="section-title section-title-asprak">PENGATURAN</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left tabs */}
        <div className="space-y-2">
          {[
            { label: 'Umum', icon: Settings, active: true },
            { label: 'Akun Praktikan', icon: Users, active: false },
            { label: 'AI Grading', icon: Cpu, active: false },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`w-full text-left p-3 flex items-center gap-3 text-sm ${
                tab.active
                  ? 'bg-[var(--yellow)] border-[3px] border-[var(--dark)] font-bold'
                  : 'bg-[var(--white)] border-[2px] border-[var(--dark)] hover:bg-[var(--muted)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="lg:col-span-3" padding="md">
          <h3 className="text-sm font-bold uppercase mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Pengaturan Umum
          </h3>

          <div className="space-y-6">
            <Input label="Nama Mata Praktikum" defaultValue="Pemrograman Berorientasi Objek" />
            <Input label="Semester" defaultValue="Genap 2024/2025" />
            <Input label="Program Studi" defaultValue="D3 Sistem Informasi" />

            <div>
              <p className="text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Bobot Penilaian
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Kehadiran (%)" type="number" defaultValue="30" />
                <Input label="Tugas Akhir (%)" type="number" defaultValue="30" />
                <Input label="Laporan (%)" type="number" defaultValue="40" />
              </div>
            </div>

            <Button variant="primary-asprak">Simpan Pengaturan</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
