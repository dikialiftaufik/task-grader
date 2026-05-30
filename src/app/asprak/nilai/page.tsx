'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { Upload, Search, Download } from 'lucide-react';
import type { Module } from '@/types';

interface GradeRow {
  id: string;
  user_id: string;
  full_name: string;
  nim: string;
  nilai_final: number;
  indeks: string;
  ai_confidence: string;
  status: string;
  module_id: number;
}

export default function KelolaNilaiPage() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const { data: modulesData } = await supabase
      .from('modules')
      .select('*')
      .order('number');
    setModules((modulesData as Module[]) || []);

    const { data: gradesData } = await supabase
      .from('grades')
      .select('id, user_id, nilai_final, indeks, ai_confidence, status, module_id, users!inner(full_name, nim)')
      .order('module_id');

    if (gradesData) {
      setGrades(
        gradesData.map((g: Record<string, unknown>) => {
          const user = g.users as Record<string, unknown>;
          return {
            id: g.id as string,
            user_id: g.user_id as string,
            full_name: user?.full_name as string || '',
            nim: user?.nim as string || '',
            nilai_final: g.nilai_final as number || 0,
            indeks: g.indeks as string || '-',
            ai_confidence: g.ai_confidence as string || '-',
            status: g.status as string || 'draft',
            module_id: g.module_id as number,
          };
        })
      );
    }

    setLoading(false);
  }

  const filteredGrades = grades.filter((g) => {
    if (selectedModule && g.module_id !== selectedModule) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.full_name.toLowerCase().includes(q) || g.nim.includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div>
        <Skeleton height={40} width={300} />
        <Skeleton height={300} className="mt-6" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title section-title-asprak">KELOLA NILAI</h1>
        <Button variant="primary-asprak" icon={<Upload size={16} />}>
          Input Submission
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="mb-6" padding="sm" shadow={false} style={{ background: 'var(--muted)' } as React.CSSProperties}>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="neo-input w-auto"
            value={selectedModule || ''}
            onChange={(e) => setSelectedModule(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Semua Modul</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                Modul {m.number}: {m.title}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
            <input
              className="neo-input pl-10"
              placeholder="Cari NIM atau Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button variant="secondary" size="sm" icon={<Download size={14} />}>
            Export
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                <th>Modul</th>
                <th>Total</th>
                <th>Indeks</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((g) => (
                  <tr key={g.id}>
                    <td className="font-mono text-sm">{g.nim}</td>
                    <td>{g.full_name}</td>
                    <td>{g.module_id}</td>
                    <td className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {g.nilai_final}
                    </td>
                    <td><Badge variant="indeks" value={g.indeks} /></td>
                    <td><Badge variant="confidence" value={g.ai_confidence?.toUpperCase() || '-'} /></td>
                    <td><Badge variant="status" value={g.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: 'var(--muted-text)' }}>
                    {grades.length === 0
                      ? 'Belum ada penilaian. Klik "Input Submission" untuk memulai.'
                      : 'Tidak ada data yang cocok dengan filter.'}
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
