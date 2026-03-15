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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  KeyRound,
  Loader2,
  AlertCircle,
  MessageCircle,
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
  const [showSubmitId, setShowSubmitId] = useState(false);
  const [bookmarkerId, setBookmarkerId] = useState('');
  const [submittingId, setSubmittingId] = useState(false);
  const [idNotRecognized, setIdNotRecognized] = useState(false);

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

  async function handleSubmitId() {
    if (!bookmarkerId.trim()) {
      toast.error('Veuillez entrer votre identifiant bookmaker');
      return;
    }
    setSubmittingId(true);
    try {
      const res = await fetch('/api/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmaker: '1xbet', accountId: bookmarkerId.trim() }),
      });
      const data = await res.json();
      if (data.optimized) {
        toast.success('Compte déjà optimisé IA ! Actualisation en cours…');
        router.refresh();
      } else if (data.reason === 'pending_review') {
        toast.success('Votre demande est en cours de vérification. Vous serez notifié sous 24h.');
        setShowSubmitId(false);
      } else {
        // Not recognized → show pedagogical error inside dialog
        setIdNotRecognized(true);
      }
    } catch {
      toast.error('Erreur lors de la vérification. Réessayez.');
    } finally {
      setSubmittingId(false);
    }
  }

  const isVerified = user?.tier === 'verified';

  return (
    <>
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
          {/* Standard user: two action buttons */}
          {!isVerified && (
            <div className="hidden sm:flex items-center gap-2">
              {/* "J'ai mon ID bookmaker" quick submit */}
              <Button
                variant="outline"
                size="sm"
                className="border-primary/40 text-primary hover:border-primary hover:bg-primary/5"
                onClick={() => setShowSubmitId(true)}
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                J&apos;ai mon ID
              </Button>
              {/* Full activation flow */}
              <Button variant="gradient" size="sm" asChild>
                <Link href="/unlock-vip">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Full Access
                </Link>
              </Button>
            </div>
          )}

          {/* Admin Link */}
          {isAdmin && (
            <Link
              href="/admin"
              className="relative p-2 rounded-lg hover:bg-surface-light text-primary hover:text-white transition-colors z-50"
              title="Administration"
            >
              <ShieldCheck className="h-5 w-5" />
              {pendingVerifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full text-[10px] text-white flex items-center justify-center border-2 border-background">
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

    {/* ── Submit bookmaker ID dialog ──────────────────────────────────────────── */}
    <Dialog open={showSubmitId} onOpenChange={(v) => { setShowSubmitId(v); if (!v) setIdNotRecognized(false); }}>
      <DialogContent className="sm:max-w-md bg-surface border-surface-light">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Valider mon compte optimisé IA
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Entrez votre identifiant (ID ou email) sur votre bookmaker pour
            vérifier que votre compte est optimisé IA et débloquer le Full Access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bm-id" className="text-sm text-text-secondary">
              Identifiant bookmaker (ID ou email du compte)
            </Label>
            <Input
              id="bm-id"
              placeholder="ex: 12345678 ou john@email.com"
              value={bookmarkerId}
              onChange={e => setBookmarkerId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitId()}
              className="bg-surface-light border-surface-light focus:border-primary"
            />
          </div>

          <p className="text-xs text-text-muted bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
            💡 Votre compte doit avoir été créé via le lien AlgoPronos (passerelle de
            métadonnées). Sinon, cliquez sur{' '}
            <button
              className="text-primary underline"
              onClick={() => { setShowSubmitId(false); router.push('/unlock-vip'); }}
            >
              Activer Full Access
            </button>
            .
          </p>

          {idNotRecognized && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">
                    ID non reconnu comme compte Algo-Optimisé
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Cet ID n&apos;est pas reconnu par nos serveurs comme un compte Algo-Optimisé.
                    Assurez-vous d&apos;avoir suivi les étapes de création guidée via notre lien
                    partenaire, ou contactez notre support WhatsApp.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                  onClick={() => {
                    window.open('https://wa.me/22997000000?text=Bonjour%2C%20mon%20ID%20bookmaker%20n\'est%20pas%20reconnu%20sur%20AlgoPronos%20AI.%20Pouvez-vous%20m\'aider%20%3F', '_blank');
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Contacter le support WhatsApp
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                  onClick={() => { setShowSubmitId(false); setIdNotRecognized(false); router.push('/unlock-vip'); }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Créer un compte guidé
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSubmitId(false)}
            >
              Annuler
            </Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={handleSubmitId}
              disabled={submittingId || !bookmarkerId.trim()}
            >
              {submittingId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Vérifier & Débloquer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
