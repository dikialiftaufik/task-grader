'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import Dialog, { useDialog } from '@/components/ui/Dialog';
import { Upload, Search, Download, X, Brain, FileText, Code, BookOpen, UploadCloud, Trash2, Eye, Send, CheckCircle2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { calcIndeks, OVERRIDABLE_FIELDS, getFieldMax, getFieldLabel } from '@/lib/scoring/rubric';
import type { Module, User, Grade } from '@/types';

interface GradeRow extends Grade {
  full_name: string;
  nim: string;
  module_number: number;
}

export default function KelolaNilaiPage() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [praktikans, setPraktikans] = useState<User[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Submission modal
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<GradeRow | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState<number | ''>('');
  const [editReason, setEditReason] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formUserId, setFormUserId] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formDelay, setFormDelay] = useState('0');
  
  // Dynamic Attendance
  const [fetchedAttendance, setFetchedAttendance] = useState<'hadir' | 'izin' | 'sakit' | 'alpa' | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [publishing, setPublishing] = useState(false);

  // Files
  const [formLaporan, setFormLaporan] = useState<File | null>(null);
  const [formSourceFiles, setFormSourceFiles] = useState<File[]>([]);
  const [formModulAcuan, setFormModulAcuan] = useState<File | null>(null);

  // Result dialog
  const { dialogState, showDialog, closeDialog } = useDialog();

  useEffect(() => {
    loadData();
  }, [currentPage, selectedModule, searchQuery]);

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
    setLoading(true);
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

    let query = supabase
      .from('grades')
      .select('*, users!grades_user_id_fkey!inner(full_name, nim), modules!inner(number)', { count: 'exact' })
      .order('module_id');

    if (selectedModule) {
      query = query.eq('module_id', selectedModule);
    }

    if (searchQuery && usersData) {
      const q = searchQuery.toLowerCase();
      const matchingUserIds = (usersData as User[])
        .filter(p => p.full_name.toLowerCase().includes(q) || p.nim?.includes(q))
        .map(p => p.id);
        
      if (matchingUserIds.length === 0) {
        setGrades([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      query = query.in('user_id', matchingUserIds);
    }

    const { data: gradesData, count } = await query.range(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE - 1
    );

    if (gradesData) {
      setGrades(
        gradesData.map((g: Record<string, unknown>) => {
          const user = g.users as Record<string, unknown>;
          const module = g.modules as Record<string, unknown>;
          return {
            ...g,
            full_name: user?.full_name as string || '',
            nim: user?.nim as string || '',
            module_number: module?.number as number || g.module_id,
            indeks: calcIndeks(g.nilai_final as number),
          } as GradeRow;
        })
      );
      if (count !== null) setTotalCount(count);
    }

    setLoading(false);
  }

  async function handlePublish(gradeIds: string[]) {
    if (gradeIds.length === 0) return;
    
    setPublishing(true);
    try {
      const res = await fetch('/api/grade/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade_ids: gradeIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.count} nilai berhasil dipublish`);
        loadData();
      } else {
        toast.error(data.error || 'Gagal mempublish nilai');
      }
    } catch {
      toast.error('Koneksi gagal');
    }
    setPublishing(false);
  }

  async function handleDelete(gradeId: string, fullName: string) {
    showDialog({
      title: 'Hapus Nilai',
      message: `Apakah Anda yakin ingin menghapus nilai untuk praktikan ${fullName}? Tindakan ini tidak dapat dibatalkan.`,
      variant: 'error',
      confirmText: 'Hapus',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/grade/${gradeId}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            toast.success('Nilai berhasil dihapus');
            closeDialog();
            loadData();
          } else {
            toast.error(data.error || 'Gagal menghapus nilai');
          }
        } catch {
          toast.error('Koneksi gagal');
        }
      }
    });
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

  function handleExport() {
    const exportData = grades.map(g => ({
      'NIM': g.nim,
      'Nama': g.full_name,
      'Modul': `Modul ${g.module_number}`,
      'Komp.1 /30': g.komponen1_total,
      'Komp.2 /30': g.komponen2_total,
      'Komp.3 /40': g.komponen3_total,
      'Total': g.nilai_final,
      'Indeks': g.indeks || '-',
      'AI Confidence': g.ai_confidence ? g.ai_confidence.toUpperCase() : '-',
      'Status': g.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const wscols = [
      {wch: 15}, // NIM
      {wch: 30}, // Nama
      {wch: 10}, // Modul
      {wch: 12}, // Komp.1
      {wch: 12}, // Komp.2
      {wch: 12}, // Komp.3
      {wch: 8},  // Total
      {wch: 8},  // Indeks
      {wch: 15}, // AI Confidence
      {wch: 15}  // Status
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai TaskGrader");
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `nilai-taskgrader-${date}.xlsx`);
  }

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="section-title section-title-asprak">PENILAIAN AI</h1>
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
            Upload submission untuk dinilai secara otomatis
          </p>
        </div>
        <div className="flex gap-3">
          {grades.some(g => g.status === 'ai_reviewed') && (
            <Button 
              variant="secondary" 
              icon={<Send size={16} />} 
              onClick={() => handlePublish(grades.filter(g => g.status === 'ai_reviewed').map(g => g.id))}
              loading={publishing}
            >
              Publish Semua
            </Button>
          )}
          <Button variant="primary-asprak" icon={<Upload size={16} />} onClick={() => setShowModal(true)}>
            Input Submission
          </Button>
          <Button 
            variant="secondary" 
            icon={<Download size={16} />} 
            onClick={handleExport}
            disabled={grades.length === 0}
            title="Export data yang sedang ditampilkan ke Excel"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="mb-6 bg-[var(--muted)]" padding="sm" shadow={false}>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td><div className="h-6 bg-gray-200 rounded w-10"></div></td>
                    <td><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    <td><div className="h-6 bg-gray-200 rounded w-24"></div></td>
                    <td><div className="h-8 bg-gray-200 rounded w-24"></div></td>
                  </tr>
                ))
              ) : grades.length > 0 ? (
                grades.map((g) => (
                  <tr key={g.id}>
                    <td className="font-mono text-sm">{g.nim}</td>
                    <td>{g.full_name}</td>
                    <td className="font-bold">Modul {g.module_number}</td>
                    <td className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {g.nilai_final}
                    </td>
                    <td><Badge variant="indeks" value={g.indeks || '-'} /></td>
                    <td><Badge variant="confidence" value={g.ai_confidence?.toUpperCase() || '-'} /></td>
                    <td><Badge variant="status" value={g.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="p-1.5 hover:bg-[var(--muted)] border-2 border-transparent hover:border-[var(--dark)] transition-all rounded"
                          title="Lihat Detail"
                          onClick={() => setShowDetailModal(g)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-[var(--red)] hover:text-white border-2 border-transparent hover:border-[var(--dark)] transition-all rounded text-[var(--red)]"
                          title="Hapus Nilai"
                          onClick={() => handleDelete(g.id, g.full_name)}
                        >
                          <Trash2 size={16} />
                        </button>
                        {g.status === 'ai_reviewed' && (
                          <button 
                            className="p-1.5 hover:bg-[var(--green)] hover:text-white border-2 border-transparent hover:border-[var(--dark)] transition-all rounded text-[var(--green)]"
                            title="Publish Nilai"
                            onClick={() => handlePublish([g.id])}
                          >
                            <Send size={16} />
                          </button>
                        )}
                      </div>
                    </td>
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

      {/* Pagination UI */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm">
          <p className="text-[var(--muted-text)]">
            Menampilkan <span className="font-bold text-[var(--dark)]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>-
            <span className="font-bold text-[var(--dark)]">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> dari <span className="font-bold text-[var(--dark)]">{totalCount}</span> hasil
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 neo-pill bg-[var(--white)] text-[var(--dark)] hover:bg-[var(--yellow)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 font-bold" style={{ fontFamily: 'var(--font-display)' }}>{currentPage}</span>
            <button
              className="px-3 py-1 neo-pill bg-[var(--white)] text-[var(--dark)] hover:bg-[var(--yellow)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * ITEMS_PER_PAGE >= totalCount}
            >
              Next
            </button>
          </div>
        </div>
      )}

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

      {/* ━━━━ Detail Modal ━━━━ */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal-box" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b-2 border-[var(--dark)] pb-4 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  Detail Penilaian AI
                </h2>
                <p className="text-sm">
                  <span className="font-mono font-bold mr-2">{showDetailModal.nim}</span>
                  {showDetailModal.full_name} — Modul {showDetailModal.module_number}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditMode(!editMode)} className={`p-2 border-2 transition-colors ${editMode ? 'bg-[var(--dark)] text-white border-[var(--dark)]' : 'hover:bg-[var(--yellow)] border-transparent hover:border-[var(--dark)]'}`} aria-label="Edit Nilai">
                  <Pencil size={20} />
                </button>
                <button onClick={() => { setShowDetailModal(null); setEditMode(false); setEditField(''); setEditReason(''); }} className="p-2 hover:bg-[var(--red)] hover:text-white border-2 border-transparent hover:border-[var(--dark)] transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content scrollable */}
            <div className="overflow-y-auto pr-2 pb-4 space-y-6">
              
              {editMode && (
                <div className="p-4 bg-[var(--yellow)] border-2 border-[var(--dark)] mb-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Pencil size={18}/> Override Nilai Manual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">Komponen Nilai</label>
                      <select 
                        className="neo-input w-full"
                        value={editField}
                        onChange={(e) => {
                          const field = e.target.value;
                          setEditField(field);
                          setEditValue(field ? (showDetailModal as any)[field] ?? '' : '');
                        }}
                      >
                        <option value="">-- Pilih Komponen --</option>
                        {OVERRIDABLE_FIELDS.map(f => (
                          <option key={f} value={f}>{getFieldLabel(f as any)} (Max: {getFieldMax(f as any)})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Nilai Baru</label>
                      <Input 
                        type="number"
                        min="0"
                        max={editField ? getFieldMax(editField as any) : 100}
                        value={editValue.toString()}
                        onChange={(e) => setEditValue(e.target.value ? parseFloat(e.target.value) : '')}
                        disabled={!editField}
                        placeholder="Masukkan nilai"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold mb-1">Alasan Override (wajib, min 10 karakter)</label>
                    <textarea 
                      className="neo-input w-full min-h-[80px]"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="Contoh: AI gagal mengenali fungsi X padahal sudah diimplementasikan..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditMode(false)}>Batal</Button>
                    <Button 
                      variant="primary-asprak" 
                      loading={overriding}
                      disabled={!editField || editValue === '' || editReason.length < 10 || (typeof editValue === 'number' && editValue > getFieldMax(editField as any))}
                      onClick={async () => {
                        try {
                          setOverriding(true);
                          const res = await fetch(`/api/grade/${showDetailModal.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ field: editField, value: editValue, reason: editReason })
                          });
                          const data = await res.json();
                          if (data.success) {
                            toast.success('Nilai berhasil di-override');
                            loadData();
                            setEditMode(false);
                            setEditReason('');
                            setEditField('');
                            setShowDetailModal(null);
                          } else {
                            toast.error(data.error || 'Gagal override nilai');
                          }
                        } catch (err) {
                          toast.error('Koneksi gagal');
                        } finally {
                          setOverriding(false);
                        }
                      }}
                    >
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>
              )}
              
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
                    {/* 3.1 */}
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
                    {/* 3.2 */}
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
                    {/* 3.3 */}
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
                  {/* Catatan Keseluruhan */}
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
              <Button variant="secondary" onClick={() => { setShowDetailModal(null); setEditMode(false); setEditField(''); setEditReason(''); }}>
                Tutup
              </Button>
              {showDetailModal.status === 'ai_reviewed' && (
                <Button 
                  variant="primary-asprak" 
                  icon={<Send size={16} />}
                  onClick={() => {
                    handlePublish([showDetailModal.id]);
                    setShowDetailModal(null);
                  }}
                >
                  Publish Nilai Ini
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
