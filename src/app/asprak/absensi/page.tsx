'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { getAttendanceColor, getAttendanceLabel } from '@/lib/utils';
import type { Module, User, Attendance } from '@/types';

export default function AbsensiPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [praktikans, setPraktikans] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const { data: modulesData } = await supabase.from('modules').select('*').order('number');
    setModules((modulesData as Module[]) || []);

    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'praktikan')
      .order('full_name');
    setPraktikans((usersData as User[]) || []);

    const { data: attData } = await supabase.from('attendance').select('*');
    setAttendance((attData as Attendance[]) || []);

    setLoading(false);
  }

  async function updateAttendance(userId: string, moduleId: number, newStatus: 'hadir' | 'izin' | 'sakit' | 'alpa') {
    const supabase = createClient();
    const poin = newStatus === 'hadir' ? 10 : (newStatus === 'izin' || newStatus === 'sakit') ? 5 : 0;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('attendance')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          status: newStatus,
          point: poin,
          updated_by: user?.id,
        },
        { onConflict: 'user_id,module_id' }
      );

    // Reload
    const { data: attData } = await supabase.from('attendance').select('*');
    setAttendance((attData as Attendance[]) || []);
  }

  function getStatus(userId: string, moduleId: number) {
    return attendance.find((a) => a.user_id === userId && a.module_id === moduleId);
  }

  if (loading) {
    return <Skeleton height={400} />;
  }

  return (
    <div>
      <h1 className="section-title section-title-asprak mb-6">MANAJEMEN ABSENSI</h1>

      {/* Module selector pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`neo-pill cursor-pointer ${!selectedModule ? 'bg-[var(--yellow)] text-[var(--dark)]' : 'bg-[var(--white)] text-[var(--dark)]'}`}
          onClick={() => setSelectedModule(null)}
        >
          Semua
        </button>
        {modules.map((m) => (
          <button
            key={m.id}
            className={`neo-pill cursor-pointer ${selectedModule === m.id ? 'bg-[var(--yellow)] text-[var(--dark)]' : 'bg-[var(--white)] text-[var(--dark)]'}`}
            onClick={() => setSelectedModule(m.id)}
          >
            Modul {m.number}
          </button>
        ))}
      </div>

      {/* Attendance Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                {(selectedModule
                  ? modules.filter((m) => m.id === selectedModule)
                  : modules
                ).map((m) => (
                  <th key={m.id}>M{m.number}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {praktikans.map((p) => {
                const displayModules = selectedModule
                  ? modules.filter((m) => m.id === selectedModule)
                  : modules;
                const totalHadir = modules.filter(
                  (m) => getStatus(p.id, m.id)?.status === 'hadir'
                ).length;

                return (
                  <tr key={p.id}>
                    <td className="font-mono text-sm">{p.nim}</td>
                    <td className="whitespace-nowrap">{p.full_name}</td>
                    {displayModules.map((m) => {
                      const att = getStatus(p.id, m.id);
                      const status = att?.status || 'alpa';
                      return (
                        <td key={m.id} className="text-center">
                          <select
                            className="text-xs p-1 border-2 border-[var(--dark)] bg-transparent cursor-pointer"
                            style={{ color: getAttendanceColor(status) }}
                            value={status}
                            onChange={(e) =>
                              updateAttendance(
                                p.id,
                                m.id,
                                e.target.value as 'hadir' | 'izin' | 'sakit' | 'alpa'
                              )
                            }
                          >
                            <option value="hadir">✓</option>
                            <option value="izin">I</option>
                            <option value="sakit">S</option>
                            <option value="alpa">✗</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="font-bold text-center" style={{ fontFamily: 'var(--font-display)' }}>
                      {totalHadir}/{modules.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <Card accentColor="var(--green)" padding="sm">
          <p className="text-xs uppercase font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Total Hadir</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {attendance.filter((a) => a.status === 'hadir').length}
          </p>
        </Card>
        <Card accentColor="var(--blue)" padding="sm">
          <p className="text-xs uppercase font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Izin</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {attendance.filter((a) => a.status === 'izin').length}
          </p>
        </Card>
        <Card accentColor="var(--orange)" padding="sm">
          <p className="text-xs uppercase font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Sakit</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {attendance.filter((a) => a.status === 'sakit').length}
          </p>
        </Card>
        <Card accentColor="var(--red)" padding="sm">
          <p className="text-xs uppercase font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Alpa</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {attendance.filter((a) => a.status === 'alpa').length}
          </p>
        </Card>
        <Card accentColor="var(--dark)" padding="sm">
          <p className="text-xs uppercase font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Rata-rata</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {praktikans.length
              ? Math.round(
                  (attendance.filter((a) => a.status === 'hadir').length /
                    (praktikans.length * modules.length)) *
                    100
                )
              : 0}%
          </p>
        </Card>
      </div>
    </div>
  );
}
