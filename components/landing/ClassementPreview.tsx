'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, TrendingUp, ExternalLink, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from './ScrollReveal';

interface DailyTicket {
  id: string;
  date: string;
  total_odds: number;
  confidence_pct: number;
  status: 'won' | 'lost' | 'pending' | 'void';
  matches: { homeTeam: string; awayTeam: string; selection: { value: string; odds: number } }[];
}

interface HistoryStats {
  win_rate_pct: number | null;
  total_won: number;
  total_lost: number;
  total_tickets: number;
  avg_odds: number | null;
}

const STATUS_STYLE = {
  won: { label: '✅ Gagné', color: 'text-green-400 bg-green-400/10 border-green-500/30' },
  lost: { label: '❌ Perdu', color: 'text-red-400 bg-red-400/10 border-red-500/30' },
  pending: { label: '⏳ En cours', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30' },
  void: { label: '⭕ Nul', color: 'text-text-muted bg-surface-light border-surface-light' },
};

const RANK_BORDER = [
  'border-yellow-400/40 bg-yellow-400/5',
  'border-slate-400/40 bg-slate-400/5',
  'border-amber-700/40 bg-amber-700/5',
];
const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export function ClassementPreview() {
  const [tickets, setTickets] = useState<DailyTicket[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        // Show last 3 resolved tickets sorted by odds descending
        const sorted = (data.tickets || [])
          .filter((t: DailyTicket) => t.status !== 'void')
          .slice(0, 3);
        setTickets(sorted);
        setStats(data.stats || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[500px] h-[200px] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-5">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="text-accent text-sm font-semibold">Historique vérifiable</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              🏆 Tickets IA Récents
            </h2>
            <p className="text-text-secondary text-lg">
              Historique public et vérifiable — zéro ticket caché, résultats réels.
            </p>
          </div>
        </ScrollReveal>

        {/* Stats globales */}
        {stats && stats.total_tickets > 0 && (
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-surface border border-surface-light rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.win_rate_pct !== null ? `${stats.win_rate_pct}%` : '—'}
                </div>
                <div className="text-xs text-text-muted mt-1">Taux de réussite</div>
              </div>
              <div className="bg-surface border border-surface-light rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.total_tickets}</div>
                <div className="text-xs text-text-muted mt-1">Tickets analysés</div>
              </div>
              <div className="bg-surface border border-surface-light rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-secondary">
                  {stats.avg_odds !== null ? `x${stats.avg_odds}` : '—'}
                </div>
                <div className="text-xs text-text-muted mt-1">Cote moyenne</div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Ticket list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <ScrollReveal>
            <div className="bg-surface border border-surface-light rounded-2xl p-8 text-center">
              <Clock className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Les premiers tickets seront affichés ici une fois les résultats connus.</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket, i) => {
              const st = STATUS_STYLE[ticket.status] || STATUS_STYLE.pending;
              const picks = ticket.matches?.slice(0, 3) || [];
              return (
                <motion.div
                  key={ticket.id}
                  className={`border rounded-2xl shadow-lg overflow-hidden ${RANK_BORDER[i] || 'border-surface-light bg-surface'}`}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="px-5 py-4 flex items-center gap-4">
                    {/* Rank */}
                    {i < 3 && <div className="text-3xl flex-shrink-0">{RANK_EMOJI[i]}</div>}

                    {/* Picks */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-text-muted">
                          {new Date(ticket.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {picks.map((p, j) => (
                          <span key={j} className="text-xs bg-surface-light text-text-secondary px-2 py-0.5 rounded-md">
                            {p.homeTeam} – {p.awayTeam}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          Confiance : <span className="text-primary font-semibold ml-0.5">{ticket.confidence_pct}%</span>
                        </div>
                        {ticket.status === 'won' && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                        {ticket.status === 'lost' && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                      </div>
                    </div>

                    {/* Odds */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-white">x{Number(ticket.total_odds).toFixed(2)}</div>
                      <div className="text-xs text-text-muted">cote totale</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <ScrollReveal delay={0.4}>
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard/history">
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir tout l&apos;historique
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
