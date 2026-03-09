import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { slugToTitle } from '@/lib/utils/slugify';
import { Users, ChevronRight, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PredictionSummary {
  slug: string;
  home_team: string;
  away_team: string;
  home_team_slug: string;
  away_team_slug: string;
  league: string;
  league_slug: string;
  match_date: string;
  match_time: string;
  prediction: string;
  probability: number;
  recommended_odds: number;
  value_edge: number;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>;
}): Promise<Metadata> {
  const { team: slug } = await params;
  const supabase = await createClient();

  // Try to get the real team name from DB
  const { data } = await supabase
    .from('match_predictions')
    .select('home_team, away_team, home_team_slug, away_team_slug')
    .or(`home_team_slug.eq.${slug},away_team_slug.eq.${slug}`)
    .limit(1)
    .single();

  const teamName = data
    ? data.home_team_slug === slug
      ? data.home_team
      : data.away_team
    : slugToTitle(slug);

  return {
    title: `Pronostics ${teamName} — Matchs à venir | AlgoPronos`,
    description: `Tous les pronostics IA pour ${teamName}. Analyse algorithme des prochains matchs de ${teamName} avec probabilités, cotes et value edge.`,
    keywords: [
      `pronostic ${teamName.toLowerCase()}`,
      `${teamName.toLowerCase()} pronostic`,
      `pronostic football ${teamName.toLowerCase()}`,
      'paris sportifs ia',
    ].join(', '),
  };
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function TeamPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch upcoming matches involving this team
  const { data: predictions, error } = await supabase
    .from('match_predictions')
    .select(
      'slug, home_team, away_team, home_team_slug, away_team_slug, league, league_slug, match_date, match_time, prediction, probability, recommended_odds, value_edge'
    )
    .or(`home_team_slug.eq.${slug},away_team_slug.eq.${slug}`)
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(20);

  if (error || !predictions || predictions.length === 0) {
    notFound();
  }

  const firstMatch = predictions[0] as PredictionSummary;
  const teamName =
    firstMatch.home_team_slug === slug ? firstMatch.home_team : firstMatch.away_team;

  // Past results for win rate
  const { data: resolved } = await supabase
    .from('match_predictions')
    .select('is_correct, home_team, away_team, home_team_slug, away_team_slug, prediction, match_date')
    .or(`home_team_slug.eq.${slug},away_team_slug.eq.${slug}`)
    .eq('is_resolved', true)
    .order('match_date', { ascending: false })
    .limit(10);

  const winCount = resolved?.filter((r) => r.is_correct).length || 0;
  const totalResolved = resolved?.length || 0;

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-secondary">Équipes</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">{teamName}</span>
        </nav>
      </div>

      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="bg-surface rounded-2xl border border-surface-light p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold text-white">{teamName}</h1>
              </div>
              <p className="text-text-secondary">
                {predictions.length} pronostic{predictions.length > 1 ? 's' : ''} à venir
              </p>
            </div>
            {totalResolved > 0 && (
              <div className="bg-surface-light rounded-xl px-5 py-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((winCount / totalResolved) * 100)}%
                </div>
                <div className="text-xs text-text-muted">Taux de réussite</div>
                <div className="text-xs text-text-muted">sur {totalResolved} matchs</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Matches */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-white">Prochains matchs</h2>
        </div>
        <div className="space-y-3">
          {predictions.map((p) => {
            const pred = p as PredictionSummary;
            const isHome = pred.home_team_slug === slug;
            const opponent = isHome ? pred.away_team : pred.home_team;
            const venue = isHome ? 'Domicile' : 'Extérieur';
            return (
              <Link
                key={pred.slug}
                href={`/pronostic/${pred.slug}`}
                className="block bg-surface hover:bg-surface-light rounded-2xl border border-surface-light hover:border-primary/30 p-5 transition-all group"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-white group-hover:text-primary transition-colors">
                      {isHome ? `${teamName}` : `${opponent}`}
                      <span className="text-text-muted font-normal"> vs </span>
                      {isHome ? `${opponent}` : `${teamName}`}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Link
                        href={`/ligue/${pred.league_slug}`}
                        className="text-xs text-text-muted hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pred.league}
                      </Link>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted capitalize">{formatDate(pred.match_date)} · {pred.match_time}</span>
                      <span className="text-xs text-text-muted">·</span>
                      <span className={`text-xs ${isHome ? 'text-blue-400' : 'text-orange-400'}`}>{venue}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
                      <div className="text-xs text-text-muted">Pronostic</div>
                      <div className="text-sm font-semibold text-primary">{pred.prediction}</div>
                    </div>
                    <div className="bg-surface-light rounded-lg px-3 py-1.5 text-center">
                      <div className="text-xs text-text-muted">Prob.</div>
                      <div className="text-sm font-bold text-white">{pred.probability}%</div>
                    </div>
                    {pred.value_edge > 0 && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
                        <div className="text-xs text-text-muted">Value</div>
                        <div className="text-sm font-bold text-green-400">+{pred.value_edge}%</div>
                      </div>
                    )}
                    <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-primary flex-shrink-0 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-[#00D4FF]/10 border-t border-primary/20">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Générez votre ticket combiné IA
          </h2>
          <p className="text-text-secondary mb-6 text-sm">
            Sélectionnez vos matchs préférés et laissez l'algorithme optimiser votre combiné.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/dashboard/generate">
              <Button variant="gradient" size="lg">
                Générer mon ticket
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600;
