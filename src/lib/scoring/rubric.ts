import type { AttendanceStatus, IndeksHuruf, Grade } from '@/types';

/**
 * Hitung poin ketepatan pengumpulan berdasarkan hari terlambat.
 * Tepat waktu = 8 poin, berkurang 0.57 per hari terlambat.
 */
export function calcKetepatanPoin(delayDays: number): number {
  if (delayDays <= 0) return 8.0;
  return Math.max(0, parseFloat((8.0 - delayDays * 0.57).toFixed(2)));
}

/**
 * Hitung poin kelengkapan percobaan (linear, tanpa bracket).
 * Formula: (dikerjakan / total) × 20
 */
export function calcPercobaanPoin(dikerjakan: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((dikerjakan / total) * 20 * 100) / 100;
}

/**
 * Hitung nilai final dari semua komponen grade.
 * Range: 0–100
 */
export function calcNilaiFinal(grade: Partial<Grade>): number {
  const total =
    (grade.kehadiran_poin ?? 0) +
    (grade.percobaan_poin ?? 0) +
    (grade.fungsionalitas_poin ?? 0) +
    (grade.sintaks_poin ?? 0) +
    (grade.kualitas_poin ?? 0) +
    (grade.kelengkapan_poin ?? 0) +
    (grade.kerapihan_poin ?? 0) +
    (grade.ketepatan_poin ?? 0);
  return Math.max(0, Math.min(100, parseFloat(total.toFixed(2))));
}

/**
 * Konversi nilai numerik ke indeks huruf.
 */
export function calcIndeks(nilai: number): IndeksHuruf {
  if (nilai >= 85) return 'A';
  if (nilai >= 75) return 'AB';
  if (nilai >= 65) return 'B';
  if (nilai >= 60) return 'BC';
  if (nilai >= 50) return 'C';
  if (nilai > 40) return 'D';
  return 'E';
}

/**
 * Dapatkan poin kehadiran dari status.
 * Hadir = 10, Izin = 5, Alpa = 0
 */
export function getAttendancePoin(status: AttendanceStatus): number {
  switch (status) {
    case 'hadir': return 10;
    case 'izin': return 5;
    case 'alpa': return 0;
    default: return 0;
  }
}

/**
 * Hitung total komponen 1 (Kehadiran + Praktikum, max 30)
 */
export function calcKomponen1(kehadiranPoin: number, percobaanPoin: number): number {
  return parseFloat((kehadiranPoin + percobaanPoin).toFixed(2));
}

/**
 * Hitung total komponen 2 (Tugas Akhir, max 30)
 */
export function calcKomponen2(fungsionalitas: number, sintaks: number, kualitas: number): number {
  return parseFloat((fungsionalitas + sintaks + kualitas).toFixed(2));
}

/**
 * Hitung total komponen 3 (Buku Laporan, max 40)
 */
export function calcKomponen3(kelengkapan: number, kerapihan: number, ketepatan: number): number {
  return parseFloat((kelengkapan + kerapihan + ketepatan).toFixed(2));
}

/**
 * Daftar field grade yang boleh di-override oleh asprak
 */
export const OVERRIDABLE_FIELDS = [
  'kehadiran_poin',
  'percobaan_poin',
  'fungsionalitas_poin',
  'sintaks_poin',
  'kualitas_poin',
  'kelengkapan_poin',
  'kerapihan_poin',
  'ketepatan_poin',
] as const;

export type OverridableField = (typeof OVERRIDABLE_FIELDS)[number];

/**
 * Validasi apakah field boleh di-override
 */
export function isOverridableField(field: string): field is OverridableField {
  return OVERRIDABLE_FIELDS.includes(field as OverridableField);
}

/**
 * Batas maksimum per field
 */
export function getFieldMax(field: OverridableField): number {
  switch (field) {
    case 'kehadiran_poin': return 10;
    case 'percobaan_poin': return 20;
    case 'fungsionalitas_poin': return 15;
    case 'sintaks_poin': return 10;
    case 'kualitas_poin': return 5;
    case 'kelengkapan_poin': return 20;
    case 'kerapihan_poin': return 12;
    case 'ketepatan_poin': return 8;
  }
}

/**
 * Label bahasa Indonesia per field
 */
export function getFieldLabel(field: OverridableField): string {
  switch (field) {
    case 'kehadiran_poin': return 'Kehadiran';
    case 'percobaan_poin': return 'Kelengkapan Percobaan';
    case 'fungsionalitas_poin': return 'Fungsionalitas Program';
    case 'sintaks_poin': return 'Sintaks Wajib';
    case 'kualitas_poin': return 'Kualitas Kode';
    case 'kelengkapan_poin': return 'Kelengkapan Isi Laporan';
    case 'kerapihan_poin': return 'Kerapihan Penulisan';
    case 'ketepatan_poin': return 'Ketepatan Pengumpulan';
  }
}
