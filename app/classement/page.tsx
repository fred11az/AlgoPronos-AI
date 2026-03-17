import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import ClassementClient from './ClassementClient';

export const metadata: Metadata = {
  title: 'Meilleurs Tickets IA du Jour | AlgoPronos AI',
  description: 'Découvrez les meilleurs tickets générés par l\'IA AlgoPronos aujourd\'hui — classés par confiance et cote.',
  alternates: { canonical: 'https://algopronos.com/classement' },
};

interface DailyTicket {
  id: string;
  date: string;
  matches: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    selection: { type: string; value: string; odds: number };
  }[];
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: string;
  analysis?: { summary?: string; tip?: string };
}

async function getTickets(): Promise<DailyTicket[]> {
  const adminSupabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Last 7 days of tickets, sorted by confidence then odds
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await adminSupabase
    .from('daily_ticket')
    .select('id, date, matches, total_odds, confidence_pct, risk_level, status, analysis')
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .lte('date', today)
    .order('confidence_pct', { ascending: false })
    .limit(20);

  return (data || []) as DailyTicket[];
}

export default async function ClassementPage() {
  const tickets = await getTickets();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
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
              <span className="font-bold text-white text-sm">AlgoPronos AI</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/generate"
              className="text-xs text-primary font-semibold border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
            >
              Générer mon ticket
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <ClassementClient tickets={tickets} />
      </main>

      <footer className="text-center py-8 text-text-muted text-xs">
        <Link href="/" className="text-primary hover:underline">AlgoPronos AI</Link> · Jouer responsable · 18+
      </footer>
    </div>
  );
}
