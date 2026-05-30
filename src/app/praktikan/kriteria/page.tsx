'use client';

import Card from '@/components/ui/Card';

const KOMPONEN = [
  {
    title: 'Kehadiran & Pelaksanaan Praktikum',
    weight: '30%',
    max: 30,
    color: 'var(--blue)',
    items: [
      { label: 'Kehadiran', max: 10, desc: 'Hadir: 10 | Izin/Sakit: 5 | Alpa: 0' },
      { label: 'Kelengkapan Percobaan', max: 20, desc: 'Rasio percobaan yang dikerjakan terhadap total percobaan × 20' },
    ],
  },
  {
    title: 'Tugas Akhir',
    weight: '30%',
    max: 30,
    color: 'var(--yellow)',
    items: [
      { label: 'Fungsionalitas', max: 15, desc: 'Kompilasi, fitur utama, dan penanganan input' },
      { label: 'Penerapan Konsep', max: 10, desc: 'Implementasi konsep OOP sesuai topik modul' },
      { label: 'Kualitas Kode', max: 5, desc: 'Struktur, konvensi penamaan, dan format output' },
    ],
  },
  {
    title: 'Buku Laporan Praktikum',
    weight: '40%',
    max: 40,
    color: 'var(--red)',
    items: [
      { label: 'Kelengkapan Isi', max: 20, desc: 'Struktur bab, dasar teori, dan kesimpulan' },
      { label: 'Kerapihan Penulisan', max: 12, desc: 'Tipografi, format gambar, dan penggunaan istilah' },
      { label: 'Ketepatan Pengumpulan', max: 8, desc: 'Tepat waktu: 8 | Terlambat: penalti progresif per hari' },
    ],
  },
];

export default function KriteriaPraktikanPage() {
  return (
    <div>
      <h1 className="section-title section-title-praktikan">RUBRIK PENILAIAN</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-text)' }}>
        Transparansi penuh mengenai cara nilai Anda dihitung
      </p>

      <div
        className="p-4 mb-8 text-sm text-white"
        style={{ background: 'var(--blue)', border: 'var(--border)' }}
      >
        Penilaian dilakukan secara otomatis menggunakan AI, kemudian divalidasi manual oleh asprak untuk memastikan akurasi.
        Total nilai maksimum adalah 100 poin dari 3 komponen utama.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {KOMPONEN.map((k) => (
          <Card key={k.title} accentColor={k.color} accentPosition="left" padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                {k.title}
              </h3>
              <span
                className="neo-pill text-xs"
                style={{
                  background: k.color,
                  color: k.color === 'var(--yellow)' ? 'var(--dark)' : 'var(--white)',
                  borderColor: 'var(--dark)',
                }}
              >
                {k.weight}
              </span>
            </div>
            <p className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {k.max} <span className="text-sm font-normal" style={{ color: 'var(--muted-text)' }}>poin maks</span>
            </p>
            <div className="space-y-3">
              {k.items.map((item) => (
                <div key={item.label} className="p-3" style={{ background: 'var(--muted)', border: '2px solid var(--dark)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{item.label}</span>
                    <span className="text-xs font-bold">Max {item.max}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted-text)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
