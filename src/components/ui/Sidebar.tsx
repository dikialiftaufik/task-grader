'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Star,
  Calendar,
  MessageCircle,
  List,
  Settings,
  LogOut,
  Upload,
  Flag,
  User,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  userName: string;
  onLogout: () => void;
}

const asprakLinks = [
  { href: '/asprak/dashboard', label: 'Dashboard', icon: Home },
  { href: '/asprak/nilai', label: 'Kelola Nilai', icon: Star },
  { href: '/asprak/absensi', label: 'Absensi', icon: Calendar },
  { href: '/asprak/diskusi', label: 'Diskusi & Keberatan', icon: MessageCircle },
  { href: '/asprak/kriteria', label: 'Kriteria Penilaian', icon: List },
  { href: '/asprak/pengaturan', label: 'Pengaturan', icon: Settings },
];

const praktikanLinks = [
  { href: '/praktikan/dashboard', label: 'Dashboard', icon: Home },
  { href: '/praktikan/nilai', label: 'Nilai Saya', icon: Star },
  { href: '/praktikan/kehadiran', label: 'Kehadiran', icon: Calendar },
  { href: '/praktikan/kriteria', label: 'Kriteria Penilaian', icon: List },
  { href: '/praktikan/keberatan', label: 'Ajukan Keberatan', icon: Flag },
  { href: '/praktikan/diskusi', label: 'Diskusi', icon: MessageCircle },
  { href: '/praktikan/profil', label: 'Profil', icon: User },
];

export default function Sidebar({ role, userName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const links = role === 'asprak' ? asprakLinks : praktikanLinks;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center font-bold text-sm"
              style={{
                background: 'var(--yellow)',
                color: 'var(--dark)',
                border: '2px solid var(--dark)',
                fontFamily: 'var(--font-display)',
              }}
            >
              TG
            </div>
            <span
              className="text-white font-bold text-lg"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              TaskGrader
            </span>
          </div>
        </div>

        {/* User Chip */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: role === 'asprak' ? 'var(--yellow)' : 'var(--blue)',
                color: role === 'asprak' ? 'var(--dark)' : 'var(--white)',
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm">
                Halo, {userName.split(' ')[0]} 👋
              </p>
              <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'sidebar-link',
                  isActive && 'sidebar-link-active'
                )}
              >
                <Icon size={20} strokeWidth={2.5} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 mt-4">
          <button
            onClick={onLogout}
            className="neo-btn w-full bg-[var(--red)] text-white text-sm py-2 px-4"
            style={{ boxShadow: 'none' }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {links.slice(0, 5).map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'mobile-nav-item',
                isActive && 'mobile-nav-item-active'
              )}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span>{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
