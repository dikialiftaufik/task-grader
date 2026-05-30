'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { calcIndeks } from '@/lib/scoring/rubric';
import {
  Star,
  Calendar,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Grade, Attendance, Module, Setting } from '@/types';

export default function PraktikanDashboard() {
  const [grades, setGrades] = useState<(Grade & { module: Module })[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [userName, setUserName] = useState('');
  const [nim, setNim] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get settings
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      if (settingsData) setSettings(settingsData as Setting);

      // Get user info
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, nim')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserName(userData.full_name);
        setNim(userData.nim || '');
      }

      // Get modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .order('number');
      setModules((modulesData as Module[]) || []);

      // Get published grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*, modules!inner(*)')
        .eq('user_id', user.id)
        .eq('status', 'final')
        .order('module_id');

      if (gradesData) {
        setGrades(
          gradesData.map((g: Record<string, unknown>) => ({
            ...g,
            module: g.modules,
          })) as (Grade & { module: Module })[]
        );
      }

      // Get attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id);
      setAttendance((attendanceData as Attendance[]) || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats
  const avgScore = grades.length
    ? parseFloat((grades.reduce((s, g) => s + g.nilai_final, 0) / grades.length).toFixed(1))
    : 0;
  const overallIndeks = avgScore ? calcIndeks(avgScore) : '-';
  const hadirCount = attendance.filter((a) => a.status === 'hadir').length;
  const totalModules = modules.length;
  const attendancePercent = totalModules ? Math.round((hadirCount / totalModules) * 100) : 0;

  // Chart data
  const chartData = grades.map((g) => ({
    name: `M${g.module?.number || '?'}`,
    nilai: g.nilai_final,
  }));

  if (loading) {
    return (
      <div>
        <Skeleton height={60} width={400} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[...Array(4)].map((_, i) => (
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
        <h1 className="section-title section-title-praktikan">
          HALO, {userName.split(' ')[0]} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
          NIM: {nim} · {settings ? `${settings.semester} · ${settings.nama_mata_praktikum}` : 'Memuat...'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card accentColor="var(--blue)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} style={{ color: 'var(--blue)' }} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Nilai Saat Ini
            </span>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {avgScore || '-'}
            </p>
            <span className="text-lg mb-1" style={{ color: 'var(--muted-text)' }}>/ 100</span>
          </div>
          {overallIndeks !== '-' && (
            <Badge variant="indeks" value={overallIndeks} className="mt-2" />
          )}
        </Card>

        <Card accentColor="var(--green)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} style={{ color: 'var(--green)' }} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Kehadiran
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {hadirCount}/{totalModules}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--muted-text)' }}>
            {attendancePercent}% hadir
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-2 border-2 border-[var(--dark)]">
            <div
              className="h-full"
              style={{
                width: `${attendancePercent}%`,
                background: attendancePercent >= 75 ? 'var(--green)' : 'var(--red)',
              }}
            />
          </div>
        </Card>

        <Card accentColor="var(--yellow)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} style={{ color: 'var(--yellow)' }} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Modul Dinilai
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {grades.length}/{totalModules}
          </p>
        </Card>

        <Card accentColor="var(--dark)" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} />
            <span className="text-xs font-semibold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Perkiraan Akhir
            </span>
          </div>
          <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {avgScore || '-'}
          </p>
          <p className="text-xs mt-2 italic" style={{ color: 'var(--muted-text)' }}>
            Berdasarkan modul yang sudah dinilai
          </p>
        </Card>
      </div>

      {/* Value Trend Chart */}
      {chartData.length > 0 && (
        <Card padding="md" className="mb-8">
          <h3
            className="text-sm font-bold uppercase mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tren Nilai Per Modul
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  border: '2px solid var(--dark)',
                  borderRadius: 0,
                  fontFamily: 'var(--font-body)',
                }}
              />
              <Line
                type="monotone"
                dataKey="nilai"
                stroke="var(--blue)"
                strokeWidth={3}
                dot={{
                  fill: 'var(--blue)',
                  stroke: 'var(--dark)',
                  strokeWidth: 2,
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Grades */}
      <Card padding="md">
        <h3
          className="text-sm font-bold uppercase mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Nilai Yang Sudah Dipublish
        </h3>
        {grades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Modul</th>
                  <th>Komp. 1</th>
                  <th>Komp. 2</th>
                  <th>Komp. 3</th>
                  <th>Total</th>
                  <th>Indeks</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
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
                    <td>{g.komponen1_total}/30</td>
                    <td>{g.komponen2_total}/30</td>
                    <td>{g.komponen3_total}/40</td>
                    <td className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {g.nilai_final}
                    </td>
                    <td>
                      <Badge variant="indeks" value={g.indeks || '-'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-text)' }}>
            Belum ada nilai yang dipublish.
          </p>
        )}
      </Card>
    </div>
  );
}
