'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { Settings, Users, Cpu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Setting } from '@/types';

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Setting | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [semester, setSemester] = useState('');
  const [prodi, setProdi] = useState('');
  const [bKehadiran, setBKehadiran] = useState('30');
  const [bTugas, setBTugas] = useState('30');
  const [bLaporan, setBLaporan] = useState('40');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const supabase = createClient();
    const { data } = await supabase.from('settings').select('*').single();
    
    if (data) {
      setSettings(data as Setting);
      setNama(data.nama_mata_praktikum);
      setSemester(data.semester);
      setProdi(data.program_studi);
      setBKehadiran(data.bobot_kehadiran.toString());
      setBTugas(data.bobot_tugas_akhir.toString());
      setBLaporan(data.bobot_laporan.toString());
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    // Pastikan total bobot = 100
    const totalBobot = parseInt(bKehadiran) + parseInt(bTugas) + parseInt(bLaporan);
    if (totalBobot !== 100) {
      toast.error(`Total bobot saat ini ${totalBobot}%. Harus tepat 100%!`);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('settings').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      nama_mata_praktikum: nama,
      semester: semester,
      program_studi: prodi,
      bobot_kehadiran: parseInt(bKehadiran),
      bobot_tugas_akhir: parseInt(bTugas),
      bobot_laporan: parseInt(bLaporan),
      updated_at: new Date().toISOString()
    });

    if (error) {
      toast.error('Gagal menyimpan pengaturan');
    } else {
      toast.success('Pengaturan berhasil disimpan!');
      loadSettings();
    }
    setSaving(false);
  }

  if (loading) return <Skeleton height={400} />;

  return (
    <div>
      <h1 className="section-title section-title-asprak mb-6">PENGATURAN</h1>

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
              className={`w-full text-left p-3 flex items-center gap-3 text-sm transition-colors ${
                tab.active
                  ? 'bg-[var(--yellow)] border-[3px] border-[var(--dark)] font-bold'
                  : 'bg-[var(--white)] border-[2px] border-[var(--dark)] hover:bg-[var(--muted)] cursor-not-allowed opacity-50'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
              disabled={!tab.active}
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

          {!settings ? (
            <div className="p-4 bg-[#FFE6E6] text-[var(--red)] border-2 border-[var(--dark)] text-sm mb-6 font-bold">
              ⚠️ Tabel 'settings' belum dibuat di Supabase! Silakan jalankan script SQL terlebih dahulu.
            </div>
          ) : (
            <div className="space-y-6">
              <Input 
                label="Nama Mata Kuliah" 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
              />
              <Input 
                label="Semester" 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)} 
              />
              <Input 
                label="Program Studi" 
                value={prodi} 
                onChange={(e) => setProdi(e.target.value)} 
              />

              <div>
                <p className="text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Bobot Penilaian (%) - Total harus 100%
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <Input 
                    label="Kehadiran" 
                    type="number" 
                    value={bKehadiran} 
                    onChange={(e) => setBKehadiran(e.target.value)} 
                  />
                  <Input 
                    label="Tugas Akhir" 
                    type="number" 
                    value={bTugas} 
                    onChange={(e) => setBTugas(e.target.value)} 
                  />
                  <Input 
                    label="Laporan" 
                    type="number" 
                    value={bLaporan} 
                    onChange={(e) => setBLaporan(e.target.value)} 
                  />
                </div>
              </div>

              <Button variant="primary-asprak" loading={saving} onClick={handleSave}>
                Simpan Pengaturan
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
