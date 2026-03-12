import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { slugToTitle } from '@/lib/utils/slugify';
import { BarChart2, TrendingUp, ChevronRight, ArrowRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBottomCTA } from '@/components/pronostics/PageBottomCTA';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PredictionSummary {
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
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

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ league: string }>;
}): Promise<Metadata> {
  const { league: slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('match_predictions')
    .select('league, country')
    .eq('league_slug', slug)
    .limit(1)
    .single();

  const leagueName = data?.league || slugToTitle(slug);
  const country = data?.country || '';

  const ll = leagueName.toLowerCase();
  const cl = country.toLowerCase();
  const year = new Date().getFullYear();

  return {
    title: `Pronostics ${leagueName} ${year} — Analyse IA | AlgoPronos`,
    description: `Pronostics ${leagueName}${country ? ` (${country})` : ''} ${year} générés par intelligence artificielle. Analyse xG, value bets, forme des équipes et probabilités pour chaque match à venir.`,
    keywords: [
      `pronostic ${ll}`,
      `pronostics ${ll} ${year}`,
      `paris sportifs ${ll}`,
      `analyse ${ll} IA`,
      `meilleur pronostic ${ll}`,
      `value bet ${ll}`,
      `1xbet ${ll}`,
      cl ? `pronostics football ${cl}` : '',
      cl ? `paris sportifs ${cl}` : '',
      cl ? `1xbet ${cl}` : '',
      'pronostics football IA',
      'paris sportifs intelligence artificielle',
      'algopronos pronostics',
      'value betting algorithmique',
      'pronostics football afrique',
    ].filter(Boolean).join(', '),
    alternates: { canonical: `https://algopronos.com/ligue/${slug}` },
    openGraph: {
      title: `Pronostics ${leagueName} ${year} — IA AlgoPronos`,
      description: `Pronostics IA pour ${leagueName} : xG, value bets, probabilités sur chaque match. Analyse algorithmique gratuite.`,
      url: `https://algopronos.com/ligue/${slug}`,
      siteName: 'AlgoPronos AI',
      type: 'website',
    },
  };
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ league: string }>;
}) {
  const { league: slug } = await params;
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch upcoming predictions for this league
  const { data: predictions, error } = await supabase
    .from('match_predictions')
    .select(
      'slug, home_team, away_team, league, match_date, match_time, prediction, prediction_type, probability, recommended_odds, value_edge, odds_home, odds_draw, odds_away'
    )
    .eq('league_slug', slug)
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(30);

  if (error || !predictions || predictions.length === 0) {
    notFound();
  }

  const leagueName = predictions[0].league || slugToTitle(slug);

  // Get also recently resolved to show win rate
  const { data: resolved } = await supabase
    .from('match_predictions')
    .select('is_correct')
    .eq('league_slug', slug)
    .eq('is_resolved', true)
    .limit(50);

  const winCount = resolved?.filter((r) => r.is_correct).length || 0;
  const totalResolved = resolved?.length || 0;
  const winRate = totalResolved > 0 ? Math.round((winCount / totalResolved) * 100) : null;

  // Group predictions by date
  const byDate = predictions.reduce<Record<string, PredictionSummary[]>>((acc, p) => {
    if (!acc[p.match_date]) acc[p.match_date] = [];
    acc[p.match_date].push(p as PredictionSummary);
    return acc;
  }, {});

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
      { '@type': 'ListItem', position: 2, name: 'Pronostics', item: 'https://algopronos.com/pronostics' },
      { '@type': 'ListItem', position: 3, name: leagueName, item: `https://algopronos.com/ligue/${slug}` },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pronostics ${leagueName} — AlgoPronos AI`,
    description: `Liste des pronostics IA pour ${leagueName}. Analyse algorithmique de chaque match avec probabilités et value edge.`,
    url: `https://algopronos.com/ligue/${slug}`,
    numberOfItems: predictions.length,
    itemListElement: predictions.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://algopronos.com/pronostic/${p.slug}`,
      name: `${p.home_team} vs ${p.away_team} — Pronostic ${p.prediction}`,
    })),
  };

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-secondary">Ligues</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">{leagueName}</span>
        </nav>
      </div>

      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="bg-surface rounded-2xl border border-surface-light p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart2 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold text-white">{leagueName}</h1>
              </div>
              <p className="text-text-secondary">
                {predictions.length} pronostic{predictions.length > 1 ? 's' : ''} à venir · Analyse IA
              </p>
            </div>
            {winRate !== null && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3 text-center">
                <div className="text-2xl font-bold text-green-400">{winRate}%</div>
                <div className="text-xs text-text-muted">Taux de réussite</div>
                <div className="text-xs text-text-muted">({totalResolved} matchs)</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Predictions by Date */}
      <section className="max-w-5xl mx-auto px-4 pb-16 space-y-8">
        {Object.entries(byDate).map(([date, preds]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-surface-light" />
              <span className="text-sm font-medium text-text-secondary capitalize">
                {formatDate(date)}
              </span>
              <div className="h-px flex-1 bg-surface-light" />
            </div>

            <div className="space-y-3">
              {preds.map((p) => (
                <Link
                  key={p.slug}
                  href={`/pronostic/${p.slug}`}
                  className="block bg-surface hover:bg-surface-light rounded-2xl border border-surface-light hover:border-primary/30 p-5 transition-all group"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Teams */}
                    <div className="flex-1 min-w-0">
                      <div className="text-base md:text-lg font-semibold text-white group-hover:text-primary transition-colors">
                        {p.home_team} vs {p.away_team}
                      </div>
                      <div className="text-sm text-text-muted mt-0.5">{p.match_time}</div>
                    </div>

                    {/* Prediction */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs text-text-muted">Pronostic</div>
                        <div className="text-sm font-semibold text-primary">{p.prediction}</div>
                      </div>
                      <div className="bg-surface-light rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs text-text-muted">Cote</div>
                        <div className="text-sm font-bold text-white">{p.recommended_odds?.toFixed(2)}</div>
                      </div>
                      <div className="bg-surface-light rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs text-text-muted">Prob.</div>
                        <div className="text-sm font-bold text-white">{p.probability}%</div>
                      </div>
                      {p.value_edge > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5 text-center">
                          <div className="text-xs text-text-muted">Value</div>
                          <div className="text-sm font-bold text-green-400">+{p.value_edge}%</div>
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <PageBottomCTA />
    </main>
  );
}

export const revalidate = 3600;
