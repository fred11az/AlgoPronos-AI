// PageBottomCTA — persistent bottom CTA shown on all pronostic/league/team pages.
// Drives visitors to create an account and open a bookmaker account.
// Server component (no 'use client' needed).

import Link from 'next/link';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BOOKMAKERS = [
  { name: '1xBet', url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599', bonus: 'Bonus 200%' },
  { name: 'Melbet', url: 'https://refpa10004847.top/L?tag=d_3638696m_1186c&site=3638696&ad=1186', bonus: 'Bonus 100%' },
  { name: 'Betwinner', url: 'https://refpa10015723.top/L?tag=d_3638694m_8148c&site=3638694&ad=8148', bonus: 'Bonus 100%' },
];

export function PageBottomCTA() {
  return (
    <section className="border-t border-surface-light bg-surface">
      {/* Main registration CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-[#00D4FF]/5 to-primary/10 border-b border-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-medium mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Algorithme IA — Mis à jour quotidiennement
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Accédez à tous les pronostics IA <br className="hidden md:block" />
            <span className="text-primary">gratuitement</span>
          </h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            Créez votre compte AlgoPronos et recevez chaque jour le ticket combiné généré
            par notre algorithme — probabilités, value edge et cotes inclus.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/onboarding">
                <Sparkles className="mr-2 h-4 w-4" />
                Créer mon compte optimisé IA — Gratuit
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                Se connecter <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-4">
            Aucune carte bancaire · Accès immédiat · 100% gratuit
          </p>
        </div>
      </div>

      {/* Bookmaker links */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-xs text-text-muted text-center mb-4">
          Pour profiter des cotes analysées par notre IA, ouvrez un compte sur l&apos;un de nos partenaires :
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {BOOKMAKERS.map((bm) => (
            <Link
              key={bm.name}
              href={`/redirect?url=${encodeURIComponent(bm.url)}&bookmaker=${encodeURIComponent(bm.name)}`}
              className="flex items-center justify-between gap-3 bg-surface-light hover:bg-white/10 border border-surface-light hover:border-primary/30 rounded-xl px-4 py-3 transition-colors group flex-1 max-w-xs mx-auto sm:mx-0"
            >
              <div>
                <div className="text-sm font-semibold text-white">{bm.name}</div>
                <div className="text-xs text-green-400">{bm.bonus}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                Ouvrir
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
        <p className="text-xs text-text-muted text-center mt-4">
          Les paris sportifs comportent des risques. Jouez de manière responsable.
        </p>
      </div>
    </section>
  );
}
