'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShareTicketButton from '@/components/shared/ShareTicketButton';
import {
  Trophy,
  TrendingUp,
  Target,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';

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
  analysis?: { summary?: string; tip?: string };
}

const BOOKMAKERS = [
  { name: '1xBet', url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  { name: 'Betway', url: 'https://betway.com', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
  { name: 'Melbet', url: 'https://melbet.com', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
];

function statusConfig(status: string) {
  switch (status) {
    case 'won': return { label: 'Gagné', color: 'text-green-400 border-green-500/30 bg-green-500/10', Icon: CheckCircle };
    case 'lost': return { label: 'Perdu', color: 'text-red-400 border-red-500/30 bg-red-500/10', Icon: XCircle };
    default: return { label: 'En cours', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', Icon: Clock };
  }
}

function confColor(pct: number) {
  if (pct >= 60) return 'text-green-400';
  if (pct >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function rankEmoji(i: number) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `#${i + 1}`;
}

export default function ClassementClient({ tickets }: { tickets: DailyTicket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-10 w-10 text-text-muted" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Aucun ticket disponible</h2>
        <p className="text-text-secondary mb-6 max-w-sm mx-auto">
          Le classement sera disponible dès que des tickets IA auront été générés.
        </p>
        <Button variant="gradient" asChild>
          <Link href="/dashboard/generate">
            <Zap className="mr-2 h-4 w-4" />
            Générer mon ticket
          </Link>
        </Button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayTickets = tickets.filter(t => t.date === today);
  const pastTickets = tickets.filter(t => t.date !== today);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-7 w-7 text-accent" />
          Meilleurs Tickets IA
        </h1>
        <p className="text-text-secondary mt-1">
          Classement des tickets générés automatiquement par l&apos;IA — 7 derniers jours
        </p>
      </div>

      {/* Today */}
      {todayTickets.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Aujourd&apos;hui</h2>
          </div>
          <div className="space-y-4">
            {todayTickets.map((ticket, i) => (
              <TicketRow key={ticket.id} ticket={ticket} rank={i} hot />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {pastTickets.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3">7 derniers jours</h2>
          <div className="space-y-4">
            {pastTickets.map((ticket, i) => (
              <TicketRow key={ticket.id} ticket={ticket} rank={todayTickets.length + i} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="flex gap-3 pt-4">
        <Button variant="gradient" asChild>
          <Link href="/dashboard/generate">
            <Zap className="mr-2 h-4 w-4" />
            Générer mon combiné
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/history">Historique IA</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── TicketRow ────────────────────────────────────────────────────────────────

function TicketRow({ ticket, rank, hot = false }: { ticket: DailyTicket; rank: number; hot?: boolean }) {
  const sc = statusConfig(ticket.status);
  const StatusIcon = sc.Icon;

  return (
    <Card className={hot && rank === 0 ? 'border-accent/40 bg-gradient-to-br from-accent/5 to-primary/5' : ''}>
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-xl font-black ${rank < 3 ? 'text-2xl' : 'text-text-muted text-sm font-bold'}`}>
              {rankEmoji(rank)}
            </div>
            <div>
              <p className="font-bold text-white capitalize text-sm">{formatDate(ticket.date)}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-white font-bold text-sm">{ticket.total_odds.toFixed(2)}</span>
                  <span className="text-text-muted text-xs">cote</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-secondary" />
                  <span className={`font-bold text-sm ${confColor(ticket.confidence_pct)}`}>{ticket.confidence_pct}%</span>
                  <span className="text-text-muted text-xs">confiance</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={sc.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {sc.label}
            </Badge>
          </div>
        </div>

        {/* Picks (compact) */}
        <div className="space-y-1.5 mb-4">
          {ticket.matches.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary truncate flex-1">
                {m.homeTeam} vs {m.awayTeam}
              </span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-text-muted text-xs">{m.selection.value}</span>
                <span className="text-primary font-bold text-xs">{m.selection.odds.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI tip */}
        {ticket.analysis?.tip && (
          <p className="text-xs text-accent mb-3">💡 {ticket.analysis.tip}</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/ticket/${ticket.id}`}>
              Voir le ticket
            </Link>
          </Button>
          <ShareTicketButton
            ticketId={ticket.id}
            totalOdds={ticket.total_odds}
            confidencePct={ticket.confidence_pct}
            matchCount={ticket.matches.length}
            type="daily"
            buttonVariant="ghost"
            label="Partager"
            className="h-9"
          />
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-text-muted">Parier :</span>
            {BOOKMAKERS.map(bm => (
              <a
                key={bm.name}
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border font-medium transition-all ${bm.color}`}
              >
                {bm.name}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
