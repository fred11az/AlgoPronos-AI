import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import {
  Brain, TrendingUp, ArrowRight, ChevronRight,
  CheckCircle2, XCircle, Clock, Zap, Trophy, BarChart2, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Pronostics Football IA — Tickets du Jour | AlgoPronos',
  description:
    'Pronostics football générés chaque jour par l\'algorithme AlgoPronos AI. Historique des tickets, résultats et confiance IA.',
};

interface MatchPick {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime?: string;
  selection: { type: string; value: string; odds: number };
  result?: 'won' | 'lost' | 'void';
  score?: { home: number; away: number } | null;
}

interface DailyTicket {
  id: string;
  date: string;
  matches: MatchPick[];
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: string;
  analysis?: { summary?: string; tip?: string };
}

function valueLabel(type: string, value: string, home: string, away: string): string {
  if (type === '1X2') {
    if (value === '1') return `${home} gagne`;
    if (value === '2') return `${away} gagne`;
    return 'Nul';
  }
  if (type === 'Double Chance') {
    if (value === '1X') return `${home} ou Nul`;
    if (value === 'X2') return `${away} ou Nul`;
  }
  if (type === 'Over/Under') return value === 'over' ? '+2.5 buts' : '-2.5 buts';
  return value;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  if (d.toDateString() === todayDate.toDateString()) return "Aujourd'hui";
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'won')
    return (
      <span className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> Gagné
      </span>
    );
  if (status === 'lost')
    return (
      <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
        <XCircle className="h-3 w-3" /> Perdu
      </span>
    );
  if (status === 'void')
    return (
      <span className="inline-flex items-center gap-1 bg-surface-light text-text-muted text-xs font-bold px-2.5 py-1 rounded-full">
        Annulé
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2.5 py-1 rounded-full">
      <Clock className="h-3 w-3" /> En cours
    </span>
  );
}

