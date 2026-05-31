'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Cpu, Shield, Zap, Info, Sparkles, Code2, Database } from 'lucide-react';

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
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-[var(--bg)] p-6">
      
      {/* ━━━ Animated Background Elements ━━━ */}
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] z-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--dark) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Floating Shapes */}
      <div className="absolute top-10 left-10 md:top-20 md:left-32 animate-[float_4s_ease-in-out_infinite] z-0 opacity-80 hidden md:block">
        <div className="w-16 h-16 bg-[var(--yellow)] border-4 border-[var(--dark)] rounded-full flex items-center justify-center neo-shadow">
          <Sparkles size={24} className="text-[var(--dark)]" />
        </div>
      </div>

      <div className="absolute bottom-20 left-10 md:bottom-32 md:left-40 animate-[float_5s_ease-in-out_infinite_reverse] z-0 opacity-80 hidden md:block">
        <div className="w-20 h-20 bg-[var(--blue)] border-4 border-[var(--dark)] flex items-center justify-center neo-shadow transform -rotate-12">
          <Code2 size={32} className="text-white" />
        </div>
      </div>

      <div className="absolute top-20 right-10 md:top-32 md:right-32 animate-[float_6s_ease-in-out_infinite_0.5s] z-0 opacity-80 hidden md:block">
        <div className="w-24 h-12 bg-[var(--green)] border-4 border-[var(--dark)] rounded-full flex items-center justify-center neo-shadow transform rotate-12">
          <Database size={20} className="text-[var(--dark)]" />
        </div>
      </div>

      <div className="absolute bottom-10 right-10 md:bottom-20 md:right-40 animate-[float_4.5s_ease-in-out_infinite_1s] z-0 opacity-80 hidden md:block">
        <div className="w-14 h-14 bg-[var(--red)] border-4 border-[var(--dark)] rotate-45 flex items-center justify-center neo-shadow">
          <Shield size={20} className="text-white -rotate-45" />
        </div>
      </div>

      {/* ━━━ Main Login Container ━━━ */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        
        {/* Branding Header */}
        <div className="text-center mb-8 animate-[slideDown_0.5s_ease-out]">
          <h1 className="font-display inline-block hover:scale-105 transition-transform duration-300 cursor-default">
            <span className="text-5xl md:text-6xl font-bold text-[var(--dark)] tracking-tight">TASK</span>
            <span
              className="text-5xl md:text-6xl font-bold tracking-tight ml-2"
              style={{ color: 'var(--yellow)', WebkitTextStroke: '2px var(--dark)' }}
            >
              GRADER
            </span>
          </h1>
          <p className="mt-3 text-sm font-medium bg-[var(--dark)] text-white px-4 py-1.5 rounded-full inline-block neo-shadow-sm border-2 border-[var(--dark)]">
            Automated Practicum Grading System
          </p>
        </div>

        {/* Feature Pills (Top) */}
        <div className="flex gap-2 flex-wrap justify-center mb-6 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
          <div className="neo-pill text-xs font-bold bg-[var(--white)] text-[var(--dark)] px-3 py-1 neo-hover cursor-default">
            <Cpu size={12} strokeWidth={3} />
            Powered by AI
          </div>
          <div className="neo-pill text-xs font-bold bg-[var(--white)] text-[var(--dark)] px-3 py-1 neo-hover cursor-default">
            <Zap size={12} strokeWidth={3} />
            Fast & Accurate
          </div>
        </div>

        {/* Login Card */}
        <div
          className="w-full bg-[var(--white)] p-8 md:p-10 relative group animate-[slideUp_0.5s_ease-out_0.1s_both]"
          style={{
            border: '4px solid var(--dark)',
            boxShadow: '12px 12px 0px var(--dark)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '16px 16px 0px var(--dark)';
            e.currentTarget.style.transform = 'translate(-4px, -4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '12px 12px 0px var(--dark)';
            e.currentTarget.style.transform = 'translate(0, 0)';
          }}
        >
          <h2 className="text-2xl font-bold mb-2 font-display uppercase tracking-wider">
            Masuk
          </h2>
          <p className="text-xs mb-6 text-[var(--muted-text)] font-medium">
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
              className="mt-2 text-lg py-4 border-4"
            >
              MASUK SEKARANG
            </Button>
          </form>

          {/* Info box */}
          <div className="mt-8 p-4 text-xs flex gap-3 items-start bg-[#E6F0FF] border-2 border-[var(--dark)] neo-shadow-sm">
            <Info size={16} className="flex-shrink-0 mt-0.5 text-[var(--blue)]" />
            <span className="text-[var(--dark)] font-medium leading-relaxed">
              Hubungi asprak Anda jika belum memiliki akun. Password awal adalah NIM Anda.
            </span>
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-10 text-xs font-bold text-[var(--muted-text)] animate-[fadeIn_0.5s_ease-out_0.4s_both]">
          TaskGrader v1.0 &copy; {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}
