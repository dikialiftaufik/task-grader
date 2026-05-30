-- ============================================
-- TaskGrader Storage Buckets
-- Jalankan di Supabase SQL Editor SETELAH schema.sql
-- ============================================

-- Bucket untuk laporan PDF praktikan
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'laporan-pdf', 'laporan-pdf', FALSE,
  20971520, -- 20MB
  ARRAY['application/pdf']
);

-- Bucket untuk source code (ZIP/RAR)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'source-code', 'source-code', FALSE,
  10485760, -- 10MB
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/vnd.rar', 'application/octet-stream']
);

-- Bucket untuk file Java (langsung .java tanpa zip/rar)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'java-files', 'java-files', FALSE,
  5242880, -- 5MB
  ARRAY['text/x-java-source', 'text/plain', 'application/octet-stream']
);

-- Bucket untuk modul acuan PDF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'modul-acuan', 'modul-acuan', FALSE,
  20971520, -- 20MB
  ARRAY['application/pdf']
);

-- Bucket untuk bukti keberatan
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti-keberatan', 'bukti-keberatan', FALSE,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
);

-- Bucket untuk attachment chat
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 'chat-attachments', FALSE,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━
-- Storage RLS Policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━

-- Asprak bisa upload/baca semua bucket utama
CREATE POLICY "storage_asprak_all" ON storage.objects
  FOR ALL USING (
    bucket_id IN ('laporan-pdf', 'source-code', 'java-files', 'modul-acuan', 'chat-attachments')
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'asprak')
  );

-- Praktikan bisa upload bukti keberatan ke folder sendiri
CREATE POLICY "storage_praktikan_bukti" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bukti-keberatan'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Praktikan bisa baca file milik sendiri di semua bucket
CREATE POLICY "storage_praktikan_read_own" ON storage.objects
  FOR SELECT USING (
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Path conventions:
-- laporan-pdf:      {user_id}/modul-{N}/laporan.pdf
-- source-code:      {user_id}/modul-{N}/source.zip (atau .rar)
-- java-files:       {user_id}/modul-{N}/{filename}.java
-- modul-acuan:      modul-{N}/modul_acuan.pdf
-- bukti-keberatan:  {user_id}/dispute-{dispute_id}/{filename}
-- chat-attachments: {praktikan_id}/{message_id}/{filename}
