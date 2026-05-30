-- ============================================
-- TaskGrader Database Schema
-- Jalankan di Supabase SQL Editor
-- ============================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━
-- EXTENSIONS & ENUMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('asprak', 'praktikan');
CREATE TYPE attendance_status AS ENUM ('hadir', 'izin', 'alpa');
CREATE TYPE submission_status AS ENUM ('draft', 'ai_reviewed', 'final', 'disputed');
CREATE TYPE ai_confidence AS ENUM ('high', 'medium', 'low');
CREATE TYPE indeks_huruf AS ENUM ('A', 'AB', 'B', 'BC', 'C', 'D', 'E');
CREATE TYPE dispute_status AS ENUM ('baru', 'diproses', 'diterima', 'ditolak');
CREATE TYPE notif_type AS ENUM ('nilai_dipublish', 'keberatan_direspons', 'deadline', 'sistem', 'pesan_baru');
CREATE TYPE message_sender AS ENUM ('asprak', 'praktikan', 'ai_system');

-- ━━━━━━━━━━━━━━━━━━━━━━━━
-- TABEL UTAMA
-- ━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Users (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nim TEXT UNIQUE,
  role user_role NOT NULL,
  password_changed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modules (Modul 1–12, sesuai folder Modules/ asli)
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL CHECK (number BETWEEN 1 AND 12),
  title TEXT NOT NULL,
  total_experiments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Attendance (Absensi per praktikan per modul)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id),
  status attendance_status NOT NULL DEFAULT 'alpa',
  point INTEGER NOT NULL DEFAULT 0 CHECK (point IN (0, 5, 10)),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 4. Submissions (Input file dari asprak per praktikan per modul)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id),
  laporan_pdf_path TEXT,
  source_zip_path TEXT,
  java_files_paths TEXT[],
  modul_acuan_path TEXT,
  submission_delay_days INTEGER NOT NULL DEFAULT 0,
  ketepatan_poin NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 5. Grades (Nilai per komponen per praktikan per modul)
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id),
  -- Komponen 1: Kehadiran & Praktikum (max 30)
  kehadiran_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  percobaan_dikerjakan INTEGER DEFAULT 0,
  percobaan_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  komponen1_total NUMERIC(5,2) GENERATED ALWAYS AS (kehadiran_poin + percobaan_poin) STORED,
  -- Komponen 2: Tugas Akhir (max 30)
  fungsionalitas_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  sintaks_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  kualitas_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  komponen2_total NUMERIC(5,2) GENERATED ALWAYS AS (fungsionalitas_poin + sintaks_poin + kualitas_poin) STORED,
  -- Komponen 3: Buku Laporan (max 40)
  kelengkapan_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  kerapihan_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  ketepatan_poin NUMERIC(5,2) NOT NULL DEFAULT 0,
  komponen3_total NUMERIC(5,2) GENERATED ALWAYS AS (kelengkapan_poin + kerapihan_poin + ketepatan_poin) STORED,
  -- Final
  nilai_final NUMERIC(5,2) GENERATED ALWAYS AS (
    GREATEST(0, kehadiran_poin + percobaan_poin + fungsionalitas_poin + sintaks_poin + kualitas_poin + kelengkapan_poin + kerapihan_poin + ketepatan_poin)
  ) STORED,
  indeks indeks_huruf,
  -- AI
  ai_confidence ai_confidence,
  ai_feedback JSONB,
  ai_raw_response TEXT,
  -- Status
  status submission_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  override_by UUID REFERENCES users(id),
  override_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 6. Grade History (Audit trail setiap perubahan nilai)
