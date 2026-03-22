'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ShareTicketButton from '@/components/shared/ShareTicketButton';
import {
  Calendar,
  Zap,
  ExternalLink,
  TrendingUp,
  Target,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchPick {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime?: string;
  selection: { type: string; value: string; odds: number; impliedPct: number; modelPct?: number | null; valueEdge?: number | null };
}

interface DailyTicket {
  id: string;
  date: string;
  matches: MatchPick[];
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  analysis?: {
    summary?: string;
    tip?: string;
    confidence?: string;
  };
}

// ─── Bookmakers ───────────────────────────────────────────────────────────────

const BOOKMAKERS = [
  { name: 'Partenaire', url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599', color: 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30' },
  { name: 'Betway', url: 'https://betway.com', color: 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30' },
  { name: 'Melbet', url: 'https://melbet.com', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TicketDuJourWidget() {
  const [ticket, setTicket] = useState<DailyTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/ticket-du-jour')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setTicket(data.ticket))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (loading) {
    return (
      <Card className="border-accent/20">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  if (error || !ticket) {
    return (
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardContent className="p-6 text-center">
          <Zap className="h-10 w-10 text-accent mx-auto mb-3" />
          <h3 className="font-bold text-white mb-1">Ticket IA du Jour</h3>
          <p className="text-text-secondary text-sm mb-4">
            Le ticket du jour n&apos;est pas encore disponible. Pas assez de matchs programmés ou API indisponible.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/generate">Générer mon propre combiné</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = ticket.confidence_pct >= 55
    ? 'text-green-400'
    : ticket.confidence_pct >= 35
    ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              🤖 Ticket IA du Jour
            </CardTitle>
            <CardDescription className="capitalize">{today}</CardDescription>
          </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Target className="h-3.5 w-3.5 text-secondary" />
                <span className={`font-bold ${confidenceColor}`}>{ticket.confidence_pct}%</span>
              </div>
              <p className="text-xs text-text-muted">Fiabilité IA</p>
            </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Picks */}
        {ticket.matches.map((m, i) => {
          const modelPct = m.selection.modelPct;
          const valueEdge = m.selection.valueEdge;
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-light/60 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{m.homeTeam} vs {m.awayTeam}</p>
                <p className="text-xs text-text-muted">{m.league}</p>
                {modelPct !== null && modelPct !== undefined && (
                  <p className="text-xs text-primary mt-0.5">
                    Modèle: {Math.round(modelPct)}%
                    {valueEdge !== null && valueEdge !== undefined && valueEdge > 0 && (
                      <span className="text-green-400 ml-1">(+{valueEdge}% edge)</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <div className="text-right">
                  <p className="text-xs text-text-muted">{m.selection.type}</p>
                  <p className="font-bold text-white">{m.selection.value}</p>
                </div>
                <div className="px-2 py-1 rounded bg-accent/10 border border-accent/20 min-w-[46px] text-center">
                  <p className="text-xs text-text-muted">Cote</p>
                  <p className="font-bold text-accent text-sm">{(m.selection.odds || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Summary */}
        {ticket.analysis?.summary && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-text-secondary italic">&ldquo;{ticket.analysis.summary}&rdquo;</p>
            {ticket.analysis.tip && (
              <p className="text-xs text-accent font-medium mt-1">💡 {ticket.analysis.tip}</p>
            )}
          </div>
        )}

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Fiabilité du modèle</span>
            <span className={confidenceColor}>
              {ticket.confidence_pct >= 60 ? 'Élevée' : ticket.confidence_pct >= 45 ? 'Moyenne' : 'Modérée'}
            </span>
          </div>
          <div className="w-full bg-surface-light rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${ticket.confidence_pct >= 55 ? 'bg-green-400' : ticket.confidence_pct >= 35 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${Math.min(ticket.confidence_pct * 1.5, 100)}%` }}
            />
          </div>
        </div>

        {/* Bookmakers */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-text-muted">Parier sur :</span>
          {BOOKMAKERS.map(bm => (
            <Link
              key={bm.name}
              href={`/redirect?url=${encodeURIComponent(bm.url)}&bookmaker=${encodeURIComponent(bm.name)}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border font-medium transition-all ${bm.color}`}
            >
              {bm.name}
              <ExternalLink className="h-3 w-3" />
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <ShareTicketButton
            ticketId={ticket.id}
            totalOdds={ticket.total_odds}
            confidencePct={ticket.confidence_pct}
            matchCount={ticket.matches.length}
            type="daily"
            buttonVariant="outline"
            label="Partager"
            className="flex-1"
          />
          <Button variant="ghost" size="sm" asChild className="flex-1">
            <Link href="/classement">
              Classement IA
            </Link>
          </Button>
        </div>

        <p className="text-xs text-text-muted text-center">
          Ticket généré automatiquement par l&apos;IA · Valable aujourd&apos;hui
        </p>
      </CardContent>
    </Card>
  );
}
