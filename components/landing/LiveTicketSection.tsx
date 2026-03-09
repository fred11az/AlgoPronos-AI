'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Brain, TrendingUp, Shield, ExternalLink, Clock, Loader2, Zap, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchPick {
  homeTeam: string;
  awayTeam: string;
  league: string;
  selection: { type: string; value: string; odds: number };
}

interface DailyTicket {
  id: string;
  date: string;
  matches: MatchPick[];
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: string;
}

function valueLabel(type: string, value: string, home: string, away: string): string {
  if (type === '1X2') {
    if (value === '1') return `${home} Victoire`;
    if (value === '2') return `${away} Victoire`;
    return 'Match Nul';
  }
  if (type === 'Double Chance') {
    if (value === '1X') return `${home} ou Nul`;
    if (value === 'X2') return `${away} ou Nul`;
    return '1 ou 2';
  }
  if (type === 'Over/Under') return value === 'over' ? 'Plus de 2.5 buts' : 'Moins de 2.5 buts';
  return value;
}

function StatusBanner({ status }: { status: string }) {
  if (status === 'won') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 rounded-xl px-5 py-3 mx-6 mt-5"
      >
        <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
        <div>
          <p className="text-green-400 font-bold text-sm">Ticket Gagné ✅</p>
          <p className="text-green-400/70 text-xs">Félicitations ! Ce ticket s&apos;est avéré gagnant.</p>
        </div>
        <span className="ml-auto text-green-400 font-bold text-lg">+{' '}x{}</span>
      </motion.div>
    );
  }
  if (status === 'lost') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 rounded-xl px-5 py-3 mx-6 mt-5"
      >
        <XCircle className="h-5 w-5 text-red-400 shrink-0" />
        <div>
          <p className="text-red-400 font-bold text-sm">Ticket Perdu ❌</p>
          <p className="text-red-400/70 text-xs">Résultat défavorable. L&apos;IA apprend de chaque ticket.</p>
        </div>
      </motion.div>
    );
  }
  if (status === 'void') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-surface-light border border-surface-light rounded-xl px-5 py-3 mx-6 mt-5"
      >
        <MinusCircle className="h-5 w-5 text-text-muted shrink-0" />
        <div>
          <p className="text-text-secondary font-bold text-sm">Ticket Annulé ⏸</p>
          <p className="text-text-muted text-xs">Un ou plusieurs matchs ont été annulés.</p>
        </div>
      </motion.div>
    );
  }
  return null;
}

export function LiveTicketSection() {
  const [ticket, setTicket] = useState<DailyTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ticket-du-jour')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ticket) setTicket(data.ticket);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isResolved = ticket && ticket.status !== 'pending';

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-primary text-sm font-semibold">
              {isResolved ? 'Résultats du jour' : 'En direct'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            🎯 Ticket IA du Jour
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            {isResolved
              ? 'Les résultats de ce ticket sont maintenant disponibles.'
              : 'Notre IA analyse des centaines de matchs chaque matin et sélectionne les 3 meilleures opportunités'}
          </p>
        </motion.div>

        {/* Ticket Card */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="flex flex-col items-center justify-center py-20 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-text-muted text-sm">Analyse IA en cours...</p>
            </motion.div>
          ) : ticket ? (
            <motion.div
              key="ticket"
              className="relative"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow effect */}
              <div className={`absolute -inset-2 rounded-3xl blur-xl ${
                ticket.status === 'won'  ? 'bg-green-500/20' :
                ticket.status === 'lost' ? 'bg-red-500/20' :
                'bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20'
              }`} />

              <div className="relative bg-surface border border-primary/25 rounded-2xl overflow-hidden shadow-2xl">
                {/* Card header */}
                <div className={`px-6 py-5 flex items-center justify-between ${
                  ticket.status === 'won'  ? 'bg-gradient-to-r from-green-600 to-green-500' :
                  ticket.status === 'lost' ? 'bg-gradient-to-r from-red-700 to-red-600' :
                  'bg-gradient-to-r from-primary to-secondary'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white">AlgoPronos AI</div>
                      <div className="text-xs text-white/70 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ticket.status === 'won'  ? 'Ticket Gagné ✅' :
                         ticket.status === 'lost' ? 'Ticket Perdu ❌' :
                         ticket.status === 'void' ? 'Annulé ⏸' :
                         'Généré aujourd\'hui'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">x{ticket.total_odds.toFixed(2)}</div>
                    <div className="text-xs text-white/70">cote totale</div>
                  </div>
                </div>

                {/* Picks */}
                <div className="divide-y divide-surface-light">
                  {ticket.matches.map((match, i) => (
                    <motion.div
                      key={i}
                      className="px-6 py-4 flex items-center justify-between gap-4"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-text-muted mb-1">{match.league}</div>
                        <div className="text-sm text-text-secondary truncate">
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        <div className="font-semibold text-white mt-0.5">
                          {valueLabel(match.selection.type, match.selection.value, match.homeTeam, match.awayTeam)}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-2xl font-bold ${
                          ticket.status === 'won' ? 'text-green-400' :
                          ticket.status === 'lost' ? 'text-red-400' :
                          'text-primary'
                        }`}>
                          {match.selection.odds.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1 justify-end text-xs text-secondary">
                          <Zap className="h-3 w-3" />
                          IA Pick
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Confidence bar */}
                <div className="px-6 py-5 bg-surface/50 border-t border-surface-light">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Shield className="h-4 w-4 text-primary" />
                      Confiance IA
                    </div>
                    <span className="text-primary font-bold text-lg">{ticket.confidence_pct}%</span>
                  </div>
                  <div className="w-full bg-surface-light rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        ticket.status === 'won'  ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        ticket.status === 'lost' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                        'bg-gradient-to-r from-primary to-secondary'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${ticket.confidence_pct}%` }}
                      transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="px-6 py-5 flex flex-col sm:flex-row gap-3 border-t border-surface-light">
                  {ticket.status === 'pending' ? (
                    <>
                      <Button size="lg" variant="gradient" className="flex-1" asChild>
                        <Link href="/onboarding">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Jouer ce ticket
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline" className="flex-1" asChild>
                        <Link href="/classement">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Voir le classement
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" variant="outline" className="flex-1" asChild>
                        <Link href="/classement">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Voir l&apos;historique
                        </Link>
                      </Button>
                      <Button size="lg" variant="gradient" className="flex-1" asChild>
                        <Link href="/dashboard/generate">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Générer mon ticket
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="text-center py-16 text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Ticket du jour disponible bientôt...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
