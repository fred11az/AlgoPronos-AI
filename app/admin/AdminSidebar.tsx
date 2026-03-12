'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Settings,
  BarChart3,
  ArrowLeft,
  Ticket,
  Menu,
  X,
  UserPlus,
} from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard',         href: '/admin',                icon: LayoutDashboard },
  { label: 'Utilisateurs',      href: '/admin/users',          icon: Users },
  { label: 'Vérifications VIP', href: '/admin/verifications',  icon: CheckCircle },
  { label: 'Tickets IA',        href: '/admin/tickets',        icon: Ticket },
  { label: 'Analytics',         href: '/admin/analytics',      icon: BarChart3 },
  { label: 'Paramètres',        href: '/admin/settings',       icon: Settings },
];

const RAPPORT_INSCRIPTIONS_URL = 'https://1x.partners/fr/partner/reports/players';

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme la sidebar à chaque changement de page
  useEffect(() => { setOpen(false); }, [pathname]);

  // Ferme la sidebar avec la touche Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-surface-light flex items-center justify-between">
        <div>
          <Logo size="sm" />
          <p className="text-xs text-text-muted mt-1">Admin Panel</p>
        </div>
        {/* Bouton fermer — visible seulement sur mobile */}
        <button
          className="lg:hidden p-1 text-text-muted hover:text-white transition-colors"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:text-white hover:bg-surface-light'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-light space-y-3">
        <a
          href={RAPPORT_INSCRIPTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:text-white bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl px-3 py-2.5 transition-all w-full"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          <span className="font-medium">Rapport inscriptions</span>
        </a>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Dashboard
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* ── Bouton hamburger mobile ── */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-surface-light rounded-xl text-text-secondary hover:text-white transition-colors shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Overlay (mobile) — clic ferme la sidebar ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar desktop (toujours visible) ── */}
      <aside className="hidden lg:flex w-64 bg-surface border-r border-surface-light flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* ── Sidebar mobile (drawer) ── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-surface-light flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
