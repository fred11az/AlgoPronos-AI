import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BarChart2, TrendingUp, ArrowRight, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Pronostics Football IA — Tous les matchs | AlgoPronos',
  description:
    'Pronostics football générés par IA pour toutes les ligues. Premier League, Ligue 1, La Liga, Champions League et plus. Analyse algorithmique avec probabilités et value edge.',
  keywords: [
    'pronostics football',
    'pronostic ia',
    'pronostic premier league',
    'pronostic ligue 1',
    'pronostic champions league',
    'paris sportifs ia',
    'analyse football algorithmique',
  ].join(', '),
};

interface LeagueSummary {
  league: string;
  league_slug: string;
  country: string;
  count: number;
}

interface PredictionRow {
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
  league_slug: string;
  country: string;
  match_date: string;
  prediction: string;
  probability: number;
  recommended_odds: number;
  value_edge: number;
}

export default async function PronosticsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's predictions + next 3 days
  const { data: upcoming } = await supabase
    .from('match_predictions')
    .select(
      'slug, home_team, away_team, league, league_slug, country, match_date, prediction, probability, recommended_odds, value_edge'
    )
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .order('value_edge', { ascending: false })
    .limit(60);

  // Group by league
  const byLeague = (upcoming || []).reduce<Record<string, LeagueSummary & { matches: PredictionRow[] }>>((acc, p) => {
    const row = p as PredictionRow;
    if (!acc[row.league_slug]) {
      acc[row.league_slug] = {
        league: row.league,
        league_slug: row.league_slug,
        country: row.country,
        count: 0,
        matches: [],
      };
    }
    acc[row.league_slug].count++;
    acc[row.league_slug].matches.push(row);
    return acc;
  }, {});

  const leagueGroups = Object.values(byLeague).sort((a, b) => b.count - a.count);

  // Best value picks across all leagues
  const bestPicks = (upcoming || [])
    .filter((p) => (p as PredictionRow).value_edge > 0)
    .sort((a, b) => (b as PredictionRow).value_edge - (a as PredictionRow).value_edge)
    .slice(0, 5) as PredictionRow[];

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const todayDate = new Date(today);
    if (d.toDateString() === todayDate.toDateString()) return "Aujourd'hui";
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Pronostics</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-4">
            <TrendingUp className="h-4 w-4" />
            Analyse algorithmique · Mise à jour quotidienne
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Pronostics Football IA
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Notre algorithme analyse des milliers de données pour identifier les meilleures opportunités de valeur sur tous les championnats.
          </p>
        </div>

        {/* Best value picks */}
        {bestPicks.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-surface-light" />
              <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Meilleures opportunités de valeur
              </span>
              <div className="h-px flex-1 bg-surface-light" />
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {bestPicks.map((p) => (
                <Link
                  key={p.slug}
                  href={`/pronostic/${p.slug}`}
                  className="bg-surface hover:bg-surface-light border border-green-500/20 hover:border-green-500/40 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors leading-tight">
                      {p.home_team} vs {p.away_team}
                    </div>
                    <span className="bg-green-500/15 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      +{p.value_edge}%
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mb-2">{p.league} · {formatDate(p.match_date)}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-medium">{p.prediction}</span>
                    <span className="text-xs text-text-muted">· Cote {p.recommended_odds?.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Leagues */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-white">Pronostics par compétition</h2>
        </div>

        {leagueGroups.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <p className="mb-4">Aucun pronostic disponible pour l'instant.</p>
            <p className="text-sm">Les pronostics sont générés chaque matin automatiquement.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {leagueGroups.map((group) => (
              <div key={group.league_slug}>
                <Link
                  href={`/ligue/${group.league_slug}`}
                  className="flex items-center justify-between mb-3 group"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                      {group.league}
                    </h3>
                    {group.country && (
                      <span className="text-xs text-text-muted">· {group.country}</span>
                    )}
                    <span className="bg-surface-light text-text-muted text-xs px-2 py-0.5 rounded-full">
                      {group.count} match{group.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted group-hover:text-primary transition-colors">
                    Voir tout
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>

                <div className="space-y-2">
                  {group.matches.slice(0, 5).map((p) => (
                    <Link
                      key={p.slug}
                      href={`/pronostic/${p.slug}`}
                      className="flex items-center justify-between bg-surface hover:bg-surface-light border border-surface-light hover:border-primary/20 rounded-xl px-4 py-3 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
                          {p.home_team} vs {p.away_team}
                        </div>
                        <div className="text-xs text-text-muted capitalize mt-0.5">{formatDate(p.match_date)}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span className="text-xs text-primary font-medium hidden sm:block">{p.prediction}</span>
                        <span className="bg-surface-light text-text-secondary text-xs px-2 py-0.5 rounded-lg font-mono">
                          {p.recommended_odds?.toFixed(2)}
                        </span>
                        {p.value_edge > 0 && (
                          <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-lg font-bold">
                            +{p.value_edge}%
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                  {group.matches.length > 5 && (
                    <Link
                      href={`/ligue/${group.league_slug}`}
                      className="block text-center text-xs text-text-muted hover:text-primary transition-colors py-2"
                    >
                      + {group.matches.length - 5} autres pronostics →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-[#00D4FF]/10 border-t border-primary/20">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Générez un combiné IA personnalisé
          </h2>
          <p className="text-text-secondary mb-6 text-sm">
            Notre algorithme sélectionne les meilleures combinaisons selon votre profil de risque.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/dashboard/generate">
              <Button variant="gradient" size="lg">
                Générer mon ticket
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/compte-optimise-ia">
              <Button variant="outline" size="lg">
                Compte Optimisé IA
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600;
