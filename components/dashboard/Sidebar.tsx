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
  CheckCircle,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Clock,
  X,
  Rocket,
  TrendingUp,
  Calendar,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import type { Profile } from '@/types';

interface SidebarProps {
  user: Profile | null;
  collapsed: boolean;
  onToggle: () => void;
  onLinkClick?: () => void; // Pour fermer le menu mobile
  onSignOut?: () => void; // Callback pour la déconnexion
  isAdmin?: boolean;
  pendingVerification?: boolean;
  isMobile?: boolean; // Indique si c'est la version mobile
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
    label: 'Programme Sport',
    href: '/matchs',
    icon: Calendar,
  },
  {
    label: 'Mes Combinés',
    href: '/dashboard/combines',
    icon: Zap,
  },
  {
    label: 'Historique IA',
    href: '/dashboard/history',
    icon: History,
  },
  {
    label: 'La Montante',
    href: '/concept-montante',
    icon: TrendingUp,
  },
  {
    label: 'Ticket Optimus',
    href: '/concept-optimus',
    icon: Rocket,
  },
  {
    label: 'Classement',
    href: '/classement',
    icon: Trophy,
  },
  {
    label: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar({ user, collapsed, onToggle, onLinkClick, onSignOut, isAdmin = false, pendingVerification = false, isMobile = false }: SidebarProps) {
  const pathname = usePathname();

  const isVerified = user?.tier === 'verified';

  // Ferme le menu mobile quand on clique sur un lien
  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  // Ferme le menu mobile
  const handleCloseMenu = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

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
        'h-screen bg-surface border-r border-surface-light transition-all duration-300',
        // En mobile, le parent gère le positionnement fixed + transform
        // En desktop, on utilise fixed pour que le sidebar reste en place
        isMobile ? 'relative w-64' : 'fixed left-0 top-0 z-50',
        !isMobile && (collapsed ? 'w-20' : 'w-64')
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
          {isMobile ? (
            <button
              onClick={handleCloseMenu}
              className="p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-white transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-6 w-6" />
            </button>
          ) : (
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
          )}
        </div>

        {/* Status Badge */}
        {!collapsed && (
          <div className="p-4">
            {isVerified ? (
              <div className="bg-gradient-to-r from-success/20 to-primary/20 rounded-xl p-3 border border-success/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-semibold text-success">Compte Activé</span>
                </div>
                <p className="text-xs text-text-muted mt-1">2 coupons/jour - 100% gratuit</p>
              </div>
            ) : pendingVerification ? (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">En attente</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Vérification sous 24h</p>
              </div>
            ) : (
              <Link href="/unlock-vip" onClick={handleLinkClick}>
                <div className="bg-surface-light rounded-xl p-3 border border-surface-light hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-white">Activer mon compte</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">100% gratuit</p>
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
                onClick={handleLinkClick}
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
          {!isVerified && !pendingVerification && !collapsed && (
            <Button variant="gradient" className="w-full mb-2" asChild>
              <Link href="/unlock-vip" onClick={handleLinkClick}>
                <Sparkles className="mr-2 h-4 w-4" />
                Activer Gratuitement
              </Link>
            </Button>
          )}

          <Link
            href="/help"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-surface-light transition-all',
              collapsed && 'justify-center'
            )}
          >
            <HelpCircle className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Aide</span>}
          </Link>

          <button
            onClick={() => {
              handleCloseMenu();
              if (onSignOut) {
                onSignOut();
              }
            }}
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
