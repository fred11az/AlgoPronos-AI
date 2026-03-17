import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import MatchsClient from './MatchsClient';
import dynamic from 'next/dynamic';

const OnexBetMatchesWidget = dynamic(
  () => import('@/components/shared/OnexBetMatchesWidget'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Matchs de Football — Pronostics J+4 | AlgoPronos',
  description:
    'Tous les matchs de football des 4 prochains jours avec pronostics IA. Premier League, Ligue 1, Champions League, La Liga et plus. Filtrez par date.',
  keywords: [
    'matchs football aujourd\'hui',
    'matchs football demain',
    'programme football',
    'pronostics matchs',
    'calendrier football',
  ].join(', '),
  alternates: { canonical: 'https://algopronos.com/matchs' },
};

export interface MatchRow {
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
  league_slug: string;
  country: string;
  match_date: string;
  match_time: string;
  prediction: string;
  prediction_type: string;
  probability: number;
  recommended_odds: number;
  value_edge: number;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
}

export default async function MatchsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Compute +3 days limit
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + 3);
  const limitStr = limitDate.toISOString().split('T')[0];

  const { data: matches } = await supabase
    .from('match_predictions')
    .select(
      'slug, home_team, away_team, league, league_slug, country, match_date, match_time, prediction, prediction_type, probability, recommended_odds, value_edge, odds_home, odds_draw, odds_away'
    )
    .gte('match_date', today)
    .lte('match_date', limitStr)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })
    .limit(200);

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Matchs</span>
        </nav>
      </div>

      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="bg-surface rounded-2xl border border-surface-light p-6 md:p-8">
          <div className="flex items-start gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Programme Matchs
                </h1>
              </div>
              <p className="text-text-secondary">
                {matches?.length || 0} matchs analysés par IA sur les 4 prochains jours
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-text-muted bg-surface-light rounded-lg px-3 py-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Données actualisées chaque matin à 06h00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Client component handles date filter tabs + match list */}
      <MatchsClient matches={matches as MatchRow[] || []} today={today} />

      {/* 1xBet Live Matches Widget */}
      <section id="1xbet-live" className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Matchs en Direct sur 1xBet</h2>
          <p className="text-sm text-text-muted mt-1">
            Retrouvez tous les matchs disponibles en ce moment sur 1xBet — 356+ matchs, 19 sports
          </p>
        </div>
        <OnexBetMatchesWidget />
        <p className="text-xs text-text-muted mt-3 text-center">
          * Les cotes sont fournies à titre indicatif. Jouez de manière responsable. +18 uniquement.
        </p>
      </section>
    </main>
  );
}

export const revalidate = 3600;
