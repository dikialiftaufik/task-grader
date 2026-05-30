'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Shield, Check, X } from 'lucide-react';

export default function ProfilPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength checks
  const checks = [
    { label: 'Minimal 8 karakter', pass: newPassword.length >= 8 },
    { label: 'Huruf besar', pass: /[A-Z]/.test(newPassword) },
    { label: 'Huruf kecil', pass: /[a-z]/.test(newPassword) },
    { label: 'Angka', pass: /[0-9]/.test(newPassword) },
    { label: 'Simbol (!@#$%...)', pass: /[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]/.test(newPassword) },
  ];

  const allPass = checks.every((c) => c.pass) && newPassword === confirmPassword && confirmPassword.length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allPass) {
      toast.error('Password belum memenuhi semua kriteria');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Password berhasil diubah!');
        router.push('/praktikan/dashboard');
        router.refresh();
      } else {
        toast.error(data.error || 'Gagal mengubah password');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="section-title section-title-praktikan">PROFIL</h1>

      {/* Password Change Warning */}
      <div
        className="p-4 mb-6 text-sm"
        style={{
          background: '#FFFBE6',
          border: 'var(--border)',
          borderLeftWidth: '6px',
          borderLeftColor: 'var(--yellow)',
        }}
      >
        <p className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          ⚠️ Ganti Password Wajib
        </p>
        <p className="mt-1" style={{ color: 'var(--muted-text)' }}>
          Demi keamanan, Anda wajib mengganti password default (NIM) sebelum mengakses fitur lainnya.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={24} style={{ color: 'var(--blue)' }} />
            <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Ganti Password
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <Input
              label="Password Baru"
              type="password"
              placeholder="Masukkan password baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showPasswordToggle
            />

            <Input
              label="Konfirmasi Password"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showPasswordToggle
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? 'Password tidak cocok'
                  : undefined
              }
            />

            <Button
              type="submit"
              variant="primary-praktikan"
              fullWidth
              loading={loading}
              disabled={!allPass}
            >
              UBAH PASSWORD
            </Button>
          </form>
        </Card>

        {/* Strength Indicator */}
        <Card padding="lg">
          <h3 className="text-sm font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Kriteria Password
          </h3>
          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.label} className="flex items-center gap-3">
                {check.pass ? (
                  <Check size={18} style={{ color: 'var(--green)' }} />
                ) : (
                  <X size={18} style={{ color: 'var(--red)' }} />
                )}
                <span
                  className="text-sm"
                  style={{ color: check.pass ? 'var(--green)' : 'var(--muted-text)' }}
                >
                  {check.label}
                </span>
              </div>
            ))}
            <hr style={{ border: '1px solid var(--muted)' }} />
            <div className="flex items-center gap-3">
              {newPassword === confirmPassword && confirmPassword.length > 0 ? (
                <Check size={18} style={{ color: 'var(--green)' }} />
              ) : (
                <X size={18} style={{ color: 'var(--red)' }} />
              )}
              <span className="text-sm" style={{ color: newPassword === confirmPassword && confirmPassword ? 'var(--green)' : 'var(--muted-text)' }}>
                Password cocok
              </span>
            </div>
          </div>

          {/* Strength bar */}
          <div className="mt-6">
            <p className="text-xs uppercase font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Kekuatan Password
            </p>
            <div className="h-3 border-2 border-[var(--dark)]">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(checks.filter((c) => c.pass).length / checks.length) * 100}%`,
                  background:
                    checks.filter((c) => c.pass).length <= 2
                      ? 'var(--red)'
                      : checks.filter((c) => c.pass).length <= 4
                      ? 'var(--yellow)'
                      : 'var(--green)',
                }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
