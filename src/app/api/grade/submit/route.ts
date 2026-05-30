import { createServer } from '@/lib/supabase/server';
import { createAdmin } from '@/lib/supabase/admin';
import { gradeSubmission } from '@/lib/ai/grader';
import { extractPdfText, extractZipFiles, combineJavaFiles, readJavaFileContent } from '@/lib/ai/pdf-parser';
import { calcKetepatanPoin } from '@/lib/scoring/rubric';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60s for AI processing

export async function POST(request: Request) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    // Check asprak role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'asprak') {
      return NextResponse.json({ success: false, error: 'Hanya asprak yang boleh akses' }, { status: 403 });
    }

    const formData = await request.formData();
    const userId = formData.get('user_id') as string;
    const moduleId = parseInt(formData.get('module_id') as string);
    const delayDays = parseInt(formData.get('delay_days') as string) || 0;
    const attendanceStatus = formData.get('attendance_status') as 'hadir' | 'izin' | 'alpa';
    const laporanPdf = formData.get('laporan_pdf') as File | null;
    const modulAcuan = formData.get('modul_acuan') as File | null;

    // Source code bisa ZIP, RAR, atau langsung .java
    const sourceZip = formData.get('source_zip') as File | null;
    const javaFiles = formData.getAll('java_files') as File[];

    if (!userId || !moduleId || !laporanPdf) {
      return NextResponse.json(
        { success: false, error: 'user_id, module_id, dan laporan_pdf wajib diisi' },
        { status: 400 }
      );
    }

    const admin = createAdmin();

    // 1. Upload files to Supabase Storage
    const prefix = `${userId}/modul-${moduleId}`;
    let laporanPath = '';
    let sourceZipPath = '';
    const javaFilePaths: string[] = [];
    let modulAcuanPath = '';

    // Upload laporan PDF
    const laporanBuffer = Buffer.from(await laporanPdf.arrayBuffer());
    const { error: laporanError } = await admin.storage
      .from('laporan-pdf')
      .upload(`${prefix}/laporan.pdf`, laporanBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (laporanError) throw new Error('Gagal upload laporan: ' + laporanError.message);
    laporanPath = `${prefix}/laporan.pdf`;

    // Upload source code (ZIP/RAR)
    if (sourceZip) {
      const sourceBuffer = Buffer.from(await sourceZip.arrayBuffer());
      const ext = sourceZip.name.split('.').pop() || 'zip';
      const { error: sourceError } = await admin.storage
        .from('source-code')
        .upload(`${prefix}/source.${ext}`, sourceBuffer, {
          contentType: sourceZip.type || 'application/octet-stream',
          upsert: true,
        });
      if (sourceError) throw new Error('Gagal upload source: ' + sourceError.message);
      sourceZipPath = `${prefix}/source.${ext}`;
    }

    // Upload individual .java files
    for (const file of javaFiles) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const filePath = `${prefix}/${file.name}`;
      await admin.storage
        .from('java-files')
        .upload(filePath, fileBuffer, {
          contentType: 'text/plain',
          upsert: true,
        });
      javaFilePaths.push(filePath);
    }

    // Upload modul acuan
    if (modulAcuan) {
      const modulBuffer = Buffer.from(await modulAcuan.arrayBuffer());
      const { error: modulError } = await admin.storage
        .from('modul-acuan')
        .upload(`modul-${moduleId}/modul_acuan.pdf`, modulBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (!modulError) modulAcuanPath = `modul-${moduleId}/modul_acuan.pdf`;
    }

    // 2. Upsert submission record
    const ketepatanPoin = calcKetepatanPoin(delayDays);
    await admin.from('submissions').upsert(
      {
        user_id: userId,
        module_id: moduleId,
        laporan_pdf_path: laporanPath,
        source_zip_path: sourceZipPath || null,
        java_files_paths: javaFilePaths,
        modul_acuan_path: modulAcuanPath || null,
        submission_delay_days: delayDays,
        ketepatan_poin: ketepatanPoin,
      },
      { onConflict: 'user_id,module_id' }
    );

    // 3. Update attendance
    const attPoin = attendanceStatus === 'hadir' ? 10 : attendanceStatus === 'izin' ? 5 : 0;
    await admin.from('attendance').upsert(
      {
        user_id: userId,
        module_id: moduleId,
        status: attendanceStatus,
        point: attPoin,
        updated_by: user.id,
      },
      { onConflict: 'user_id,module_id' }
    );

    // 4. Extract text for AI
    const laporanText = await extractPdfText(laporanBuffer);

    let sourceCode = '';
    // Try ZIP extraction
    if (sourceZip) {
      const sourceBuffer = Buffer.from(await sourceZip.arrayBuffer());
      const zipFiles = await extractZipFiles(sourceBuffer);
      sourceCode = combineJavaFiles(zipFiles);
    }
    // Try individual .java files
    if (!sourceCode && javaFiles.length > 0) {
      const codeMap: Record<string, string> = {};
      for (const file of javaFiles) {
        const buf = Buffer.from(await file.arrayBuffer());
        codeMap[file.name] = readJavaFileContent(buf);
      }
      sourceCode = combineJavaFiles(codeMap);
    }

    let modulAcuanText = '';
    if (modulAcuan) {
      const modulBuffer = Buffer.from(await modulAcuan.arrayBuffer());
      modulAcuanText = await extractPdfText(modulBuffer);
    }

    // 5. Get module info
    const { data: moduleData } = await admin
      .from('modules')
      .select('total_experiments, number')
      .eq('id', moduleId)
      .single();

    // 6. AI Grading
    let gradingResult;
    try {
      gradingResult = await gradeSubmission({
        laporanText,
        sourceCode,
        modulAcuanText,
        totalPercobaan: moduleData?.total_experiments || 0,
        kehadiranStatus: attendanceStatus,
        delayDays,
        modulNumber: moduleData?.number || moduleId,
      });
    } catch (aiError) {
      console.error('AI grading error:', aiError);
      // Fallback: save with zero scores and low confidence
      gradingResult = {
        percobaan_dikerjakan: 0,
        percobaan_poin: 0,
        kehadiran_poin: attPoin,
        fungsionalitas_poin: 0,
        sintaks_poin: 0,
        kualitas_poin: 0,
        kelengkapan_poin: 0,
        kerapihan_poin: 0,
        ketepatan_poin: ketepatanPoin,
        confidence: 'low' as const,
        feedback: {
          penalti: [],
          kekuatan: [],
          catatan_overall: 'AI gagal memproses. Perlu review manual.',
        },
        raw_response: String(aiError),
      };
    }

    // 7. Upsert grade
    const { data: gradeData, error: gradeError } = await admin
      .from('grades')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          kehadiran_poin: gradingResult.kehadiran_poin,
          percobaan_dikerjakan: gradingResult.percobaan_dikerjakan,
          percobaan_poin: gradingResult.percobaan_poin,
          fungsionalitas_poin: gradingResult.fungsionalitas_poin,
          sintaks_poin: gradingResult.sintaks_poin,
          kualitas_poin: gradingResult.kualitas_poin,
          kelengkapan_poin: gradingResult.kelengkapan_poin,
          kerapihan_poin: gradingResult.kerapihan_poin,
          ketepatan_poin: gradingResult.ketepatan_poin,
          ai_confidence: gradingResult.confidence,
          ai_feedback: gradingResult.feedback,
          ai_raw_response: gradingResult.raw_response,
          status: 'ai_reviewed',
        },
        { onConflict: 'user_id,module_id' }
      )
      .select()
      .single();

    if (gradeError) throw new Error('Gagal simpan grade: ' + gradeError.message);

    // 8. Insert grade history
    await admin.from('grade_history').insert({
      grade_id: gradeData.id,
      actor_id: user.id,
      actor_type: 'ai',
      action: 'ai_grading_complete',
      field_changed: null,
      old_value: null,
      new_value: JSON.stringify({
        nilai_final: gradeData.nilai_final,
        confidence: gradingResult.confidence,
      }),
    });

    // 9. Notification to asprak
    await admin.from('notifications').insert({
      user_id: user.id,
      type: 'sistem',
      title: 'AI Selesai Menilai',
      body: `Penilaian AI selesai untuk Modul ${moduleData?.number || moduleId}. Confidence: ${gradingResult.confidence.toUpperCase()}`,
      metadata: { grade_id: gradeData.id, module_id: moduleId },
    });

    return NextResponse.json({
      success: true,
      data: {
        grade_id: gradeData.id,
        nilai_final: gradeData.nilai_final,
        confidence: gradingResult.confidence,
      },
    });
  } catch (error) {
    console.error('Grade submit error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
