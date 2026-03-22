import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Track Record Vérifié — AlgoPronos AI',
  description:
    'Consultez notre bilan réel : taux de réussite, série en cours et les 30 derniers tickets IA du Jour. Toutes les données sont publiques et vérifiables.',
};

// ─── Data fetching ────────────────────────────────────────────────────────────

interface TicketRow {
  id: string;
  date: string;
  total_odds: number;
  confidence_pct: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  matches: Array<{
    homeTeam: string;
    awayTeam: string;
    selection: { value: string; odds: number };
  }>;
}

async function getTrackRecord() {
  const adminSupabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: tickets } = await adminSupabase
    .from('daily_ticket')
    .select('id, date, total_odds, confidence_pct, status, matches')
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(30);

  const rows = (tickets || []) as TicketRow[];

  const won = rows.filter(t => t.status === 'won');
  const lost = rows.filter(t => t.status === 'lost');
  const resolved = won.length + lost.length;
  const winRate = resolved > 0 ? Math.round((won.length / resolved) * 1000) / 10 : null;

  const resolvedOdds = [...won, ...lost].map(t => Number(t.total_odds)).filter(o => o > 0);
  const avgOdds =
    resolvedOdds.length > 0
      ? Math.round((resolvedOdds.reduce((a, b) => a + b, 0) / resolvedOdds.length) * 100) / 100
      : null;

  const wonOdds = won.map(t => Number(t.total_odds)).filter(o => o > 0);
  const bestOdds = wonOdds.length > 0 ? Math.max(...wonOdds) : null;

  // Current streak
  const resolvedSorted = rows
    .filter(t => t.status === 'won' || t.status === 'lost')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentStreak = 0;
  for (const t of resolvedSorted) {
    if (t.status === 'won') currentStreak++;
    else break;
  }

  return { tickets: rows, won: won.length, lost: lost.length, resolved, winRate, avgOdds, bestOdds, currentStreak };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function StatusDot({ status }: { status: string }) {
  if (status === 'won') return <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />;
  if (status === 'lost') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
  if (status === 'pending') return <Clock className="h-4 w-4 text-yellow-400 shrink-0" />;
  return <XCircle className="h-4 w-4 text-gray-500 shrink-0" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrackRecordPage() {
  const { tickets, won, lost, resolved, winRate, avgOdds, bestOdds, currentStreak } =
    await getTrackRecord();

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/30">
      <Header />

      <main className="pt-28 pb-24">
        <div className="max-w-4xl mx-auto px-4">

          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400 mb-5 uppercase tracking-wider">
              <CheckCircle className="h-3 w-3" />
              Données réelles — Aucun filtre
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Notre <span className="text-primary">Track Record</span>
            </h1>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Chaque ticket IA est enregistré avant les matchs et résolu automatiquement via
              API-Football. Voici notre bilan brut, sans retouche.
            </p>
          </div>

          {/* Streak banner */}
          {currentStreak >= 2 && (
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500/15 to-yellow-500/10 border border-orange-500/25 mb-8">
              <Flame className="h-7 w-7 text-orange-400 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-white">
                  {currentStreak} tickets gagnants consécutifs 🔥
                </p>
                <p className="text-sm text-text-muted">Série en cours — l&apos;IA est en feu !</p>
              </div>
              <span className="text-4xl font-black text-orange-400">{currentStreak}</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 text-center">
              <Trophy className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-white">
                {winRate !== null ? `${winRate}%` : '—'}
              </p>
              <p className="text-xs text-text-muted mt-1">Taux de réussite</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border text-center">
              <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-3xl font-black text-white">{resolved}</p>
              <p className="text-xs text-text-muted mt-1">Tickets résolus</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border text-center">
              <TrendingUp className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-3xl font-black text-white">
                {avgOdds ? `×${avgOdds}` : '—'}
              </p>
              <p className="text-xs text-text-muted mt-1">Cote moyenne</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 text-center">
              <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-yellow-400">
                {bestOdds ? `×${bestOdds.toFixed(2)}` : '—'}
              </p>
              <p className="text-xs text-text-muted mt-1">Meilleure cote</p>
            </div>
          </div>

          {/* W/L ratio bar */}
          {resolved > 0 && (
            <div className="mb-12 p-5 rounded-2xl bg-surface border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-green-400">{won} Gagnés</span>
                <span className="text-xs text-text-muted">{resolved} résolus</span>
                <span className="text-sm font-medium text-red-400">{lost} Perdus</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-red-500/20">
                <div
                  className="bg-green-500 rounded-l-full transition-all"
                  style={{ width: `${(won / resolved) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Tickets list */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Derniers tickets
            </h2>

            {tickets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface border border-border text-center text-text-muted">
                Aucun ticket disponible pour le moment
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <Link
                    key={ticket.id}
                    href={`/ticket/${ticket.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors group"
                  >
                    <StatusDot status={ticket.status} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{formatDate(ticket.date)}</p>
                        <span className="text-xs text-text-muted">·</span>
                        <p className="text-xs text-text-muted">
                          {Array.isArray(ticket.matches) ? ticket.matches.length : 0} sélections
                        </p>
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {Array.isArray(ticket.matches)
                          ? ticket.matches.slice(0, 2).map(m => `${m.homeTeam} vs ${m.awayTeam}`).join(' · ')
                          : ''}
                        {Array.isArray(ticket.matches) && ticket.matches.length > 2 ? ' …' : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${
                        ticket.status === 'won' ? 'text-green-400' :
                        ticket.status === 'lost' ? 'text-red-400' :
                        'text-text-muted'
                      }`}>
                        ×{Number(ticket.total_odds).toFixed(2)}
                      </p>
                      <p className={`text-xs font-medium ${
                        ticket.status === 'won' ? 'text-green-400' :
                        ticket.status === 'lost' ? 'text-red-400' :
                        ticket.status === 'pending' ? 'text-yellow-400' :
                        'text-gray-500'
                      }`}>
                        {ticket.status === 'won' ? 'Gagné' :
                         ticket.status === 'lost' ? 'Perdu' :
                         ticket.status === 'pending' ? 'En cours' : 'Annulé'}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20">
            <h2 className="text-2xl font-bold text-white mb-2">
              Rejoignez l&apos;élite
            </h2>
            <p className="text-text-muted mb-6 max-w-lg mx-auto">
              Ces résultats sont ceux du Ticket IA du Jour — disponible gratuitement.
              Créez un compte pour générer vos propres combinés personnalisés.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link href="/try-free">
                  <Zap className="mr-2 h-5 w-5" />
                  Essayer Gratuitement
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard/history">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Historique complet
                </Link>
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Jouer responsable · 18+ · Les performances passées ne garantissent pas les résultats futurs
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
