import { createClient } from './client';

/**
 * Mendapatkan public URL untuk sebuah file dari Supabase Storage.
 * Digunakan untuk menampilkan gambar atau link download.
 *
 * @param bucket - Nama bucket (misalnya 'submissions')
 * @param path - Path file di dalam bucket
 * @returns Public URL string
 */
export function getPublicUrl(bucket: string, path: string): string {
  // Hanya inisialisasi di sisi client untuk menghindari error server-side
  // Pada client component, ini aman digunakan secara sinkronus.
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  
  return data.publicUrl;
}
