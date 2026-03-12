'use client';

// PronosPaywall — blurs sensitive prediction data and drives account creation.
// Wrap any server-rendered content: the children are rendered (good for SEO),
// but visually blurred behind a registration CTA for guests.

import Link from 'next/link';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  'Pronostic complet + probabilité IA',
  'Analyse algorithmique détaillée',
  'Value Edge et cote recommandée',
  'Ticket combiné du jour',
];

interface PronosPaywallProps {
  children: React.ReactNode;
}

export function PronosPaywall({ children }: PronosPaywallProps) {
  return (
    <div className="relative">
      {/* Content rendered for SEO but blurred visually */}
      <div className="blur-md pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
        <div className="bg-surface/95 border border-primary/30 rounded-2xl p-6 shadow-2xl shadow-black/60 w-full max-w-sm backdrop-blur-sm">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-[#00D4FF]/20 border border-primary/30 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white mb-1">
              Pronostic complet réservé aux membres
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Créez votre compte <strong className="text-white">gratuit</strong> pour accéder à
              l&apos;analyse IA complète, les probabilités et le value edge.
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-surface-light rounded-xl p-3 mb-4 space-y-2">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-xs text-text-secondary">{b}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Button size="sm" variant="gradient" className="w-full" asChild>
              <Link href="/onboarding">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Créer mon compte — Gratuit
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/login">J&apos;ai déjà un compte</Link>
            </Button>
          </div>

          <p className="text-xs text-text-muted text-center mt-3">
            100% gratuit · Aucune carte bancaire
          </p>
        </div>
      </div>
    </div>
  );
}
