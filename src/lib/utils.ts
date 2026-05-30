import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AttendanceStatus, IndeksHuruf, SubmissionStatus, AIConfidence, DisputeStatus } from '@/types';

/**
 * Merge Tailwind classes with clsx for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date ke format Indonesia (contoh: "21 Mei 2025")
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format datetime ke format Indonesia (contoh: "21 Mei 2025, 09:14 WIB")
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (contoh: "5 menit lalu", "2 jam lalu")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return formatDate(date);
}

/**
 * Warna untuk setiap indeks huruf
 */
export function getIndeksColor(indeks: IndeksHuruf | string | null): string {
  switch (indeks) {
    case 'A': return '#00C48C';
    case 'AB': return '#0057FF';
    case 'B': return '#3B82F6';
    case 'BC': return '#FFE500';
    case 'C': return '#F59E0B';
    case 'D': return '#FF9500';
    case 'E': return '#FF3B3B';
    default: return '#999999';
  }
}

/**
 * Warna background untuk setiap indeks
 */
export function getIndeksBgColor(indeks: IndeksHuruf | string | null): string {
  switch (indeks) {
    case 'A': return '#E6F9F1';
    case 'AB': return '#E6EFFF';
    case 'B': return '#EBF3FF';
    case 'BC': return '#FFFBE6';
    case 'C': return '#FFF5E6';
    case 'D': return '#FFF0E6';
    case 'E': return '#FFE6E6';
    default: return '#F0F0F0';
  }
}

/**
 * Warna untuk status kehadiran
 */
export function getAttendanceColor(status: string) {
  switch (status) {
    case 'hadir':
      return 'var(--green)';
    case 'izin':
      return 'var(--blue)';
    case 'sakit':
      return 'var(--orange)';
    case 'alpa':
      return 'var(--red)';
    default:
      return 'var(--dark)';
  }
}

/**
 * Label untuk status kehadiran
 */
export function getAttendanceLabel(status: string) {
  switch (status) {
    case 'hadir':
      return 'Hadir';
    case 'izin':
      return 'Izin';
    case 'sakit':
      return 'Sakit';
    case 'alpa':
      return 'Alpa';
    default:
      return '-';
  }
}

/**
 * Warna untuk status submission
 */
export function getStatusColor(status: SubmissionStatus): string {
  switch (status) {
    case 'draft': return '#999999';
    case 'ai_reviewed': return '#0057FF';
    case 'final': return '#00C48C';
    case 'disputed': return '#FF3B3B';
  }
}

/**
 * Label untuk status submission
 */
export function getStatusLabel(status: SubmissionStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'ai_reviewed': return 'AI Reviewed';
    case 'final': return 'Final';
    case 'disputed': return 'Disputed';
  }
}

/**
 * Warna untuk AI confidence
 */
export function getConfidenceColor(confidence: AIConfidence | null): string {
  switch (confidence) {
    case 'high': return '#111111';
    case 'medium': return '#0057FF';
    case 'low': return '#FF3B3B';
    default: return '#999999';
  }
}

/**
 * Warna untuk dispute status
 */
export function getDisputeStatusColor(status: DisputeStatus): string {
  switch (status) {
    case 'baru': return '#FF3B3B';
    case 'diproses': return '#FFE500';
    case 'diterima': return '#00C48C';
    case 'ditolak': return '#FF3B3B';
  }
}

/**
 * Label untuk dispute status
 */
export function getDisputeStatusLabel(status: DisputeStatus): string {
  switch (status) {
    case 'baru': return 'Baru';
    case 'diproses': return 'Diproses';
    case 'diterima': return 'Diterima';
    case 'ditolak': return 'Ditolak';
  }
}

/**
 * Generate initials dari nama (contoh: "Diki Alif Taufik" → "DA")
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
