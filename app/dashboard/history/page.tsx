'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Share2,
  ExternalLink,
  Calendar,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyTicket {
  id: string;
  date: string;
  matches: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    kickoffTime: string;
    selection: { type: string; value: string; odds: number; impliedPct: number };
  }[];
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  analysis?: {
    summary?: string;
    confidence?: string;
    tip?: string;
  };
  created_at: string;
}

interface PerformanceStats {
  total_won: number;
  total_lost: number;
  total_void: number;
  total_resolved: number;
  win_rate_pct: number | null;
  avg_odds: number | null;
  best_win_odds: number | null;
  total_tickets: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function statusConfig(status: string) {
  switch (status) {
    case 'won':
      return { label: 'Gagné', color: 'border-green-500/50 text-green-400 bg-green-500/10', icon: CheckCircle };
    case 'lost':
      return { label: 'Perdu', color: 'border-red-500/50 text-red-400 bg-red-500/10', icon: XCircle };
    case 'void':
      return { label: 'Annulé', color: 'border-gray-500/50 text-gray-400 bg-gray-500/10', icon: XCircle };
    default:
      return { label: 'En cours', color: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10', icon: Clock };
  }
}

function shareTicket(ticket: DailyTicket) {
  const picks = ticket.matches
    .map(m => `${m.homeTeam} vs ${m.awayTeam} → ${m.selection.value} @ ${m.selection.odds}`)
    .join('\n');
  const text = `🤖 Ticket IA du Jour — AlgoPronos AI\n📅 ${formatDate(ticket.date)}\n\n${picks}\n\n💰 Cote totale: ${ticket.total_odds}\n🎯 Confiance IA: ${ticket.confidence_pct}%\n\n⚡ Généré par AlgoPronos AI`;
  if (navigator.share) {
    navigator.share({ title: 'Ticket IA du Jour', text });
  } else {
    navigator.clipboard.writeText(text);
    alert('Ticket copié dans le presse-papier !');
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [tickets, setTickets] = useState<DailyTicket[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayTicket, setTodayTicket] = useState<DailyTicket | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch today's ticket
        const todayRes = await fetch('/api/ticket-du-jour');
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          setTodayTicket(todayData.ticket);
        }

        // Fetch past tickets history
        const histRes = await fetch('/api/history');
        if (histRes.ok) {
          const histData = await histRes.json();
          setTickets(histData.tickets || []);
          setStats(histData.stats || null);
        }
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const winRate = stats?.win_rate_pct ?? null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" />
          Historique IA
        </h1>
        <p className="text-text-secondary mt-1">
          Performances des Tickets IA du Jour — pronostics générés automatiquement chaque jour
        </p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-text-muted text-xs">Taux réussite</p>
                <p className="text-2xl font-bold text-white">
                  {winRate !== null ? `${winRate}%` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-text-muted text-xs">Tickets générés</p>
                <p className="text-2xl font-bold text-white">{stats?.total_tickets ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-text-muted text-xs">Gagnés</p>
                <p className="text-2xl font-bold text-green-400">{stats?.total_won ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-text-muted text-xs">Perdus</p>
                <p className="text-2xl font-bold text-red-400">{stats?.total_lost ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket du Jour */}
      {todayTicket && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Ticket IA du Jour — {formatDate(todayTicket.date)}
          </h2>
          <TicketCard ticket={todayTicket} highlight />
        </div>
      )}

      {/* Historique des tickets passés */}
      {tickets.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Tickets précédents</h2>
          <div className="space-y-4">
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-white font-bold mb-2">Historique en cours de construction</h3>
            <p className="text-text-secondary text-sm">
              L&apos;historique IA se construit automatiquement chaque jour. Revenez demain !
            </p>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        <Button variant="gradient" asChild>
          <Link href="/dashboard/generate">
            <Zap className="mr-2 h-4 w-4" />
            Générer mon combiné
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Retour au dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── TicketCard component ─────────────────────────────────────────────────────

function TicketCard({ ticket, highlight = false }: { ticket: DailyTicket; highlight?: boolean }) {
  const sc = statusConfig(ticket.status);
  const StatusIcon = sc.icon;

  return (
    <Card className={highlight ? 'border-accent/40 bg-gradient-to-br from-accent/5 to-primary/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-white">
              {formatDate(ticket.date)}
            </CardTitle>
            <CardDescription>
              {ticket.matches.length} sélections · Cote: {ticket.total_odds.toFixed(2)} · Confiance: {ticket.confidence_pct}%
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={sc.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {sc.label}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => shareTicket(ticket)} title="Partager">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {ticket.matches.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-light/50 text-sm"
          >
            <div>
              <p className="font-medium text-white">{m.homeTeam} vs {m.awayTeam}</p>
              <p className="text-xs text-text-muted">{m.league}</p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-xs text-text-muted">{m.selection.type}</p>
                <p className="font-bold text-white">{m.selection.value}</p>
              </div>
              <div className="px-2 py-1 rounded bg-primary/10 border border-primary/20 min-w-[50px] text-center">
                <p className="text-xs text-text-muted">Cote</p>
                <p className="font-bold text-primary text-sm">{m.selection.odds.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}

        {ticket.analysis?.summary && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-text-secondary italic">&ldquo;{ticket.analysis.summary}&rdquo;</p>
            {ticket.analysis.tip && (
              <p className="text-xs text-accent mt-1 font-medium">💡 {ticket.analysis.tip}</p>
            )}
          </div>
        )}

        {/* Bookmakers */}
        <div className="pt-2 flex flex-wrap gap-2">
          <span className="text-xs text-text-muted self-center">Parier sur :</span>
          {[
            { name: '1xBet', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30', url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://1xbet.com' },
            { name: 'Betway', color: 'bg-green-600/20 text-green-400 border-green-600/30', url: 'https://betway.com' },
            { name: 'Melbet', color: 'bg-orange-600/20 text-orange-400 border-orange-600/30', url: 'https://melbet.com' },
          ].map(bm => (
            <a
              key={bm.name}
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border font-medium transition-opacity hover:opacity-80 ${bm.color}`}
            >
              {bm.name}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
