'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Grade, Module } from '@/types';

export default function NilaiSayaPage() {
  const [grades, setGrades] = useState<(Grade & { module: Module })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('grades')
      .select('*, modules!inner(*)')
      .eq('user_id', user.id)
      .eq('status', 'final')
      .order('module_id');

    if (data) {
      setGrades(
        data.map((g: Record<string, unknown>) => ({
          ...g,
          module: g.modules,
        })) as (Grade & { module: Module })[]
      );
    }
    setLoading(false);
  }

  const avgScore = grades.length
    ? parseFloat((grades.reduce((s, g) => s + g.nilai_final, 0) / grades.length).toFixed(1))
    : 0;

  return (
    <div>
      <h1 className="section-title section-title-praktikan">NILAI SAYA</h1>

      {/* Summary Card */}
      {grades.length > 0 && (
        <Card
          className="mb-8"
          padding="lg"
          accentColor="var(--yellow)"
          style={{ background: 'var(--yellow)' } as React.CSSProperties}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs uppercase font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Nilai Akhir Sementara
              </p>
              <p className="text-7xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {avgScore}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm">{grades.length} modul dinilai</p>
            </div>
          </div>
        </Card>
      )}

      {/* Grades Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Modul</th>
                <th>Komp. 1 (30)</th>
                <th>Komp. 2 (30)</th>
                <th>Komp. 3 (40)</th>
                <th>Total</th>
                <th>Indeks</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {grades.length > 0 ? (
                grades.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        Modul {g.module?.number}
                      </span>
                      <br />
                      <span className="text-xs" style={{ color: 'var(--muted-text)' }}>
                        {g.module?.title}
                      </span>
                    </td>
                    <td>{g.komponen1_total}</td>
                    <td>{g.komponen2_total}</td>
                    <td>{g.komponen3_total}</td>
                    <td className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                      {g.nilai_final}
                    </td>
                    <td><Badge variant="indeks" value={g.indeks || '-'} /></td>
                    <td>
                      <Button variant="secondary" size="sm">
                        Keberatan
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: 'var(--muted-text)' }}>
                    Belum ada nilai yang dipublish.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
