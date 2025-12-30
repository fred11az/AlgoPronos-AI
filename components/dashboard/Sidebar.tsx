'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo, LogoIcon } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Sparkles,
  History,
  Settings,
  Crown,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import type { Profile } from '@/types';

interface SidebarProps {
  user: Profile | null;
  collapsed: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Générer un Combiné',
    href: '/dashboard/generate',
    icon: Sparkles,
    badge: 'IA',
  },
  {
    label: 'Mes Combinés',
    href: '/dashboard/combines',
    icon: Zap,
  },
  {
    label: 'Historique',
    href: '/dashboard/history',
    icon: History,
  },
  {
    label: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar({ user, collapsed, onToggle, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const isVIP = user?.tier === 'vip_lifetime';
  const isPremium = user?.tier === 'premium';
  const hasAccess = isVIP || isPremium;

  // Add admin nav items if user is admin
  const allNavItems = isAdmin
    ? [
        ...navItems,
        {
          label: 'Administration',
          href: '/admin',
          icon: ShieldCheck,
          badge: 'Admin',
        },
      ]
    : navItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-surface border-r border-surface-light transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-light">
          {collapsed ? (
            <LogoIcon size={32} className="mx-auto" />
          ) : (
            <Logo size="sm" />
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Tier Badge */}
        {!collapsed && (
          <div className="p-4">
            {isVIP ? (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">VIP À VIE</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Accès illimité gratuit</p>
              </div>
            ) : isPremium ? (
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-3 border border-primary/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Premium</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Abonnement actif</p>
              </div>
            ) : (
              <Link href="/unlock-vip">
                <div className="bg-surface-light rounded-xl p-3 border border-surface-light hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-text-muted" />
                    <span className="font-semibold text-white">Débloquer VIP</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Gratuit à vie</p>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-text-secondary hover:text-white hover:bg-surface-light'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-surface-light space-y-2">
          {!hasAccess && !collapsed && (
            <Button variant="gradient" className="w-full mb-2" asChild>
              <Link href="/unlock-vip">
                <Crown className="mr-2 h-4 w-4" />
                Débloquer VIP
              </Link>
            </Button>
          )}

          <Link
            href="/help"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-surface-light transition-all',
              collapsed && 'justify-center'
            )}
          >
            <HelpCircle className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Aide</span>}
          </Link>

          <button
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-error hover:bg-error/10 transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
