'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Brain,
  BarChart3,
  CalendarCheck,
  Users,
  MessageSquare,
  FileCheck,
  Settings,
  Star,
  Flag,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  userName: string;
}

const asprakLinks = [
  { href: '/asprak/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/asprak/nilai', label: 'Penilaian AI', icon: Brain },
  { href: '/asprak/absensi', label: 'Kehadiran', icon: CalendarCheck },
  { href: '/asprak/praktikan', label: 'Praktikan', icon: Users },
  { href: '/asprak/diskusi', label: 'Diskusi', icon: MessageSquare },
  { href: '/asprak/kriteria', label: 'Rubrik', icon: FileCheck },
  { href: '/asprak/pengaturan', label: 'Pengaturan', icon: Settings },
];

const praktikanLinks = [
  { href: '/praktikan/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/praktikan/nilai', label: 'Nilai Saya', icon: BarChart3 },
  { href: '/praktikan/kehadiran', label: 'Kehadiran', icon: CalendarCheck },
  { href: '/praktikan/kriteria', label: 'Rubrik', icon: FileCheck },
  { href: '/praktikan/keberatan', label: 'Keberatan', icon: Flag },
  { href: '/praktikan/diskusi', label: 'Diskusi', icon: MessageSquare },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === 'asprak' ? asprakLinks : praktikanLinks;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="px-6 mb-10">
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

        {/* Version */}
        <div className="px-6 py-4">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)' }}>
            v1.0
          </p>
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
