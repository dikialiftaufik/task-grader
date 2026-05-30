import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIFeedback } from '@/types';
import { calcKetepatanPoin } from '@/lib/scoring/rubric';
import { GRADING_SYSTEM_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GradingInput {
  laporanText: string;
  sourceCode: string;
  modulAcuanText: string;
  totalPercobaan: number;
  kehadiranStatus: 'hadir' | 'izin' | 'sakit' | 'alpa';
  delayDays: number;
  modulNumber: number;
}

export interface GradingResult {
  percobaan_dikerjakan: number;
  percobaan_poin: number;
  kehadiran_poin: number;
  fungsionalitas_poin: number;
  sintaks_poin: number;
  kualitas_poin: number;
  kelengkapan_poin: number;
  kerapihan_poin: number;
  ketepatan_poin: number;
  confidence: 'high' | 'medium' | 'low';
  feedback: AIFeedback;
  raw_response: string;
}

export async function gradeSubmission(input: GradingInput): Promise<GradingResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const kehadiranPoin =
    input.kehadiranStatus === 'hadir' ? 10 : (input.kehadiranStatus === 'izin' || input.kehadiranStatus === 'sakit') ? 5 : 0;

  const ketepatanPoin = calcKetepatanPoin(input.delayDays);

  const userPrompt = `
MODUL: ${input.modulNumber}
TOTAL PERCOBAAN MODUL INI: ${input.totalPercobaan}
KEHADIRAN: ${input.kehadiranStatus} (${kehadiranPoin} poin — sudah ditetapkan)
KETEPATAN: ${input.delayDays} hari terlambat (${ketepatanPoin.toFixed(2)} poin — sudah ditetapkan)

=== KONTEN MODUL ACUAN ===
${input.modulAcuanText.slice(0, 6000)}

=== LAPORAN PRAKTIKUM (TEXT) ===
${input.laporanText.slice(0, 12000)}

=== SOURCE CODE JAVA ===
${input.sourceCode.slice(0, 8000)}

Nilai sekarang berdasarkan rubrik. Output JSON murni saja.
`;

  const result = await model.generateContent({
    systemInstruction: GRADING_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 3000,
    },
  });

  const rawText = result.response.text();

  let parsed: Record<string, unknown>;
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('AI response is not valid JSON: ' + rawText.slice(0, 200));
  }

  return {
    percobaan_dikerjakan: (parsed.percobaan_dikerjakan as number) ?? 0,
    percobaan_poin: Math.max(0, (parsed.percobaan_poin as number) ?? 0),
    kehadiran_poin: kehadiranPoin,
    fungsionalitas_poin: Math.max(0, Math.min(15, (parsed.fungsionalitas_poin as number) ?? 0)),
    sintaks_poin: Math.max(0, Math.min(10, (parsed.sintaks_poin as number) ?? 0)),
    kualitas_poin: Math.max(0, Math.min(5, (parsed.kualitas_poin as number) ?? 0)),
    kelengkapan_poin: Math.max(0, Math.min(20, (parsed.kelengkapan_poin as number) ?? 0)),
    kerapihan_poin: Math.max(0, Math.min(12, (parsed.kerapihan_poin as number) ?? 0)),
    ketepatan_poin: ketepatanPoin,
    confidence: (parsed.confidence as 'high' | 'medium' | 'low') ?? 'medium',
    feedback: {
      penalti: (parsed.penalti as AIFeedback['penalti']) ?? [],
      kekuatan: (parsed.kekuatan as string[]) ?? [],
      catatan_overall: (parsed.catatan_overall as string) ?? '',
    },
    raw_response: rawText,
  };
}
