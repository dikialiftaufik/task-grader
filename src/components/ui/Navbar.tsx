'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, User, Settings, X } from 'lucide-react';
import type { UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';

interface NavbarProps {
  role: UserRole;
  userName: string;
  onLogout: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/asprak/dashboard': 'Dashboard',
  '/asprak/nilai': 'Penilaian AI',
  '/asprak/rekap': 'Rekap Nilai',
  '/asprak/absensi': 'Kehadiran',
  '/asprak/praktikan': 'Praktikan',
  '/asprak/diskusi': 'Diskusi & Keberatan',
  '/asprak/kriteria': 'Rubrik Penilaian',
  '/asprak/pengaturan': 'Pengaturan',
  '/praktikan/dashboard': 'Dashboard',
  '/praktikan/nilai': 'Nilai Saya',
  '/praktikan/kehadiran': 'Kehadiran',
  '/praktikan/kriteria': 'Rubrik Penilaian',
  '/praktikan/keberatan': 'Ajukan Keberatan',
  '/praktikan/diskusi': 'Diskusi',
  '/praktikan/profil': 'Profil',
};

export default function Navbar({ role, userName, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageTitle = PAGE_TITLES[pathname] || 'TaskGrader';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    
    // Notifications logic
    const supabase = createClient();
    
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    }
    
    fetchNotifications();
    
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, () => fetchNotifications())
      .subscribe();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, []);

  const accentColor = role === 'asprak' ? 'var(--yellow)' : 'var(--blue)';

  return (
    <header className="navbar">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--dark)' }}
        >
          {pageTitle}
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={async () => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
              if (!notifOpen && unreadCount > 0) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
                  setUnreadCount(0);
                  setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                }
              }
            }}
            className="navbar-icon-btn"
            aria-label="Notifikasi"
          >
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="navbar-notif-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="navbar-dropdown" style={{ width: '320px', right: 0 }}>
              <div className="p-4 border-b-2 border-[var(--dark)] flex justify-between items-center">
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Notifikasi
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifOpen(false);
                  }}
                  className="text-[var(--muted-text)] hover:text-[var(--dark)] transition-colors"
                  aria-label="Tutup notifikasi"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-[var(--muted)] hover:bg-[var(--muted)] transition-colors">
                      <p className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{notif.title}</p>
                      <p className="text-xs mb-2" style={{ color: 'var(--muted-text)' }}>{notif.body}</p>
                      <p className="text-[10px] text-right font-bold" style={{ color: 'var(--blue)' }}>{formatRelativeTime(notif.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-xs" style={{ color: 'var(--muted-text)' }}>
                      Belum ada notifikasi baru.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="navbar-profile-btn"
          >
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-bold"
              style={{
                background: accentColor,
                color: role === 'asprak' ? 'var(--dark)' : 'var(--white)',
                border: '2px solid var(--dark)',
              }}
            >
              {initials}
            </div>
            <span className="text-sm font-medium hidden md:block" style={{ fontFamily: 'var(--font-display)' }}>
              {userName.split(' ')[0]}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform hidden md:block ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {profileOpen && (
            <div className="navbar-dropdown" style={{ width: '220px', right: 0 }}>
              {/* User info */}
              <div className="p-4 border-b-2 border-[var(--dark)]">
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {userName}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--muted-text)' }}>
                  {role}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {role === 'praktikan' && (
                  <button
                    onClick={() => {
                      router.push('/praktikan/profil');
                      setProfileOpen(false);
                    }}
                    className="navbar-dropdown-item"
                  >
                    <User size={16} />
                    Profil & Password
                  </button>
                )}
                {role === 'asprak' && (
                  <button
                    onClick={() => {
                      router.push('/asprak/pengaturan');
                      setProfileOpen(false);
                    }}
                    className="navbar-dropdown-item"
                  >
                    <Settings size={16} />
                    Pengaturan
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="navbar-dropdown-item text-[var(--red)]"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
