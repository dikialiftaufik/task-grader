-- Buat tabel settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_mata_praktikum TEXT NOT NULL DEFAULT 'Pemrograman Berorientasi Objek',
  semester TEXT NOT NULL DEFAULT 'Genap 2024/2025',
  program_studi TEXT NOT NULL DEFAULT 'D3 Sistem Informasi',
  bobot_kehadiran INTEGER NOT NULL DEFAULT 30,
  bobot_tugas_akhir INTEGER NOT NULL DEFAULT 30,
  bobot_laporan INTEGER NOT NULL DEFAULT 40,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hanya ada 1 baris pengaturan utama (Singleton)
-- Kita akan selalu meng-update baris pertama ini
INSERT INTO settings (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_all" ON settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_write_asprak" ON settings FOR ALL USING (is_asprak());
