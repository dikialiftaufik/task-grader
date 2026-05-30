'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import {
  Users,
  CheckCircle,
  Cpu,
  Flag,
  TrendingUp,
  Eye,
  Pencil,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalPraktikan: number;
  totalSubmissions: number;
  aiGraded: number;
  activeDisputes: number;
  avgScore: number;
}

const GRADE_DIST_COLORS: Record<string, string> = {
  A: '#00C48C',
  AB: '#0057FF',
  B: '#3B82F6',
  BC: '#FFE500',
  C: '#F59E0B',
  D: '#FF9500',
  E: '#FF3B3B',
};

const PIE_COLORS = ['#00C48C', '#FF3B3B', '#FFE500'];

export default function AsprakDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gradeDist, setGradeDist] = useState<{ name: string; count: number }[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<{ name: string; value: number }[]>([]);
  const [recentGrades, setRecentGrades] = useState<Array<{
    id: string;
    full_name: string;
    nim: string;
    nilai_final: number;
    indeks: string;
    ai_confidence: string;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = createClient();

    try {
      // Total praktikan
      const { count: totalPraktikan } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'praktikan');

      // Grade stats
      const { data: grades } = await supabase
        .from('grades')
        .select('nilai_final, indeks, ai_confidence, status, user_id, module_id');

      const aiGraded = grades?.filter((g) => g.status !== 'draft').length || 0;
      const avgScore = grades?.length
        ? grades.reduce((sum, g) => sum + (g.nilai_final || 0), 0) / grades.length
        : 0;

      // Active disputes
      const { count: activeDisputes } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['baru', 'diproses']);

      setStats({
        totalPraktikan: totalPraktikan || 0,
        totalSubmissions: grades?.length || 0,
        aiGraded,
        activeDisputes: activeDisputes || 0,
        avgScore: parseFloat(avgScore.toFixed(1)),
      });

      // Grade distribution
      const dist: Record<string, number> = { A: 0, AB: 0, B: 0, BC: 0, C: 0, D: 0, E: 0 };
      grades?.forEach((g) => {
        if (g.indeks && dist[g.indeks] !== undefined) dist[g.indeks]++;
      });
      setGradeDist(Object.entries(dist).map(([name, count]) => ({ name, count })));

      // Submission status pie
      const statusDraft = grades?.filter((g) => g.status === 'draft').length || 0;
      const statusReviewed = grades?.filter((g) => ['ai_reviewed', 'final'].includes(g.status)).length || 0;
      const statusDisputed = grades?.filter((g) => g.status === 'disputed').length || 0;
      setSubmissionStatus([
        { name: 'Dinilai', value: statusReviewed },
        { name: 'Disputed', value: statusDisputed },
        { name: 'Draft', value: statusDraft },
      ]);

      // Recent grades with user info
      const { data: recentData } = await supabase
        .from('grades')
        .select('id, nilai_final, indeks, ai_confidence, status, user_id, users!inner(full_name, nim)')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentData) {
        setRecentGrades(
          recentData.map((g: Record<string, unknown>) => {
            const user = g.users as Record<string, unknown>;
            return {
              id: g.id as string,
              full_name: user?.full_name as string || '',
              nim: user?.nim as string || '',
              nilai_final: g.nilai_final as number || 0,
              indeks: g.indeks as string || '-',
              ai_confidence: g.ai_confidence as string || '-',
              status: g.status as string || 'draft',
            };
          })
        );
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton height={40} width={300} />
          <Skeleton height={20} width={500} className="mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={140} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title section-title-asprak">DASHBOARD</h1>
        <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
          Semester Genap 2024/2025 · Praktikum Pemrograman Berorientasi Objek
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card accentColor="var(--yellow)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} style={{ color: 'var(--yellow)' }} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Total Praktikan
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {stats?.totalPraktikan || 0}
          </p>
        </Card>

        <Card accentColor="var(--blue)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} style={{ color: 'var(--blue)' }} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Total Nilai
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {stats?.totalSubmissions || 0}
          </p>
        </Card>

        <Card accentColor="var(--green)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={18} style={{ color: 'var(--green)' }} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Dinilai AI
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {stats?.aiGraded || 0}
          </p>
        </Card>

        <Card accentColor="var(--red)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Flag size={18} style={{ color: 'var(--red)' }} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Keberatan Aktif
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {stats?.activeDisputes || 0}
          </p>
        </Card>

        <Card accentColor="var(--dark)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Rata-rata Nilai
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {stats?.avgScore || 0}
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Bar Chart */}
        <Card className="lg:col-span-3" padding="md">
          <h3
            className="text-sm font-bold uppercase mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Distribusi Nilai
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gradeDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={40} />
              <Tooltip
                contentStyle={{
                  border: '2px solid var(--dark)',
                  borderRadius: 0,
                  fontFamily: 'var(--font-body)',
                }}
              />
              <Bar dataKey="count" name="Jumlah">
                {gradeDist.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={GRADE_DIST_COLORS[entry.name] || 'var(--muted)'}
                    stroke="var(--dark)"
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-2" padding="md">
          <h3
            className="text-sm font-bold uppercase mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Status Penilaian
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={submissionStatus}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="var(--dark)"
                strokeWidth={2}
              >
                {submissionStatus.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Grades Table */}
      <Card padding="md">
        <h3
          className="text-sm font-bold uppercase mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Penilaian Terbaru
        </h3>
        {recentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>NIM</th>
                  <th>Nama</th>
                  <th>Nilai</th>
                  <th>Indeks</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td className="font-mono text-sm">{grade.nim}</td>
                    <td>{grade.full_name}</td>
                    <td className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {grade.nilai_final}
                    </td>
                    <td>
                      <Badge variant="indeks" value={grade.indeks} />
                    </td>
                    <td>
                      <Badge variant="confidence" value={grade.ai_confidence?.toUpperCase() || '-'} />
                    </td>
                    <td>
                      <Badge variant="status" value={grade.status} />
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-[var(--muted)]">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 hover:bg-[var(--muted)]">
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-text)' }}>
            Belum ada penilaian. Upload submission untuk memulai.
          </p>
        )}
      </Card>
    </div>
  );
}
