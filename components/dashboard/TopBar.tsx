'use client';

import { useState } from 'react';
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
  Bell,
  Menu,
  Settings,
  User,
  LogOut,
  Crown,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

interface TopBarProps {
  user: Profile | null;
  onMenuClick: () => void;
}

export function TopBar({ user, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const [notifications] = useState(3);

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

  const isVIP = user?.tier === 'vip_lifetime';
  const isPremium = user?.tier === 'premium';

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
              Prêt à générer des combinés gagnants ?
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Upgrade Button (if no tier) */}
          {!isVIP && !isPremium && (
            <Button variant="gradient" size="sm" className="hidden sm:flex" asChild>
              <Link href="/unlock-vip">
                <Crown className="mr-2 h-4 w-4" />
                Débloquer VIP
              </Link>
            </Button>
          )}

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error rounded-full text-xs text-white flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

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
                    {isVIP ? (
                      <Badge variant="vip" className="text-[10px] px-1.5 py-0">
                        VIP
                      </Badge>
                    ) : isPremium ? (
                      <Badge variant="premium" className="text-[10px] px-1.5 py-0">
                        Premium
                      </Badge>
                    ) : (
                      <span className="text-xs text-text-muted">Compte gratuit</span>
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
              {isPremium && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/premium">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Abonnement
                  </Link>
                </DropdownMenuItem>
              )}
              {!isVIP && !isPremium && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/unlock-vip" className="text-primary">
                      <Crown className="mr-2 h-4 w-4" />
                      Débloquer VIP Gratuit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/premium/checkout">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Devenir Premium
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
