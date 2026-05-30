'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import type { Attendance, Module } from '@/types';

export default function KehadiranPage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: modulesData } = await supabase.from('modules').select('*').order('number');
    setModules((modulesData as Module[]) || []);

    const { data: attData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id);
    setAttendance((attData as Attendance[]) || []);
    setLoading(false);
  }

  const hadirCount = attendance.filter((a) => a.status === 'hadir').length;
  const totalPoin = attendance.reduce((s, a) => s + a.point, 0);

  return (
    <div>
      <h1 className="section-title section-title-praktikan">KEHADIRAN SAYA</h1>

      {/* Attendance Circles */}
      <Card className="mb-8" padding="lg">
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          {modules.map((m) => {
            const att = attendance.find((a) => a.module_id === m.id);
            const status = att?.status || 'alpa';
            const colorMap = { hadir: 'var(--green)', izin: 'var(--blue)', alpa: 'var(--red)' };
            const symbolMap = { hadir: '✓', izin: 'I', alpa: '✗' };

            return (
              <div key={m.id} className="text-center">
                <div
                  className="w-14 h-14 flex items-center justify-center text-lg font-bold text-white mx-auto"
                  style={{
                    background: colorMap[status],
                    border: 'var(--border)',
                    borderRadius: '50%',
                  }}
                >
                  {symbolMap[status]}
                </div>
                <p className="text-xs mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                  M{m.number}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {hadirCount}/{modules.length} HADIR · {modules.length ? Math.round((hadirCount / modules.length) * 100) : 0}%
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-3 border-2 border-[var(--dark)] max-w-md mx-auto">
            <div
              className="h-full"
              style={{
                width: `${modules.length ? (hadirCount / modules.length) * 100 : 0}%`,
                background: (hadirCount / modules.length) >= 0.75 ? 'var(--green)' : 'var(--red)',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Warning if below 75% */}
      {modules.length > 0 && hadirCount / modules.length < 0.75 && (
        <div
          className="p-4 mb-6 text-sm"
          style={{ background: '#FFE6E6', border: 'var(--border)', borderLeftWidth: '6px', borderLeftColor: 'var(--red)' }}
        >
          ⚠️ Kehadiran Anda di bawah 75%. Hal ini dapat mempengaruhi nilai akhir.
          Hubungi asprak jika ada keterangan izin yang belum tercatat.
        </div>
      )}

      {/* Detail Table */}
      <Card padding="sm">
        <table className="neo-table">
          <thead>
            <tr>
              <th>Modul</th>
              <th>Status</th>
              <th>Poin</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => {
              const att = attendance.find((a) => a.module_id === m.id);
              const status = att?.status || 'alpa';
              return (
                <tr key={m.id}>
                  <td>
                    <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      Modul {m.number}
                    </span> — {m.title}
                  </td>
                  <td>
                    <span
                      className="neo-pill"
                      style={{
                        background: status === 'hadir' ? 'var(--green)' : status === 'izin' ? 'var(--blue)' : 'var(--red)',
                        color: 'white',
                        borderColor: 'var(--dark)',
                      }}
                    >
                      {status === 'hadir' ? 'HADIR' : status === 'izin' ? 'IZIN' : 'ALPA'}
                    </span>
                  </td>
                  <td className="font-bold">{att?.point || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Impact Card */}
      <Card className="mt-6" padding="md" accentColor="var(--blue)" accentPosition="left">
        <h3 className="text-sm font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Dampak Kehadiran Terhadap Nilai
        </h3>
        <p className="text-sm">
          Dari 10 poin kehadiran per modul, Anda memperoleh total:{' '}
          <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {totalPoin} poin
          </span>{' '}
          dari {modules.length * 10} poin maksimum.
        </p>
      </Card>
    </div>
  );
}
