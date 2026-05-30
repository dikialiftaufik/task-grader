'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/ui/Sidebar';
import Navbar from '@/components/ui/Navbar';
import type { User } from '@/types';

export default function AsprakLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!userData || userData.role !== 'asprak') {
        router.push('/login');
        return;
      }

      setUser(userData as User);
      setLoading(false);
    }

    getUser();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 skeleton" />
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Sidebar role="asprak" userName={user?.full_name || 'Asprak'} />
      <Navbar role="asprak" userName={user?.full_name || 'Asprak'} onLogout={handleLogout} />
      <main className="main-content main-content-with-navbar">{children}</main>
    </div>
  );
}
