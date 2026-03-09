import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import PublicTicketClient from './PublicTicketClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchPick {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime?: string;
  selection: { type: string; value: string; odds: number; impliedPct?: number };
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

// ─── Fetch data ───────────────────────────────────────────────────────────────

async function getTicket(id: string): Promise<PublicTicket | null> {
  const adminSupabase = createAdminClient();

  const { data: daily } = await adminSupabase
    .from('daily_ticket')
    .select('id, date, matches, total_odds, confidence_pct, risk_level, status, analysis, created_at')
    .eq('id', id)
    .single();

  if (daily) {
    return {
      id: daily.id,
      type: 'daily',
      date: daily.date,
      matches: (daily.matches || []) as MatchPick[],
      total_odds: Number(daily.total_odds),
      confidence_pct: daily.confidence_pct,
      risk_level: daily.risk_level,
      status: daily.status,
      analysis: daily.analysis as PublicTicket['analysis'],
      created_at: daily.created_at,
    };
  }

  const { data: combine } = await adminSupabase
    .from('generated_combines')
    .select('id, matches, total_odds, estimated_probability, parameters, created_at, status')
    .eq('id', id)
    .single();

  if (combine) {
    return {
      id: combine.id,
      type: 'combine',
      date: (combine.created_at as string)?.split('T')[0] ?? '',
      matches: (combine.matches || []) as MatchPick[],
      total_odds: Number(combine.total_odds),
      confidence_pct: combine.estimated_probability as number,
      risk_level: (combine.parameters as { riskLevel?: string } | null)?.riskLevel || 'balanced',
      status: (combine.status as string) || 'pending',
      created_at: combine.created_at as string,
    };
  }

  return null;
}

// ─── Metadata (OG) ───────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const ticket = await getTicket(id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai';
  const imageUrl = `${appUrl}/api/ticket-image/${id}`;

  if (!ticket) {
    return { title: 'Ticket introuvable — AlgoPronos AI' };
  }

  const dateLabel = new Date(ticket.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long',
  });
  const label = ticket.type === 'daily' ? 'Ticket IA du Jour' : 'Combiné IA';
  const title = `${label} — Cote ${ticket.total_odds.toFixed(2)} | AlgoPronos AI`;
  const description = `${ticket.matches.length} sélections · Cote totale ${ticket.total_odds.toFixed(2)} · Confiance IA ${ticket.confidence_pct}% · ${dateLabel}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: label }],
      siteName: 'AlgoPronos AI',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicTicketPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai';
  const ticketUrl = `${appUrl}/ticket/${id}`;
  const imageUrl = `${appUrl}/api/ticket-image/${id}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
            <span className="text-surface-light text-xs">|</span>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="font-bold text-white text-sm hidden sm:block">AlgoPronos AI</span>
            </Link>
          </div>
          <Link
            href="/dashboard/generate"
            className="text-xs text-primary font-semibold border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
          >
            Générer mon ticket
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <PublicTicketClient ticket={ticket} ticketUrl={ticketUrl} imageUrl={imageUrl} />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-text-muted text-xs">
        <p>Jouer responsable · 18+ · Pas de garantie de gains · <Link href="/" className="text-primary hover:underline">AlgoPronos AI</Link></p>
      </footer>
    </div>
  );
}
