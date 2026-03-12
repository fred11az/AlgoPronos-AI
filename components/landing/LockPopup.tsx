'use client';

// Lock Popup — shown to visitors after they consume their 1 free demo ticket.
// Blocks further usage and drives registration.

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, CheckCircle2, X } from 'lucide-react';

interface LockPopupProps {
  open: boolean;
  onClose?: () => void;
}

const BENEFITS = [
  'Accès à votre tableau de bord personnel',
  '2 analyses IA complètes par jour',
  'Value bets, xG et probabilités débloqués',
  'Historique de vos combinés',
];

export function LockPopup({ open, onClose }: LockPopupProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="bg-surface border border-primary/30 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl shadow-black/50 relative">
              {/* Close */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-white mb-2">
                  Essai gratuit utilisé ✓
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Vous avez utilisé votre ticket de démonstration. Pour continuer à exploiter
                  nos <strong className="text-white">6 signaux IA</strong> et accéder à votre
                  tableau de bord, créez votre compte AlgoPronos maintenant.
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-surface-light rounded-xl p-4 mb-5 space-y-2">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-text-secondary">{b}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="space-y-2">
                <Button size="lg" variant="gradient" className="w-full" asChild>
                  <Link href="/onboarding">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Créer mon compte AlgoPronos — Gratuit
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full" asChild>
                  <Link href="/login">J&apos;ai déjà un compte — Se connecter</Link>
                </Button>
              </div>

              <p className="text-xs text-text-muted text-center mt-3">
                100% gratuit · Aucune carte bancaire · Accès immédiat
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
