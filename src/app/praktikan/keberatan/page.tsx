'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Flag, Upload, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatBox from '@/components/ui/ChatBox';
import type { Grade, Module } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

function KeberatanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initGradeId = searchParams.get('grade_id');

  const [grades, setGrades] = useState<(Grade & { module: Module })[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'chat'>('form');

  // Form states
  const [selectedGradeId, setSelectedGradeId] = useState<string>(initGradeId || '');
  const [komponen, setKomponen] = useState<string[]>([]);
  const [alasan, setAlasan] = useState('');
  const [nilaiDiminta, setNilaiDiminta] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load final grades
    const { data: gradesData } = await supabase
      .from('grades')
      .select('*, modules!inner(*)')
      .eq('user_id', user.id)
      .eq('status', 'final')
      .order('module_id');

    if (gradesData) {
      setGrades(gradesData.map((g: any) => ({
        ...g,
        module: g.modules
      })));
    }

    // Load disputes
    const res = await fetch('/api/dispute');
    const disputeData = await res.json();
    if (disputeData.success) {
      setDisputes(disputeData.data);
    }
    setLoading(false);
  }

  const selectedGrade = grades.find(g => g.id === selectedGradeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGrade || komponen.length === 0 || alasan.length < 20 || files.length === 0) {
      toast.error('Harap lengkapi semua field wajib (termasuk minimal 1 bukti dan alasan min 20 karakter)');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('grade_id', selectedGrade.id);
      formData.append('module_id', selectedGrade.module_id.toString());
      formData.append('komponen_dipersoalkan', JSON.stringify(komponen));
      formData.append('alasan', alasan);
      if (nilaiDiminta) formData.append('nilai_diminta', nilaiDiminta);
      
      files.forEach((file, i) => {
        formData.append(`bukti_${i}`, file);
      });

      const res = await fetch('/api/dispute', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Keberatan berhasil diajukan');
        setSelectedGradeId('');
        setKomponen([]);
        setAlasan('');
        setNilaiDiminta('');
        setFiles([]);
        loadData();
      } else {
        toast.error(data.error || 'Gagal mengajukan keberatan');
      }
    } catch (err) {
      toast.error('Koneksi gagal');
    } finally {
      setSubmitting(false);
    }
  }

  const handleKomponenToggle = (val: string) => {
    if (komponen.includes(val)) {
      setKomponen(komponen.filter(k => k !== val));
    } else {
      setKomponen([...komponen, val]);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'baru') return 'var(--blue)';
    if (status === 'diproses') return 'var(--orange)';
    if (status === 'diterima') return 'var(--green)';
    if (status === 'ditolak') return 'var(--red)';
    return 'var(--dark)';
  };

  if (loading) {
    return <div className="p-8 text-center">Memuat...</div>;
  }

  return (
    <div>
      <h1 className="section-title section-title-praktikan">AJUKAN KEBERATAN NILAI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form or Chat */}
        <div className="lg:col-span-3">
          <div className="flex gap-2 mb-4">
            <button 
              className={`neo-pill ${activeTab === 'form' ? 'bg-[var(--dark)] text-white' : 'bg-white text-[var(--dark)]'} text-xs font-bold px-4 py-2 flex items-center gap-2`}
              onClick={() => setActiveTab('form')}
            >
              <Flag size={16} /> Form Keberatan
            </button>
            <button 
              className={`neo-pill ${activeTab === 'chat' ? 'bg-[var(--dark)] text-white' : 'bg-white text-[var(--dark)]'} text-xs font-bold px-4 py-2 flex items-center gap-2`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={16} /> Tanya Asprak
            </button>
          </div>

          {activeTab === 'form' ? (
            <Card padding="md">
            {grades.length === 0 ? (
              <EmptyState
                icon={<Flag size={48} />}
                title="Belum Ada Nilai Final"
                description="Anda bisa mengajukan keberatan setelah nilai dipublish oleh asprak."
                action={
                  <Button variant="primary-praktikan" size="sm" onClick={() => router.push('/praktikan/nilai')}>
                    Lihat Nilai Saya
                  </Button>
                }
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold mb-1">Pilih Modul *</label>
                  <select 
                    className="neo-input w-full"
                    value={selectedGradeId}
                    onChange={(e) => setSelectedGradeId(e.target.value)}
                  >
                    <option value="">-- Pilih Nilai Modul --</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>Modul {g.module.number} - {g.module.title} (Nilai: {g.nilai_final})</option>
                    ))}
                  </select>
                </div>

                {selectedGrade && (
                  <>
                    <div className="p-3 bg-[var(--muted)] border-2 border-[var(--dark)] text-sm">
                      <p className="font-bold mb-1">Nilai Saat Ini:</p>
                      <div className="flex gap-4">
                        <span>Komp 1: {selectedGrade.komponen1_total}</span>
                        <span>Komp 2: {selectedGrade.komponen2_total}</span>
                        <span>Komp 3: {selectedGrade.komponen3_total}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-2">Komponen yang Dipersoalkan *</label>
                      <div className="space-y-2">
                        {['Komponen 1 (Kehadiran & Percobaan)', 'Komponen 2 (Tugas Akhir)', 'Komponen 3 (Buku Laporan)'].map(k => (
                          <label key={k} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={komponen.includes(k)}
                              onChange={() => handleKomponenToggle(k)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{k}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Alasan Keberatan (min 20 karakter) *</label>
                      <textarea 
                        className="neo-input w-full min-h-[100px]"
                        value={alasan}
                        onChange={e => setAlasan(e.target.value)}
                        placeholder="Jelaskan secara detail bagian mana yang Anda rasa kurang tepat dinilai..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Bukti Pendukung * (Max 3 file, Image/PDF)</label>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,.pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files);
                            if (files.length + newFiles.length > 3) {
                              toast.error('Maksimal 3 file bukti');
                              return;
                            }
                            setFiles([...files, ...newFiles]);
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} icon={<Upload size={16} />}>
                        Pilih File Bukti
                      </Button>
                      {files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 bg-[var(--muted)] border border-[var(--dark)]">
                              <span className="truncate max-w-[200px]">{f.name}</span>
                              <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-[var(--red)]">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Nilai yang Diminta (Opsional)</label>
                      <Input 
                        type="number"
                        min="0" max="100"
                        value={nilaiDiminta}
                        onChange={e => setNilaiDiminta(e.target.value)}
                        placeholder="Contoh: 85"
                      />
                    </div>

                    <Button type="submit" variant="primary-praktikan" loading={submitting} className="w-full">
                      Ajukan Keberatan
                    </Button>
                  </>
                )}
              </form>
            )}
          </Card>
          ) : (
            <div className="h-[600px]">
              <ChatBox />
            </div>
          )}
        </div>

        {/* Panduan & Riwayat */}
        <div className="lg:col-span-2">
          <Card padding="md" style={{ background: 'var(--dark)', color: 'var(--white)' } as React.CSSProperties}>
            <h3 className="text-sm font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--yellow)' }}>
              Sebelum Mengajukan
            </h3>
            <ul className="space-y-3 text-sm">
              {[
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
            {disputes.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--muted-text)' }}>
                Belum ada riwayat keberatan.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {disputes.map(d => (
                  <div key={d.id} className="p-3 border-2 border-[var(--dark)] text-sm relative">
                    <div className="absolute top-0 right-0 bg-[var(--dark)] text-white text-[10px] px-2 py-1 font-bold uppercase" style={{ backgroundColor: getStatusColor(d.status) }}>
                      {d.status}
                    </div>
                    <p className="font-bold mb-1">Modul {d.modules?.number}</p>
                    <p className="text-xs text-[var(--muted-text)] mb-2">{formatRelativeTime(d.created_at)}</p>
                    <p className="text-xs font-mono mb-2 truncate max-w-[200px]">{d.alasan}</p>
                    {d.status === 'diterima' && d.nilai_sesudah && (
                      <p className="text-xs font-bold text-[var(--green)]">Nilai diubah menjadi: {d.nilai_sesudah}</p>
                    )}
                    {d.asprak_response && (
                      <div className="mt-2 p-2 bg-[var(--muted)] border-l-2 border-[var(--dark)] text-xs">
                        <span className="font-bold block mb-1">Respons Asprak:</span>
                        {d.asprak_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function KeberatanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <KeberatanContent />
    </Suspense>
  );
}
