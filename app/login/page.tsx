'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowRight,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Social proof items ─────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: Zap, label: '78.5% de réussite', color: 'text-primary' },
  { icon: Shield, label: 'Données sécurisées', color: 'text-emerald-400' },
  { icon: Star, label: '4.9/5 satisfaction', color: 'text-yellow-400' },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.includes('@') && password.length >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Veuillez confirmer votre email avant de vous connecter');
          localStorage.setItem('pendingVerificationEmail', email);
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Connexion réussie !');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — identical to onboarding */}
      <header className="py-4 px-6 border-b border-surface-light/50 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>100% Gratuit</span>
          <span className="mx-1">·</span>
          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
          <span>4.9/5</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Heading */}
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Bon retour parmi nous !
              </h1>
              <p className="text-text-secondary text-sm">
                Connectez-vous pour retrouver vos combinés IA
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-text-secondary">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl text-base"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-text-secondary">
                      Mot de passe
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:text-primary-light transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl text-base"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-text-secondary cursor-pointer"
                  >
                    Se souvenir de moi
                  </label>
                </div>
              </div>

              {/* Submit — same gradient style as onboarding */}
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className={cn(
                  'w-full py-4 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2',
                  canSubmit && !loading
                    ? 'bg-gradient-to-r from-primary to-[#00D4FF] shadow-lg shadow-primary/30 hover:opacity-90'
                    : 'bg-surface-light text-text-muted cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-light" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-text-muted">
                  Pas encore de compte ?
                </span>
              </div>
            </div>

            {/* Secondary actions */}
            <div className="space-y-3">
              <Link
                href="/onboarding"
                className="w-full py-3.5 rounded-2xl font-semibold text-white border-2 border-surface-light hover:border-primary/40 hover:bg-surface-light transition-all duration-200 flex items-center justify-center gap-2"
              >
                Créer un compte
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/unlock-vip"
                className="w-full py-3.5 rounded-2xl font-semibold text-primary border-2 border-primary/30 hover:bg-primary/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Obtenir VIP Gratuit à Vie
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Icon className={cn('h-3.5 w-3.5', item.color)} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
