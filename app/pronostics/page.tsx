import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';
import {
  Brain, TrendingUp, ArrowRight, ChevronRight,
  CheckCircle2, XCircle, Clock, Zap, Trophy, BarChart2, Shield, Sparkles,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TicketTabs } from '@/components/pronostics/TicketTabs';

export const metadata: Metadata = {
  title: 'Pronostics Football IA — Tickets du Jour | AlgoPronos',
  description:
    'Pronostics football générés chaque jour par l\'algorithme AlgoPronos AI. Historique des tickets, résultats et confiance IA.',
  alternates: { canonical: 'https://algopronos.com/pronostics' },
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
  type: string;
  matches: MatchPick[];
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: string;
  access_tier?: string;
  analysis?: { summary?: string; tip?: string };
}

function valueLabel(type: string, value: string, home: string, away: string): string {
  if (type === '1X2' || type === 'home' || type === 'away' || type === 'draw') {
    if (value === '1' || type === 'home') return `${home} gagne`;
    if (value === '2' || type === 'away') return `${away} gagne`;
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

export default async function PronosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type = 'standard' } = await searchParams;
  const supabase = createAdminClient();
  const user = await getCurrentUser();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's tickets
  const { data: todayTickets } = await supabase
    .from('daily_ticket')
    .select('*')
    .eq('date', today);

  const availableTypes = (todayTickets || []).map(t => t.type || 'standard');
  const activeTicket = todayTickets?.find(t => (t.type || 'standard') === type) || todayTickets?.find(t => t.type === 'standard');

  // Check access for Optimus
  const isOptimised = user?.tier === 'optimised' || user?.tier === 'vip' || user?.role === 'admin';
  const isLocked = activeTicket?.access_tier === 'optimised_only' && !isOptimised;

  // Check access for Montante (requires account)
  const isMontanteLocked = activeTicket?.type === 'montante' && !user;

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
    <main className="min-h-screen bg-background pb-20">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Pronostics</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative pt-10 pb-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-bold text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            ANALYSE PRÉDICTIVE IA · FLASH-SCORE SYNC
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Tickets <span className="text-primary">Premium</span> IA
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto text-base md:text-lg mb-10">
            Découvrez nos sélections stratégiques basées sur l&apos;analyse xG et les algorithmes de Value Betting.
          </p>
        </div>
      </section>

      {/* TABS SELECTION */}
      <div className="max-w-4xl mx-auto px-4">
        <TicketTabs 
            activeTab={type} 
            availableTypes={availableTypes}
        />
      </div>

      {/* Active Ticket Display */}
      <section className="max-w-4xl mx-auto px-4 transition-all duration-500">
        {activeTicket ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            
            <div className="relative bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden">
              <div className={`p-8 flex flex-col sm:flex-row items-center justify-between gap-6 ${
                activeTicket.type === 'montante' ? 'bg-gradient-to-br from-green-500/10 to-transparent' :
                activeTicket.type === 'optimus'  ? 'bg-gradient-to-br from-secondary/20 to-transparent' :
                'bg-gradient-to-br from-primary/20 to-transparent'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner ${
                      activeTicket.type === 'montante' ? 'bg-green-500/20 text-green-400' :
                      activeTicket.type === 'optimus'  ? 'bg-secondary/20 text-secondary' :
                      'bg-primary/20 text-primary'
                  }`}>
                    {activeTicket.type === 'montante' ? <Shield className="h-7 w-7" /> :
                     activeTicket.type === 'optimus'  ? <Zap className="h-7 w-7" /> :
                     <Brain className="h-7 w-7" />}
                  </div>
                  <div>
                    <div className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">
                        {activeTicket.type === 'montante' ? 'La Montante Sécurisée' :
                         activeTicket.type === 'optimus'  ? "L'Optimus IA (Cotes Boostées)" :
                         "Ticket du Jour Standard"}
                    </div>
                    <div className="text-2xl font-black text-white uppercase italic">
                      {activeTicket.status === 'won'  ? '✅ Session Succès' :
                       activeTicket.status === 'lost' ? '❌ Session Negative' :
                       "Analyse Active"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center sm:items-end">
                  <div className="text-5xl font-black text-white tracking-tighter sm:text-6xl">
                    x{(Number(activeTicket.total_odds) || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Cote Totale</div>
                </div>
              </div>

              {/* Match list with Locking Logic */}
              <div className="relative">
                {isMontanteLocked ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md p-8 text-center">
                    <div className="max-w-sm">
                      <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/30">
                        <Lock className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase mb-2">Compte Requis</h3>
                      <p className="text-text-muted text-sm mb-6 leading-relaxed">
                        Le ticket <strong>Montante</strong> est réservé aux membres inscrits. L&apos;inscription est <strong>gratuite</strong>.
                      </p>
                      <Link href="/register">
                        <Button variant="gradient" className="w-full h-12">
                          Créer mon compte (Gratuit)
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : null}
                {isLocked ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md p-8 text-center">
                    <div className="max-w-sm">
                        <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-secondary/30">
                            <Lock className="h-8 w-8 text-secondary" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase mb-2">Contenu Verrouillé</h3>
                        <p className="text-text-muted text-sm mb-6 leading-relaxed">
                            Ce ticket <strong>Optimus</strong> est réservé aux membres ayant un <strong>Compte Optimisé IA</strong> vérifié.
                        </p>
                        <Link href="/onboarding">
                            <Button variant="gradient" className="w-full h-12">
                                Activer mon compte (Gratuit)
                            </Button>
                        </Link>
                    </div>
                  </div>
                ) : null}

                <div className={`px-1 py-1 ${isLocked || isMontanteLocked ? 'grayscale opacity-20 pointer-events-none blur-sm' : ''}`}>
                  <div className="bg-surface/30 rounded-[1.5rem] overflow-hidden border border-white/5">
                    {(activeTicket.matches as MatchPick[]).map((match, i) => (
                      <div key={i} className="px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0 flex flex-col gap-1 text-center md:text-left">
                          <div className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-4">
                            <span className="truncate">{match.homeTeam}</span>
                            <span className="text-text-muted text-xs font-black italic">VS</span>
                            <span className="truncate">{match.awayTeam}</span>
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-black py-1">
                              {valueLabel(match.selection.type, match.selection.value, match.homeTeam, match.awayTeam)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end shrink-0">
                          <div className="text-3xl font-black text-white leading-none">{(match.selection.odds || 0).toFixed(2)}</div>
                          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Cote</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analysis & CTA */}
              <div className="p-8 space-y-8 bg-surface/20">
                {!isLocked && (
                    <div className="flex flex-col sm:flex-row gap-8 items-center">
                        <div className="w-full sm:w-1/2 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-white uppercase tracking-widest">Confiance IA</span>
                                <span className="text-primary font-black">{activeTicket.confidence_pct}%</span>
                            </div>
                            <div className="h-3 w-full bg-surface-light rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${activeTicket.confidence_pct}%` }} />
                            </div>
                        </div>
                        <div className="flex-1 text-sm text-text-secondary leading-relaxed italic opacity-80 pl-4 border-l-2 border-primary/30">
                            {(activeTicket.analysis as { summary?: string })?.summary || "Analyse probabiliste confirmée pour cette session."}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="gradient" size="xl" className="flex-1 h-14 text-base font-black uppercase italic tracking-wider shadow-lg shadow-primary/20" asChild>
                    <Link href={`/redirect?url=${encodeURIComponent('https://1xbet.com')}&bookmaker=1xBet`}>
                      <TrendingUp className="mr-3 h-5 w-5" />
                      COPIER CE TICKET (1xBET)
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" className="h-14 px-8 border-white/10 hover:bg-white/5 text-white font-bold" asChild>
                    <Link href={`/ticket/${activeTicket.id}`}>
                      DÉTAILS
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-dashed border-white/10 rounded-[2rem] p-20 text-center">
            <Brain className="h-10 w-10 text-primary/40 animate-pulse mx-auto mb-6" />
            <p className="text-2xl font-black text-white uppercase tracking-tight">Analyse en cours...</p>
          </div>
        )}
      </section>

      {/* History */}
      {allTickets.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mt-20">
          <div className="flex items-center gap-3 mb-8">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Historique des sessions</h2>
          </div>
          <div className="space-y-3">
            {allTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/ticket/${ticket.id}`}
                className="flex items-center justify-between bg-surface hover:bg-surface-light border border-surface-light hover:border-primary/20 rounded-2xl px-6 py-5 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="shrink-0 text-center">
                    <div className="text-xs font-bold text-white mb-1 uppercase tracking-tighter">{formatDate(ticket.date)}</div>
                    <div className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                        ticket.type === 'montante' ? 'text-green-400 border-green-500/20' :
                        ticket.type === 'optimus'  ? 'text-secondary border-secondary/20' :
                        'text-primary border-primary/20'
                    }`}>
                        {ticket.type}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pl-4 border-l border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {(ticket.matches as MatchPick[]).slice(0, 2).map((m, i) => (
                        <span key={i} className="text-xs text-text-secondary truncate bg-background/50 px-2 py-1 rounded-lg">
                          {m.homeTeam} - {m.awayTeam}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-lg font-black text-white leading-none">x{(Number(ticket.total_odds) || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-text-muted font-bold mt-1 uppercase">Cote Totale</div>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export const revalidate = 600; // 10 mins
