'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Target,
  Share2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  Copy,
  Zap,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchPick {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime?: string;
  selection: { type: string; value: string; odds: number };
  result?: 'won' | 'lost' | 'void';
  score?: { home: number; away: number } | null;
}

interface PublicTicket {
  id: string;
  type: 'daily' | 'combine';
  date: string;
  matches: MatchPick[];
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: string;
  analysis?: { summary?: string; tip?: string };
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOOKMAKERS = [
  { name: '1xBet', url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  { name: 'Betway', url: 'https://betway.com', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
  { name: 'Melbet', url: 'https://melbet.com', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { name: 'Premier Bet', url: 'https://premierbet.com', color: 'bg-purple-600/20 text-purple-400 border-purple-600/30' },
];

function statusConfig(status: string) {
  switch (status) {
    case 'won': return { label: 'Gagné ✓', color: 'text-green-400 border-green-500/30 bg-green-500/10', Icon: CheckCircle };
    case 'lost': return { label: 'Perdu', color: 'text-red-400 border-red-500/30 bg-red-500/10', Icon: XCircle };
    default: return { label: 'En cours', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', Icon: Clock };
  }
}

function confidenceMeta(pct: number) {
  if (pct >= 60) return { label: 'Élevée', color: 'text-green-400', barColor: 'bg-green-400' };
  if (pct >= 40) return { label: 'Moyenne', color: 'text-yellow-400', barColor: 'bg-yellow-400' };
  return { label: 'Faible', color: 'text-red-400', barColor: 'bg-red-400' };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Share helpers ────────────────────────────────────────────────────────────

function buildShareText(ticket: PublicTicket, url: string) {
  const picks = ticket.matches
    .map(m => `${m.homeTeam} vs ${m.awayTeam} → ${m.selection.value}`)
    .join('\n');
  return `🤖 ${ticket.type === 'daily' ? 'Ticket IA du Jour' : 'Combiné IA'} — AlgoPronos AI\n\n${picks}\n\n🎯 Confiance: ${ticket.confidence_pct}%\n\n👉 ${url}`;
}

function encodedText(text: string) {
  return encodeURIComponent(text);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicTicketClient({
  ticket,
  ticketUrl,
}: {
  ticket: PublicTicket;
  ticketUrl: string;
  imageUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareText = buildShareText(ticket, ticketUrl);
  const sc = statusConfig(ticket.status);
  const conf = confidenceMeta(ticket.confidence_pct);
  const StatusIcon = sc.Icon;

  function copyLink() {
    navigator.clipboard.writeText(ticketUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20',
      href: `https://wa.me/?text=${encodedText(shareText)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#229ED9]/10 text-[#229ED9] border-[#229ED9]/30 hover:bg-[#229ED9]/20',
      href: `https://t.me/share/url?url=${encodedText(ticketUrl)}&text=${encodedText(shareText)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/20',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedText(ticketUrl)}`,
    },
    {
      name: 'X / Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/20',
      href: `https://twitter.com/intent/tweet?text=${encodedText(shareText)}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header badge */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm capitalize">{formatDate(ticket.date)}</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            {ticket.type === 'daily' ? '🤖 Ticket IA du Jour' : '🎯 Combiné IA'}
          </h1>
        </div>
        <Badge variant="outline" className={sc.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {sc.label}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-border text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="h-4 w-4 text-secondary" />
            <span className={`text-2xl font-bold ${conf.color}`}>{ticket.confidence_pct}%</span>
          </div>
          <p className="text-xs text-text-muted">Confiance IA</p>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border text-center">
          <span className="text-2xl font-bold text-white">{ticket.matches.length}</span>
          <p className="text-xs text-text-muted mt-1">Sélections</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span>Confiance IA</span>
          <span className={conf.color}>{conf.label}</span>
        </div>
        <div className="w-full bg-surface-light rounded-full h-2">
          <div
            className={`h-2 rounded-full ${conf.barColor} transition-all`}
            style={{ width: `${Math.min(ticket.confidence_pct * 1.5, 100)}%` }}
          />
        </div>
      </div>

      {/* Picks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sélections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ticket.matches.map((m, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl text-sm ${
              m.result === 'won'  ? 'bg-green-500/10 border border-green-500/20' :
              m.result === 'lost' ? 'bg-red-500/10 border border-red-500/20' :
              'bg-surface-light/60'
            }`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{m.homeTeam} vs {m.awayTeam}</p>
                <p className="text-xs text-text-muted">{m.league}</p>
                {m.score && (
                  <p className={`text-xs font-bold mt-0.5 ${
                    m.result === 'won' ? 'text-green-400' :
                    m.result === 'lost' ? 'text-red-400' :
                    'text-text-muted'
                  }`}>
                    Score : {m.score.home} – {m.score.away}
                    {m.result === 'won' && ' ✓'}
                    {m.result === 'lost' && ' ✗'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="text-right">
                  <p className="text-xs text-text-muted">{m.selection.type}</p>
                  <p className="font-bold text-white text-sm">{m.selection.value}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {ticket.analysis?.summary && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-text-secondary italic">&ldquo;{ticket.analysis.summary}&rdquo;</p>
          {ticket.analysis.tip && (
            <p className="text-sm text-accent font-medium mt-2">💡 {ticket.analysis.tip}</p>
          )}
        </div>
      )}

      {/* Bookmakers */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-5">
          <h3 className="font-bold text-white mb-1">Parier sur ce ticket</h3>
          <p className="text-sm text-text-secondary mb-4">Choisissez votre bookmaker partenaire :</p>
          <div className="grid grid-cols-2 gap-3">
            {BOOKMAKERS.map(bm => (
              <Link
                key={bm.name}
                href={`/redirect?url=${encodeURIComponent(bm.url)}&bookmaker=${encodeURIComponent(bm.name)}`}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${bm.color}`}
              >
                {bm.name}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-white">Partager ce ticket</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {socialLinks.map(s => {
              const Icon = s.icon;
              return (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${s.color}`}
                >
                  <Icon className="h-4 w-4" />
                  {s.name}
                </a>
              );
            })}
          </div>
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-white hover:border-primary/40 transition-all"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </button>
        </CardContent>
      </Card>

      {/* Replay / CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="gradient" className="flex-1" asChild>
          <Link href="/dashboard/generate">
            <RefreshCw className="mr-2 h-4 w-4" />
            Rejouer ce ticket
          </Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/dashboard">
            <Zap className="mr-2 h-4 w-4" />
            Générer mon propre combiné
          </Link>
        </Button>
      </div>

      <p className="text-center text-xs text-text-muted">
        Ticket généré par AlgoPronos AI · Jouer responsable · 18+ · Résultats non garantis
      </p>
    </div>
  );
}
