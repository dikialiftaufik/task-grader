'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Eye, X, Brain, Flag } from 'lucide-react';
import { calcIndeks } from '@/lib/scoring/rubric';
import type { Grade, Module, IndeksHuruf } from '@/types';

export default function NilaiSayaPage() {
  const router = useRouter();
  const [grades, setGrades] = useState<(Grade & { module: Module })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState<(Grade & { module: Module; indeks: IndeksHuruf | null }) | null>(null);

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('grades')
      .select('*, modules!inner(*)')
      .eq('user_id', user.id)
      .eq('status', 'final')
      .order('module_id');

    if (data) {
      setGrades(
        data.map((g: any) => ({
          ...g,
          module: g.modules,
          indeks: calcIndeks(g.nilai_final),
        })) as (Grade & { module: Module })[]
      );
    }
    setLoading(false);
  }

  const avgScore = grades.length
    ? parseFloat((grades.reduce((s, g) => s + g.nilai_final, 0) / grades.length).toFixed(1))
    : 0;

  return (
    <div>
      <h1 className="section-title section-title-praktikan">NILAI SAYA</h1>

      {/* Summary Card */}
      {grades.length > 0 && (
        <Card
          className="mb-8 bg-[var(--yellow)]"
          padding="lg"
          accentColor="var(--yellow)"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs uppercase font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Nilai Akhir Sementara
              </p>
              <p className="text-7xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {avgScore}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm">{grades.length} modul dinilai</p>
            </div>
          </div>
        </Card>
      )}

      {/* Grades Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Modul</th>
                <th>Komp. 1 (30)</th>
                <th>Komp. 2 (30)</th>
                <th>Komp. 3 (40)</th>
                <th>Total</th>
                <th>Indeks</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td>
                      <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                    <td><div className="h-6 bg-gray-200 rounded w-10"></div></td>
                    <td><div className="h-6 bg-gray-200 rounded w-8"></div></td>
                    <td><div className="h-8 bg-gray-200 rounded w-24"></div></td>
                  </tr>
                ))
              ) : grades.length > 0 ? (
                grades.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span className="font-bold text-base" style={{ fontFamily: 'var(--font-display)' }}>
                        Modul {g.module?.number}
                      </span>
                      <br />
                      <span className="text-xs" style={{ color: 'var(--muted-text)' }}>
                        {g.module?.title}
                      </span>
                    </td>
                    <td>{g.komponen1_total}</td>
                    <td>{g.komponen2_total}</td>
                    <td>{g.komponen3_total}</td>
                    <td className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                      {g.nilai_final}
                    </td>
                    <td><Badge variant="indeks" value={g.indeks || '-'} /></td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="p-1.5 hover:bg-[var(--muted)] border-2 border-transparent hover:border-[var(--dark)] transition-all rounded"
                          title="Lihat Detail & Feedback AI"
                          onClick={() => setShowDetailModal(g)}
                        >
                          <Eye size={16} />
                        </button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          icon={<Flag size={14} />}
                          onClick={() => router.push('/praktikan/keberatan')}
                        >
                          Keberatan
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: 'var(--muted-text)' }}>
                    Belum ada nilai yang dipublish.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ━━━━ Detail Modal ━━━━ */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal-box" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b-2 border-[var(--dark)] pb-4 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  Detail Nilai Modul {showDetailModal.module.number}
                </h2>
                <p className="text-sm font-medium">
                  {showDetailModal.module.title}
                </p>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-[var(--red)] hover:text-white border-2 border-transparent hover:border-[var(--dark)] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content scrollable */}
            <div className="overflow-y-auto pr-2 pb-4 space-y-6">
              
              {/* Top Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[var(--muted)] border-2 border-[var(--dark)]">
                  <p className="text-xs font-bold uppercase mb-1">Total Nilai</p>
                  <p className="text-3xl font-bold font-display">{showDetailModal.nilai_final}</p>
                </div>
                <div className="p-4 bg-[var(--muted)] border-2 border-[var(--dark)]">
                  <p className="text-xs font-bold uppercase mb-1">Indeks</p>
                  <p className="text-3xl font-bold font-display text-[var(--blue)]">{showDetailModal.indeks || '-'}</p>
                </div>
                <div className="p-4 bg-[var(--muted)] border-2 border-[var(--dark)]">
                  <p className="text-xs font-bold uppercase mb-1">Confidence</p>
                  <Badge variant="confidence" value={showDetailModal.ai_confidence?.toUpperCase() || '-'} className="mt-1" />
                </div>
                <div className="p-4 bg-[var(--muted)] border-2 border-[var(--dark)]">
                  <p className="text-xs font-bold uppercase mb-1">Status</p>
                  <Badge variant="status" value={showDetailModal.status} className="mt-1" />
                </div>
              </div>

              {/* Rincian Komponen Detail Baru */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase border-b-2 border-[var(--dark)] pb-2" style={{ fontFamily: 'var(--font-display)' }}>Rincian Komponen Penilaian</h3>
                
                {/* KOMPONEN 1 */}
                <details className="group border-2 border-[var(--dark)] rounded-none bg-white">
                  <summary className="font-bold p-3 bg-[var(--muted)] cursor-pointer select-none flex justify-between items-center group-open:border-b-2 group-open:border-[var(--dark)]">
                    <span>1. Kehadiran & Pelaksanaan Praktikum (30%)</span>
                    <span className="text-lg font-display">{showDetailModal.komponen1_total} / 30</span>
                  </summary>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between items-start border-b border-dashed pb-2">
                      <div>
                        <span className="font-bold block">1.1 Kehadiran</span>
                        <span className="text-xs text-[var(--muted-text)]">Hadir (10) | Izin/Sakit (5) | Alpa (0)</span>
                      </div>
                      <span className="font-mono font-bold">{showDetailModal.kehadiran_poin} / 10</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold block">1.2 Kelengkapan Pelaksanaan Percobaan</span>
                        <span className="text-xs text-[var(--muted-text)]">Jumlah sub-bab percobaan yang dikerjakan</span>
                      </div>
                      <span className="font-mono font-bold">{showDetailModal.percobaan_poin} / 20</span>
                    </div>
                  </div>
                </details>

                {/* KOMPONEN 2 */}
                <details className="group border-2 border-[var(--dark)] rounded-none bg-white">
                  <summary className="font-bold p-3 bg-[var(--muted)] cursor-pointer select-none flex justify-between items-center group-open:border-b-2 group-open:border-[var(--dark)]">
                    <span>2. Tugas Akhir (30%)</span>
                    <span className="text-lg font-display">{showDetailModal.komponen2_total} / 30</span>
                  </summary>
                  <div className="p-4 space-y-4 text-sm">
                    <div className="border-b border-dashed pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold">2.1 Fungsionalitas Program</span>
                        <span className="font-mono font-bold">{showDetailModal.fungsionalitas_poin} / 15</span>
                      </div>
                      <p className="text-xs text-gray-700">Kesesuaian logika dan fitur program dengan kriteria target pada modul terkait (seperti proses kalkulasi, menu, validasi input, dll).</p>
                      {showDetailModal.fungsionalitas_poin < 15 && <p className="text-xs text-[var(--red)] mt-2 font-italic">* Lihat rincian penalti di bawah</p>}
                    </div>
                    <div className="border-b border-dashed pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold">2.2 Penerapan Sintaks Wajib</span>
                        <span className="font-mono font-bold">{showDetailModal.sintaks_poin} / 10</span>
                      </div>
                      <p className="text-xs text-gray-700">Penerapan sintaks disesuaikan dengan topik modul terkait.</p>
                      {showDetailModal.sintaks_poin < 10 && <p className="text-xs text-[var(--red)] mt-2 font-italic">* Lihat rincian penalti di bawah</p>}
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold">2.3 Kualitas Kode</span>
                        <span className="font-mono font-bold">{showDetailModal.kualitas_poin} / 5</span>
                      </div>
                      <ul className="list-disc pl-5 text-xs space-y-1 text-gray-700">
                        <li>Struktur rapi & indentasi (2)</li>
                        <li>Penamaan variabel bermakna (1)</li>
                        <li>Output sesuai format (2)</li>
                      </ul>
                      {showDetailModal.kualitas_poin < 5 && <p className="text-xs text-[var(--red)] mt-2 font-italic">* Lihat rincian penalti di bawah</p>}
                    </div>
                  </div>
                </details>

                {/* KOMPONEN 3 */}
                <details className="group border-2 border-[var(--dark)] rounded-none bg-white">
                  <summary className="font-bold p-3 bg-[var(--muted)] cursor-pointer select-none flex justify-between items-center group-open:border-b-2 group-open:border-[var(--dark)]">
                    <span>3. Buku Laporan Praktikum (40%)</span>
                    <span className="text-lg font-display">{showDetailModal.komponen3_total} / 40</span>
                  </summary>
                  <div className="p-4 space-y-4 text-sm">
                    <details className="group/sub mb-2">
                      <summary className="font-bold cursor-pointer select-none flex justify-between border-b pb-1">
                        <span>3.1 Kelengkapan Isi</span>
                        <span className="font-mono">{showDetailModal.kelengkapan_poin} / 20</span>
                      </summary>
                      <div className="pl-4 mt-2 space-y-2 text-xs text-gray-800">
                        <p>Struktur Bab Wajib: Pendahuluan, Tujuan, Alat, TA.</p>
                        <p>Dasar Teori: Referensi IEEE, dilarang copas Web/AI, minimal 3 baris.</p>
                        <p>Percobaan & Pembahasan: Paragraf pengantar, kalimat kerja aktif.</p>
                        <p>Kesimpulan: Analisis mendalam, tidak sekedar rangkuman.</p>
                        <p>Daftar Referensi: Sinkron dengan sitasi teks.</p>
                        {showDetailModal.kelengkapan_poin < 20 && <p className="text-[var(--red)] mt-2 font-italic">* Lihat rincian penalti di bawah</p>}
                      </div>
                    </details>
                    <details className="group/sub mb-2">
                      <summary className="font-bold cursor-pointer select-none flex justify-between border-b pb-1">
                        <span>3.2 Kerapihan Penulisan</span>
                        <span className="font-mono">{showDetailModal.kerapihan_poin} / 12</span>
                      </summary>
                      <div className="pl-4 mt-2 space-y-2 text-xs text-gray-800">
                        <p>Font & Spacing: Times New Roman 12, Spasi 1.5.</p>
                        <p>Istilah Asing: Wajib italic untuk terminologi IT/PBO.</p>
                        <p>Penulisan Gambar: Caption di bawah tengah (Gambar X. Judul).</p>
                        <p>Halaman & Bahasa: Bahasa baku, minim typo, nomor di tengah bawah.</p>
                        {showDetailModal.kerapihan_poin < 12 && <p className="text-[var(--red)] mt-2 font-italic">* Lihat rincian penalti di bawah</p>}
                      </div>
                    </details>
                    <div className="flex justify-between items-start font-bold">
                      <span>3.3 Ketepatan Pengumpulan</span>
                      <span className="font-mono">{showDetailModal.ketepatan_poin} / 8</span>
                    </div>
                  </div>
                </details>
              </div>

              {/* Format Output Final & Penalti */}
              <div className="mt-6 border-2 border-[var(--dark)] bg-[var(--yellow)]">
                <div className="p-3 border-b-2 border-[var(--dark)] bg-[var(--dark)] text-white font-bold flex items-center gap-2">
                  <Brain size={16} /> OUTPUT EVALUASI AI
                </div>
                <div className="p-4">
                  <div className="mb-4 bg-white p-3 border-2 border-[var(--dark)] font-mono text-sm whitespace-pre-wrap">
                    {showDetailModal.ai_feedback?.catatan_overall || 'Data feedback tidak tersedia.'}
                  </div>
                  {/* List Penalti Dinamis */}
                  {(() => {
                    const aiPenalties = showDetailModal.ai_feedback?.penalti?.filter((p: any) => p.poin_dikurangi > 0) || [];
                    const combinedPenalties = [...aiPenalties];
                    
                    if (showDetailModal.kehadiran_poin < 10) {
                      combinedPenalties.unshift({
                        komponen: '1.1 Kehadiran',
                        poin_dikurangi: 10 - showDetailModal.kehadiran_poin,
                        penjelasan: showDetailModal.kehadiran_poin === 0 ? 'Praktikan Alpa / Tanpa Keterangan' : 'Praktikan Sakit / Izin',
                        lokasi: 'Sistem Absensi'
                      });
                    }

                    if (combinedPenalties.length === 0) return null;

                    return (
                      <div className="bg-white p-3 border-2 border-[var(--dark)] border-t-4 border-t-[var(--red)]">
                        <h4 className="font-bold text-[var(--red)] mb-2 flex items-center gap-2">
                          <X size={16} /> RINCIAN PENALTI
                        </h4>
                        <div className="space-y-3">
                          {combinedPenalties.map((p: any, idx: number) => (
                            <div key={idx} className="text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                              <p className="font-bold">{p.komponen} <span className="text-[var(--red)]">(-{p.poin_dikurangi} Poin)</span></p>
                              <p className="text-gray-700 italic">"{p.penjelasan}"</p>
                              <p className="text-xs bg-[var(--muted)] p-1 inline-block mt-1 border border-[var(--dark)]">
                                Lokasi: {p.lokasi}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t-2 border-[var(--dark)] flex justify-end gap-3 flex-shrink-0">
              <Button variant="secondary" onClick={() => setShowDetailModal(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
