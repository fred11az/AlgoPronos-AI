'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import {
  Menu,
  Settings,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

interface TopBarProps {
  user: Profile | null;
  onMenuClick: () => void;
  isAdmin?: boolean;
}

export function TopBar({ user, onMenuClick, isAdmin = false }: TopBarProps) {
  const router = useRouter();
  const [pendingVerifications, setPendingVerifications] = useState(0);

  // Fetch pending verifications count for admins
  useEffect(() => {
    if (isAdmin) {
      fetchPendingCount();
    }
  }, [isAdmin]);

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('vip_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setPendingVerifications(count || 0);
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  }

  const isVerified = user?.tier === 'verified';

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-surface-light">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-white">
              Bienvenue, {user?.full_name?.split(' ')[0] || 'Utilisateur'}
            </h1>
            <p className="text-sm text-text-muted">
              {isVerified ? 'Prêt à générer des combinés gagnants ?' : 'Activez votre compte pour commencer'}
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Activate Button (if not verified) */}
          {!isVerified && (
            <Button variant="gradient" size="sm" className="hidden sm:flex" asChild>
              <Link href="/unlock-vip">
                <Sparkles className="mr-2 h-4 w-4" />
                Activer Gratuitement
              </Link>
            </Button>
          )}

          {/* Admin Link */}
          {isAdmin && (
            <Link
              href="/admin/verifications"
              className="relative p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-white transition-colors"
            >
              <ShieldCheck className="h-5 w-5" />
              {pendingVerifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-warning rounded-full text-xs text-white flex items-center justify-center">
                  {pendingVerifications}
                </span>
              )}
            </Link>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-light transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {getInitials(user?.full_name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.full_name || 'Utilisateur'}
                  </p>
                  <div className="flex items-center gap-1">
                    {isVerified ? (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0">
                        <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                        Activé
                      </Badge>
                    ) : (
                      <span className="text-xs text-text-muted">Non activé</span>
                    )}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="text-warning">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Administration
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              {!isVerified && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/unlock-vip" className="text-primary">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Activer Mon Compte
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-error">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