export default async function PronosticsPage() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's ticket
  const { data: todayTicket } = await supabase
    .from('daily_ticket')
    .select('*')
    .eq('date', today)
    .single();

  // Fetch recent history (last 30 days excluding today)
  const { data: history } = await supabase
    .from('daily_ticket')
    .select('*')
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(30);

  const allTickets = history || [];

  // Stats
  const resolved = allTickets.filter(t => t.status === 'won' || t.status === 'lost');
  const won = resolved.filter(t => t.status === 'won');
  const winRate = resolved.length > 0 ? Math.round((won.length / resolved.length) * 100) : null;
  const avgOdds = resolved.length > 0
    ? (resolved.reduce((acc, t) => acc + Number(t.total_odds), 0) / resolved.length).toFixed(2)
    : null;

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Pronostics</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-4">
            <Brain className="h-4 w-4" />
            Analyse algorithmique · Mise à jour quotidienne
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Pronostics Football IA
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Chaque jour, notre algorithme sélectionne les meilleures opportunités parmi des centaines de matchs
            et génère un ticket IA avec une confiance supérieure à 55 %.
          </p>
        </div>

        {/* Stats bar */}
        {resolved.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-surface border border-surface-light rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-green-400 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-xl font-bold">{winRate}%</span>
              </div>
              <p className="text-xs text-text-muted">Taux de réussite</p>
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                <BarChart2 className="h-4 w-4" />
                <span className="text-xl font-bold">x{avgOdds}</span>
              </div>
              <p className="text-xs text-text-muted">Cote moyenne</p>
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-secondary mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xl font-bold">{allTickets.length}</span>
              </div>
              <p className="text-xs text-text-muted">Tickets analysés</p>
            </div>
          </div>
        )}
      </section>

      {/* Today's ticket */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className="flex items-center gap-3 mb-5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <h2 className="text-xl font-bold text-white">🎯 Ticket IA du Jour</h2>
        </div>

        {todayTicket ? (
          <div className="bg-surface border border-primary/25 rounded-2xl overflow-hidden shadow-lg">
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              todayTicket.status === 'won'  ? 'bg-gradient-to-r from-green-600 to-green-500' :
              todayTicket.status === 'lost' ? 'bg-gradient-to-r from-red-700 to-red-600' :
              'bg-gradient-to-r from-primary to-secondary'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">AlgoPronos AI</div>
                  <div className="text-xs text-white/70">
                    {todayTicket.status === 'won'  ? '✅ Ticket Gagné' :
                     todayTicket.status === 'lost' ? '❌ Ticket Perdu' :
                     "Généré aujourd'hui"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">x{Number(todayTicket.total_odds).toFixed(2)}</div>
                <div className="text-xs text-white/70">cote totale</div>
              </div>
            </div>

            {/* Picks */}
            <div className="divide-y divide-surface-light">
              {(todayTicket.matches as MatchPick[]).map((match, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted mb-0.5">{match.league}</div>
                    <div className="text-sm text-text-secondary truncate">
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div className="font-semibold text-white mt-0.5 text-sm">
                      {valueLabel(match.selection.type, match.selection.value, match.homeTeam, match.awayTeam)}
                    </div>
                    {match.score && (
                      <div className="mt-1 text-xs font-bold">
                        <span className={
                          match.result === 'won' ? 'text-green-400' :
                          match.result === 'lost' ? 'text-red-400' :
                          'text-text-muted'
                        }>
                          {match.score.home} – {match.score.away}
                          {match.result === 'won' && ' ✓'}
                          {match.result === 'lost' && ' ✗'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xl font-bold text-primary">{match.selection.odds.toFixed(2)}</div>
                    <div className="text-xs text-text-muted">{match.selection.type}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Confidence + analysis */}
            <div className="px-6 py-4 bg-surface/50 border-t border-surface-light space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Shield className="h-4 w-4 text-primary" />
                  Confiance IA
                </div>
                <span className="text-primary font-bold">{todayTicket.confidence_pct}%</span>
              </div>
              <div className="w-full bg-surface-light rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${todayTicket.confidence_pct}%` }}
                />
              </div>
              {(todayTicket.analysis as { summary?: string })?.summary && (
                <p className="text-text-secondary text-sm italic border-l-2 border-primary/30 pl-3">
                  {(todayTicket.analysis as { summary?: string }).summary}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 border-t border-surface-light">
              {todayTicket.status === 'pending' ? (
                <Button variant="gradient" className="flex-1" asChild>
                  <Link href="/onboarding">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Jouer ce ticket
                  </Link>
                </Button>
              ) : (
                <Button variant="gradient" className="flex-1" asChild>
                  <Link href="/dashboard/generate">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Générer mon ticket
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="flex-1" asChild>
                <Link href={`/ticket/${todayTicket.id}`}>
                  Voir le ticket complet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-surface-light rounded-2xl p-10 text-center">
            <Brain className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <p className="text-text-muted">Le ticket du jour est en cours de génération…</p>
            <p className="text-xs text-text-muted mt-1">Revenez dans quelques instants.</p>
          </div>
        )}
      </section>

      {/* History */}
      {allTickets.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="flex items-center gap-3 mb-5">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-white">Historique des tickets IA</h2>
          </div>

          <div className="space-y-3">
            {allTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/ticket/${ticket.id}`}
                className="flex items-center justify-between bg-surface hover:bg-surface-light border border-surface-light hover:border-primary/20 rounded-xl px-5 py-4 transition-all group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="shrink-0 text-center hidden sm:block">
                    <div className="text-xs text-text-muted capitalize">{formatDate(ticket.date)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted sm:hidden mb-0.5 capitalize">{formatDate(ticket.date)}</div>
                    <div className="flex flex-wrap gap-1">
                      {(ticket.matches as MatchPick[]).slice(0, 3).map((m, i) => (
                        <span key={i} className="text-xs text-text-secondary bg-background rounded px-1.5 py-0.5 truncate max-w-[120px]">
                          {m.homeTeam} vs {m.awayTeam}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">x{Number(ticket.total_odds).toFixed(2)}</div>
                    <div className="text-xs text-primary">{ticket.confidence_pct}% confiance</div>
                  </div>
                  <StatusBadge status={ticket.status} />
                  <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty history */}
      {allTickets.length === 0 && !todayTicket && (
        <section className="max-w-5xl mx-auto px-4 pb-16 text-center py-16">
          <Brain className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <p className="text-text-muted mb-2">L&apos;algorithme génère son premier ticket aujourd&apos;hui.</p>
          <p className="text-text-muted text-sm">Revenez demain pour découvrir l&apos;historique.</p>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-[#00D4FF]/10 border-t border-primary/20">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Générez un combiné IA personnalisé
          </h2>
          <p className="text-text-secondary mb-6 text-sm">
            Notre algorithme sélectionne les meilleures combinaisons selon votre profil de risque.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/dashboard/generate">
              <Button variant="gradient" size="lg">
                Générer mon ticket
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/compte-optimise-ia">
              <Button variant="outline" size="lg">
                Compte Optimisé IA
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 1800;
