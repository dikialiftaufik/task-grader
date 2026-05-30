import type { IndeksHuruf } from '@/types';

/**
 * Mapping indeks huruf ke deskripsi
 */
export const INDEKS_DESCRIPTIONS: Record<IndeksHuruf, string> = {
  A: 'Sangat Baik',
  AB: 'Baik Sekali',
  B: 'Baik',
  BC: 'Cukup Baik',
  C: 'Cukup',
  D: 'Kurang',
  E: 'Sangat Kurang',
};

/**
 * Mapping indeks huruf ke range nilai
 */
export const INDEKS_RANGES: Record<IndeksHuruf, string> = {
  A: '≥ 85',
  AB: '75 – 84',
  B: '65 – 74',
  BC: '60 – 64',
  C: '50 – 59',
  D: '41 – 49',
  E: '≤ 40',
};

/**
 * Urutan indeks dari terbaik ke terburuk
 */
export const INDEKS_ORDER: IndeksHuruf[] = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'];

/**
 * Cek apakah indeks termasuk "lulus" (minimal C)
 */
export function isLulus(indeks: IndeksHuruf | null): boolean {
  if (!indeks) return false;
  const passingGrades: IndeksHuruf[] = ['A', 'AB', 'B', 'BC', 'C'];
  return passingGrades.includes(indeks);
}
