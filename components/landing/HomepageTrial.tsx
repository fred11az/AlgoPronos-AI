'use client';

// Homepage Trial Widget — visitor's single entry point to the AI generator.
// Uses the /api/ticket-du-jour endpoint to fetch the daily best picks.
// After displaying results, fires the LockPopup to drive registration.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Lock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { LockPopup } from './LockPopup';

// Cookie name that persists across page refreshes (fingerprint lock)
const TRIAL_COOKIE = 'algopronos_v_trial';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

interface DailyTicketMatch {
  homeTeam: string;
  awayTeam: string;
  league: string;
  pick: string;
  odds: number;
  confidence?: number;
}

interface DailyTicket {
  matches?: DailyTicketMatch[];
  total_odds?: number;
  confidence_pct?: number;
  analysis?: { summary?: string };
}

export function HomepageTrial() {
  const [trialUsed, setTrialUsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<DailyTicket | null>(null);
  const [showLock, setShowLock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check client-side cookie on mount
  useEffect(() => {
    if (getCookie(TRIAL_COOKIE)) {
      setTrialUsed(true);
    }
  }, []);

  async function handleGenerate() {
    if (trialUsed) {
      setShowLock(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ticket-du-jour');
      if (!res.ok) throw new Error('Erreur lors de la génération');
      const data = await res.json();

      // Mark trial as used (client cookie + server cookie via header)
      setCookie(TRIAL_COOKIE, '1', 365);
      setTrialUsed(true);
      setTicket(data.ticket || data);

      // Show lock popup after short delay
      setTimeout(() => setShowLock(true), 2000);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">1 ticket démo offert</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Testez l&apos;algorithme maintenant
          </h3>
          <p className="text-sm text-text-muted">
            Découvrez le Ticket IA du Jour — généré par nos 6 signaux d&apos;analyse.
          </p>
        </div>

        {/* Result card */}
        <AnimatePresence>
          {ticket && ticket.matches && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-primary/25 rounded-2xl overflow-hidden mb-4"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-white">Ticket IA du Jour</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-primary font-bold">
                    x{ticket.total_odds?.toFixed(2) ?? '--'}
                  </span>
                  <span className="text-secondary font-semibold">
                    {ticket.confidence_pct ?? '--'}% conf.
                  </span>
                </div>
              </div>

              {/* Matches */}
              <div className="divide-y divide-surface-light">
                {ticket.matches.slice(0, 3).map((m, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted">{m.league}</p>
                      <p className="text-sm font-semibold text-white">
                        {m.homeTeam} vs {m.awayTeam}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{m.pick}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-primary">{m.odds}</p>
                      <p className="text-xs text-text-muted">cote</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Blurred analysis — teaser for registered users */}
              {ticket.analysis?.summary && (
                <div className="px-4 pb-4">
                  <div className="relative mt-3 rounded-xl overflow-hidden">
                    <p className="text-xs text-text-secondary leading-relaxed blur-sm select-none">
                      {ticket.analysis.summary}
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-[2px] rounded-xl">
                      <div className="flex items-center gap-1.5 bg-surface border border-primary/30 rounded-full px-3 py-1.5">
                        <Lock className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold text-primary">
                          Créez un compte pour lire l&apos;analyse
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* CTA */}
        {!ticket ? (
          trialUsed ? (
            <Button
              size="lg"
              variant="outline"
              className="w-full border-primary/40 text-primary hover:border-primary"
              onClick={() => setShowLock(true)}
            >
              <Lock className="mr-2 h-4 w-4" />
              Essai déjà utilisé — Créer mon compte
            </Button>
          ) : (
            <Button
              size="lg"
              variant="gradient"
              className="w-full"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  Génération en cours…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer mon ticket démo gratuit
                </>
              )}
            </Button>
          )
        ) : (
          <div className="space-y-2">
            <Button size="lg" variant="gradient" className="w-full" asChild>
              <Link href="/onboarding">
                <Sparkles className="mr-2 h-4 w-4" />
                Créer mon compte — Accès complet gratuit
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-text-muted"
              onClick={() => setShowLock(true)}
            >
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              Voir ce que je débloque en m&apos;inscrivant
            </Button>
          </div>
        )}
      </div>

      <LockPopup open={showLock} onClose={() => setShowLock(false)} />
    </>
  );
}
