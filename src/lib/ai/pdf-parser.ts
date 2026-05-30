import pdf from 'pdf-parse';
import JSZip from 'jszip';

/**
 * Ekstrak teks dari file PDF.
 * Mengembalikan string kosong jika gagal.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

/**
 * Ekstrak file .java dari ZIP.
 * Mengembalikan map filename → content.
 */
export async function extractZipFiles(
  buffer: Buffer
): Promise<Record<string, string>> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const result: Record<string, string> = {};

    const files = Object.values(zip.files).filter(
      (f) => !f.dir && f.name.endsWith('.java')
    );

    for (const file of files) {
      const content = await file.async('text');
      result[file.name] = content;
    }

    return result;
  } catch (error) {
    console.error('ZIP extraction error:', error);
    return {};
  }
}

/**
 * Gabungkan semua file .java menjadi satu string.
 */
export function combineJavaFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([name, content]) => `// === ${name} ===\n${content}`)
    .join('\n\n');
}

/**
 * Baca file .java langsung (bukan dari ZIP).
 */
export function readJavaFileContent(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8');
  } catch {
    return '';
  }
}
