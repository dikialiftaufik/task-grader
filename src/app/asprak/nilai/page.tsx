'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import Dialog, { useDialog } from '@/components/ui/Dialog';
import { Upload, Search, Download, X, Brain, FileText, Code, BookOpen, UploadCloud, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import type { Module, User } from '@/types';

interface GradeRow {
  id: string;
  user_id: string;
  full_name: string;
  nim: string;
  nilai_final: number;
  indeks: string;
  ai_confidence: string;
  status: string;
  module_id: number;
}

export default function KelolaNilaiPage() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [praktikans, setPraktikans] = useState<User[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Submission modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formUserId, setFormUserId] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formDelay, setFormDelay] = useState('0');
  
  // Dynamic Attendance
  const [fetchedAttendance, setFetchedAttendance] = useState<'hadir' | 'izin' | 'sakit' | 'alpa' | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Files
  const [formLaporan, setFormLaporan] = useState<File | null>(null);
  const [formSourceFiles, setFormSourceFiles] = useState<File[]>([]);
  const [formModulAcuan, setFormModulAcuan] = useState<File | null>(null);

  // Result dialog
  const { dialogState, showDialog, closeDialog } = useDialog();

  useEffect(() => {
    loadData();
  }, []);

  // Fetch attendance automatically when user or module changes
  useEffect(() => {
    async function checkAttendance() {
      if (!formUserId || !formModuleId) {
        setFetchedAttendance(null);
        return;
      }
      setLoadingAttendance(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', formUserId)
        .eq('module_id', formModuleId)
        .single();
      
      if (data) {
        setFetchedAttendance(data.status as any);
      } else {
        setFetchedAttendance('alpa'); // Default to alpa if no record exists
      }
      setLoadingAttendance(false);
    }
    
    checkAttendance();
  }, [formUserId, formModuleId]);

  async function loadData() {
    const supabase = createClient();

    const { data: modulesData } = await supabase
      .from('modules')
      .select('*')
      .order('number');
    setModules((modulesData as Module[]) || []);

    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'praktikan')
      .order('full_name');
    setPraktikans((usersData as User[]) || []);

    const { data: gradesData } = await supabase
      .from('grades')
      .select('id, user_id, nilai_final, indeks, ai_confidence, status, module_id, users!inner(full_name, nim)')
      .order('module_id');

    if (gradesData) {
      setGrades(
        gradesData.map((g: Record<string, unknown>) => {
          const user = g.users as Record<string, unknown>;
          return {
            id: g.id as string,
            user_id: g.user_id as string,
            full_name: user?.full_name as string || '',
            nim: user?.nim as string || '',
            nilai_final: g.nilai_final as number || 0,
            indeks: g.indeks as string || '-',
            ai_confidence: g.ai_confidence as string || '-',
            status: g.status as string || 'draft',
            module_id: g.module_id as number,
          };
        })
      );
    }

    setLoading(false);
  }

  async function handleSubmit() {
    if (!formUserId || !formModuleId || !formLaporan) {
      toast.error('Praktikan, modul, dan laporan PDF wajib diisi');
      return;
    }

    if (formSourceFiles.length === 0) {
      toast.error('Upload source code (ZIP/RAR atau file .java)');
      return;
    }

    if (parseInt(formDelay) < 0) {
      toast.error('Keterlambatan tidak boleh bernilai negatif');
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('user_id', formUserId);
      fd.append('module_id', formModuleId);
      fd.append('delay_days', formDelay);
      fd.append('attendance_status', fetchedAttendance || 'alpa');
      fd.append('laporan_pdf', formLaporan);

      // Distinguish ZIP from Java files
      formSourceFiles.forEach((file) => {
        if (file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z')) {
          fd.append('source_zip', file);
        } else if (file.name.endsWith('.java')) {
          fd.append('java_files', file);
        }
      });

      if (formModulAcuan) fd.append('modul_acuan', formModulAcuan);

      const res = await fetch('/api/grade/submit', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();

      if (json.success) {
        setShowModal(false);
        resetForm();
        loadData();

        showDialog({
          title: 'Penilaian AI Selesai',
          message: `Nilai akhir: ${json.data.nilai_final} | Confidence: ${json.data.confidence.toUpperCase()}`,
          variant: 'success',
          confirmText: 'Lihat Hasil',
        });
      } else {
        showDialog({
          title: 'Gagal Memproses',
          message: json.error || 'Terjadi kesalahan saat memproses submission.',
          variant: 'error',
        });
      }
    } catch {
      showDialog({
        title: 'Koneksi Gagal',
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        variant: 'error',
      });
    }

    setSubmitting(false);
  }

  function resetForm() {
    setFormUserId('');
    setFormModuleId('');
    setFormDelay('0');
    setFetchedAttendance(null);
    setFormLaporan(null);
    setFormSourceFiles([]);
    setFormModulAcuan(null);
  }

  const filteredGrades = grades.filter((g) => {
    if (selectedModule && g.module_id !== selectedModule) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.full_name.toLowerCase().includes(q) || g.nim.includes(q);
    }
    return true;
  });

  // --- Dropzone setups ---
  const onDropLaporan = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setFormLaporan(acceptedFiles[0]);
  }, []);
  const { getRootProps: getPropsLaporan, getInputProps: getInputLaporan, isDragActive: isDragLaporan } = useDropzone({
    onDrop: onDropLaporan, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1
  });

  const onDropSource = useCallback((acceptedFiles: File[]) => {
    setFormSourceFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);
  const { getRootProps: getPropsSource, getInputProps: getInputSource, isDragActive: isDragSource } = useDropzone({
    onDrop: onDropSource, accept: { 'application/zip': ['.zip'], 'application/x-rar-compressed': ['.rar'], 'text/x-java-source': ['.java'] }
  });

  const onDropAcuan = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setFormModulAcuan(acceptedFiles[0]);
  }, []);
  const { getRootProps: getPropsAcuan, getInputProps: getInputAcuan, isDragActive: isDragAcuan } = useDropzone({
    onDrop: onDropAcuan, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1
  });

  const removeSourceFile = (idx: number) => {
    setFormSourceFiles((prev) => prev.filter((_, i) => i !== idx));
  };


  if (loading) {
    return (
      <div>
        <Skeleton height={40} width={300} />
        <Skeleton height={300} className="mt-6" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title section-title-asprak">PENILAIAN AI</h1>
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
            Upload submission untuk dinilai secara otomatis
          </p>
        </div>
        <Button variant="primary-asprak" icon={<Upload size={16} />} onClick={() => setShowModal(true)}>
          Input Submission
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="mb-6" padding="sm" shadow={false} style={{ background: 'var(--muted)' } as React.CSSProperties}>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="neo-input w-auto"
            value={selectedModule || ''}
            onChange={(e) => setSelectedModule(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Semua Modul</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                Modul {m.number}: {m.title}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
            <input
              className="neo-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Cari NIM atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                <th>Modul</th>
                <th>Total</th>
                <th>Indeks</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((g) => (
                  <tr key={g.id}>
                    <td className="font-mono text-sm">{g.nim}</td>
                    <td>{g.full_name}</td>
                    <td>{g.module_id}</td>
                    <td className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {g.nilai_final}
                    </td>
                    <td><Badge variant="indeks" value={g.indeks} /></td>
                    <td><Badge variant="confidence" value={g.ai_confidence?.toUpperCase() || '-'} /></td>
                    <td><Badge variant="status" value={g.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: 'var(--muted-text)' }}>
                    {grades.length === 0
                      ? 'Belum ada penilaian. Klik "Input Submission" untuk memulai.'
                      : 'Tidak ada data yang cocok dengan filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ━━━━ Submission Modal ━━━━ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '800px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 border-b-2 border-[var(--dark)] pb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 flex items-center justify-center neo-shadow-sm"
                  style={{ background: 'var(--yellow)', border: '2px solid var(--dark)' }}
                >
                  <Brain size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    Input Submission
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-text)' }}>
                    Unggah dokumen laporan dan source code praktikan, lalu biarkan AI yang menilai otomatis.
                  </p>
                </div>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center border-2 border-[var(--dark)] hover:bg-[var(--red)] hover:text-white transition-colors"
                style={{ position: 'static' }}
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-8 mt-4">
              {/* Praktikan & Modul */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Praktikan *
                  </label>
                  <select
                    className="neo-input w-full whitespace-normal break-words"
                    style={{ minHeight: '44px' }}
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                  >
                    <option value="">-- Pilih Mahasiswa --</option>
                    {praktikans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nim} — {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Modul *
                  </label>
                  <select
                    className="neo-input w-full whitespace-normal break-words"
                    style={{ minHeight: '44px' }}
                    value={formModuleId}
                    onChange={(e) => setFormModuleId(e.target.value)}
                  >
                    <option value="">-- Pilih Modul Praktikum --</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        Modul {m.number}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendance & Delay */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Status Kehadiran (Otomatis)
                  </label>
                  <div className="neo-input w-full bg-[var(--muted)] flex items-center" style={{ minHeight: '44px' }}>
                    {loadingAttendance ? (
                      <span className="text-sm text-[var(--muted-text)] font-medium animate-pulse">Mengecek data...</span>
                    ) : fetchedAttendance ? (
                      <span className={`text-sm font-bold uppercase ${
                        fetchedAttendance === 'hadir' ? 'text-[var(--green)]' : 
                        fetchedAttendance === 'alpa' ? 'text-[var(--red)]' : 'text-[var(--orange)]'
                      }`}>
                        {fetchedAttendance === 'hadir' ? '✓ Hadir' : 
                         fetchedAttendance === 'izin' ? 'I - Izin' : 
                         fetchedAttendance === 'sakit' ? 'S - Sakit' : '✗ Alpa'}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--muted-text)] font-medium">-- Pilih praktikan & modul --</span>
                    )}
                  </div>
                </div>
                <Input
                  label="Keterlambatan (hari)"
                  type="number"
                  min="0"
                  value={formDelay}
                  onChange={(e) => {
                    if (parseInt(e.target.value) >= 0 || e.target.value === '') {
                      setFormDelay(e.target.value);
                    }
                  }}
                />
              </div>

              {/* File uploads - DROPZONES */}
              <div className="space-y-6">
                {/* Laporan PDF */}
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <FileText size={14} className="inline mr-1" /> Laporan PDF *
                  </label>
                  <div
                    {...getPropsLaporan()}
                    className={`neo-dropzone ${isDragLaporan ? 'neo-dropzone-active' : ''}`}
                  >
                    <input {...getInputLaporan()} />
                    {formLaporan ? (
                      <div className="flex items-center gap-2 text-[var(--blue)]">
                        <FileText size={20} />
                        <span className="font-bold text-sm truncate">{formLaporan.name}</span>
                        <span className="text-xs text-[var(--muted-text)]">
                          ({(formLaporan.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadCloud size={24} className="mx-auto mb-2 text-[var(--muted-text)]" />
                        <p className="text-sm font-medium">Drag & drop Laporan PDF ke sini</p>
                        <p className="text-xs text-[var(--muted-text)] mt-1">atau klik untuk memilih file</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source Code */}
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Code size={14} className="inline mr-1" /> Source Code (ZIP/RAR atau Multi .java) *
                  </label>
                  <div
                    {...getPropsSource()}
                    className={`neo-dropzone ${isDragSource ? 'neo-dropzone-active' : ''}`}
                  >
                    <input {...getInputSource()} />
                    <div className="text-center">
                      <UploadCloud size={24} className="mx-auto mb-2 text-[var(--muted-text)]" />
                      <p className="text-sm font-medium">Drag & drop file source code ke sini</p>
                      <p className="text-xs text-[var(--muted-text)] mt-1">Mendukung .zip, .rar, atau gabungan banyak file .java</p>
                    </div>
                  </div>
                  {/* File List */}
                  {formSourceFiles.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-2">
                      {formSourceFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-[var(--muted)] border-2 border-[var(--dark)] text-sm">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Code size={14} className="flex-shrink-0" />
                            <span className="truncate font-medium">{file.name}</span>
                          </div>
                          <button onClick={() => removeSourceFile(idx)} className="text-[var(--red)] hover:text-red-700 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modul Acuan */}
                <div>
                  <label className="block text-xs font-semibold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <BookOpen size={14} className="inline mr-1" /> Modul Acuan (Opsional)
                  </label>
                  <div
                    {...getPropsAcuan()}
                    className={`neo-dropzone ${isDragAcuan ? 'neo-dropzone-active' : ''}`}
                    style={{ padding: '16px' }}
                  >
                    <input {...getInputAcuan()} />
                    {formModulAcuan ? (
                      <div className="flex items-center justify-center gap-2 text-[var(--yellow)]">
                        <BookOpen size={20} className="text-[var(--dark)]" />
                        <span className="font-bold text-sm truncate text-[var(--dark)]">{formModulAcuan.name}</span>
                      </div>
                    ) : (
                      <div className="text-center text-sm">
                        <span className="font-bold underline decoration-2 cursor-pointer">Pilih PDF Modul Acuan</span> jika ingin evaluasi sintaks spesifik
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t-2 border-[var(--dark)] mt-4">
                <Button
                  variant="primary-asprak"
                  fullWidth
                  size="lg"
                  loading={submitting}
                  onClick={handleSubmit}
                  icon={<Brain size={20} />}
                  className="py-4 text-base"
                >
                  {submitting ? 'AI Sedang Menganalisis Dokumen...' : 'MULAI PENILAIAN AI SEKARANG'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Dialog */}
      <Dialog {...dialogState} onClose={closeDialog} />
    </div>
  );
}
