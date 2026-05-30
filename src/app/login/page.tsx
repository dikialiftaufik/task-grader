'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Cpu, Shield, Zap, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Username / email wajib diisi';
    if (!password.trim()) newErrors.password = 'Password wajib diisi';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Jika user input bukan email, tambahkan @taskgrader.internal
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@taskgrader.internal`;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        toast.error('Username atau password salah');
        setErrors({ password: 'Username atau password salah' });
        return;
      }

      // Get user role for redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        toast.success('Login berhasil!');

        if (userData?.role === 'asprak') {
          router.push('/asprak/dashboard');
        } else {
          router.push('/praktikan/dashboard');
        }
        router.refresh();
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ━━━ Left Side — Branding ━━━ */}
      <div
        className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-12"
        style={{ background: 'var(--bg)' }}
      >
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--dark) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Main title */}
        <div className="relative z-10 mt-[20vh]">
          <h1 style={{ fontFamily: 'var(--font-display)' }}>
            <span className="block text-[96px] leading-none font-bold text-[var(--dark)]">
              TASK
            </span>
            <span
              className="block text-[96px] leading-none font-bold"
              style={{ color: 'var(--yellow)', WebkitTextStroke: '3px var(--dark)' }}
            >
              GRADER
            </span>
          </h1>
          <p
            className="mt-6 text-base max-w-md"
            style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-body)' }}
          >
            Automated Practicum Grading System
          </p>
          <p
            className="mt-2 text-sm max-w-md"
            style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-body)' }}
          >
            Powered by AI · Built for Accuracy
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 flex gap-3 flex-wrap">
          <div className="neo-pill bg-[var(--yellow)] text-[var(--dark)]">
            <Cpu size={14} strokeWidth={2.5} />
            AI Grading
          </div>
          <div className="neo-pill bg-[var(--white)] text-[var(--dark)]">
            <Shield size={14} strokeWidth={2.5} />
            Transparansi Penuh
          </div>
          <div className="neo-pill bg-[var(--white)] text-[var(--dark)]">
            <Zap size={14} strokeWidth={2.5} />
            Real-time Results
          </div>
        </div>
      </div>

      {/* ━━━ Right Side — Login Form ━━━ */}
      <div
        className="w-full lg:w-[40%] flex items-center justify-center p-6 lg:p-12"
        style={{ background: 'var(--muted)' }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-4xl font-bold text-[var(--dark)]">TASK</span>
              <span
                className="text-4xl font-bold"
                style={{ color: 'var(--yellow)', WebkitTextStroke: '2px var(--dark)' }}
              >
                GRADER
              </span>
            </h1>
          </div>

          {/* Login card */}
          <div
            className="bg-[var(--white)] p-8 lg:p-10"
            style={{
              border: 'var(--border)',
              boxShadow: '8px 8px 0px var(--dark)',
            }}
          >
            <h2
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              MASUK
            </h2>
            <p
              className="text-xs mb-8"
              style={{ color: 'var(--muted-text)' }}
            >
              Gunakan akun yang telah didaftarkan oleh asprak Anda
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label="Username"
                type="text"
                placeholder="Masukkan username Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="username"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                showPasswordToggle
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary-asprak"
                size="lg"
                fullWidth
                loading={loading}
              >
                MASUK →
              </Button>
            </form>

            {/* Info box */}
            <div
              className="mt-6 p-4 text-xs flex gap-3 items-start"
              style={{
                background: 'var(--muted)',
                borderLeft: '4px solid var(--blue)',
              }}
            >
              <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--blue)' }} />
              <span style={{ color: 'var(--muted-text)' }}>
                Hubungi asprak Anda jika belum memiliki akun. Password awal adalah NIM Anda.
              </span>
            </div>
          </div>

          {/* Version tag */}
          <p
            className="mt-6 text-right text-xs"
            style={{ color: 'var(--muted-text)' }}
          >
            TaskGrader v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