CREATE TABLE grade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Disputes (Keberatan nilai)
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id),
  grade_id UUID NOT NULL REFERENCES grades(id),
  komponen_dipersoalkan TEXT[] NOT NULL,
  alasan TEXT NOT NULL,
  bukti_paths TEXT[] NOT NULL DEFAULT '{}',
  nilai_diminta NUMERIC(5,2),
  status dispute_status NOT NULL DEFAULT 'baru',
  asprak_response TEXT,
  nilai_sebelum NUMERIC(5,2),
  nilai_sesudah NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Messages (Chat 1-on-1: praktikan ↔ asprak)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES users(id),
  sender_type message_sender NOT NULL,
  recipient_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  attachment_paths TEXT[],
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  praktikan_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notif_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━
-- INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_module ON attendance(module_id);
CREATE INDEX idx_grades_user ON grades(user_id);
CREATE INDEX idx_grades_module ON grades(module_id);
CREATE INDEX idx_grades_status ON grades(status);
CREATE INDEX idx_disputes_user ON disputes(user_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_messages_praktikan ON messages(praktikan_id);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCTIONS & TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_grades_updated BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_submissions_updated BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_disputes_updated BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-calculate indeks huruf
CREATE OR REPLACE FUNCTION calculate_indeks()
RETURNS TRIGGER AS $$
BEGIN
  NEW.indeks = CASE
    WHEN NEW.nilai_final >= 85 THEN 'A'::indeks_huruf
    WHEN NEW.nilai_final >= 75 THEN 'AB'::indeks_huruf
    WHEN NEW.nilai_final >= 65 THEN 'B'::indeks_huruf
    WHEN NEW.nilai_final >= 60 THEN 'BC'::indeks_huruf
    WHEN NEW.nilai_final >= 50 THEN 'C'::indeks_huruf
    WHEN NEW.nilai_final > 40  THEN 'D'::indeks_huruf
    ELSE 'E'::indeks_huruf
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_grades_indeks BEFORE INSERT OR UPDATE OF nilai_final ON grades
  FOR EACH ROW EXECUTE FUNCTION calculate_indeks();

-- Function: hitung ketepatan_poin dari hari terlambat
CREATE OR REPLACE FUNCTION calc_ketepatan_poin(delay_days INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF delay_days <= 0 THEN RETURN 8.0; END IF;
  RETURN GREATEST(0, 8.0 - (delay_days::NUMERIC * 0.57));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: hitung percobaan_poin (linear)
CREATE OR REPLACE FUNCTION calc_percobaan_poin(dikerjakan INTEGER, total INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF total <= 0 THEN RETURN 0; END IF;
  RETURN ROUND((dikerjakan::NUMERIC / total::NUMERIC) * 20, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ━━━━━━━━━━━━━━━━━━━━━━━━
-- ROW LEVEL SECURITY (RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is asprak
CREATE OR REPLACE FUNCTION is_asprak()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'asprak');
$$ LANGUAGE sql SECURITY DEFINER;

-- users
CREATE POLICY "users_select_asprak" ON users FOR SELECT USING (is_asprak());
CREATE POLICY "users_select_self" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_self" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_all_asprak" ON users FOR ALL USING (is_asprak());

-- modules
CREATE POLICY "modules_read_all" ON modules FOR SELECT USING (TRUE);
CREATE POLICY "modules_write_asprak" ON modules FOR ALL USING (is_asprak());

-- attendance
CREATE POLICY "attendance_asprak" ON attendance FOR ALL USING (is_asprak());
CREATE POLICY "attendance_self_read" ON attendance FOR SELECT USING (auth.uid() = user_id);

-- submissions
CREATE POLICY "submissions_asprak" ON submissions FOR ALL USING (is_asprak());
CREATE POLICY "submissions_self_read" ON submissions FOR SELECT USING (auth.uid() = user_id);

-- grades
CREATE POLICY "grades_asprak" ON grades FOR ALL USING (is_asprak());
CREATE POLICY "grades_self_published" ON grades FOR SELECT
  USING (auth.uid() = user_id AND status = 'final');

-- grade_history
CREATE POLICY "grade_history_asprak" ON grade_history FOR ALL USING (is_asprak());
CREATE POLICY "grade_history_self" ON grade_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM grades g WHERE g.id = grade_id AND g.user_id = auth.uid()));

-- disputes
CREATE POLICY "disputes_asprak" ON disputes FOR ALL USING (is_asprak());
CREATE POLICY "disputes_self" ON disputes FOR ALL USING (auth.uid() = user_id);

-- messages
CREATE POLICY "messages_asprak" ON messages FOR ALL USING (is_asprak());
CREATE POLICY "messages_self" ON messages FOR ALL USING (auth.uid() = praktikan_id);

-- notifications
CREATE POLICY "notifications_self" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━
-- SEED DATA — Modul (sesuai folder Modules/ asli)
-- ━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO modules (number, title, total_experiments) VALUES
  (1,  'Instalasi Java', 18),
  (2,  'Dasar Sintaks Java', 22),
  (3,  'Kelas dan Objek', 20),
  (4,  'Enkapsulasi', 24),
  (5,  'Konstruktor dan Overloading', 21),
  (6,  'Pewarisan', 19),
  (7,  'Pewarisan dan Antarmuka', 23),
  (8,  'Kelas Abstrak dan Antarmuka', 20),
  (9,  'Relasi Antar Kelas', 22),
  (10, 'Polimorfisme', 18),
  (11, 'Framework JavaFX', 16),
  (12, 'Layout JavaFX dan Koneksi Database', 20);
