import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { slugToTitle } from '@/lib/utils/slugify';
import { BarChart2, TrendingUp, ChevronRight, ArrowRight, Target, Brain, CheckCircle2, XCircle, Zap, Star, Shield, Users } from 'lucide-react';
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
    title: `Pronostics ${leagueName} ${year} — Analyse IA, Cotes & Value Bets | AlgoPronos`,
    description: `Pronostics IA ${leagueName}${country ? ` (${country})` : ''} ${year} : tous les matchs analysés par algorithme. Value bets, probabilités, cotes 1xBet et taux de réussite. Gratuit.`,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, long = false): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', long
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
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

  // Upcoming predictions
  const { data: predictions } = await supabase
    .from('match_predictions')
    .select('slug, home_team, away_team, home_team_slug, away_team_slug, league, country, match_date, match_time, prediction, prediction_type, probability, recommended_odds, value_edge, odds_home, odds_draw, odds_away')
    .eq('league_slug', slug)
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(30);

  // Past resolved — richer stats
  const { data: resolved } = await supabase
    .from('match_predictions')
    .select('is_correct, home_team, away_team, prediction, match_date, recommended_odds, probability, value_edge')
    .eq('league_slug', slug)
    .eq('is_resolved', true)
    .order('match_date', { ascending: false })
    .limit(20);

  // Top teams in this league (recent)
  const { data: teamRows } = await supabase
    .from('match_predictions')
    .select('home_team, home_team_slug, away_team, away_team_slug')
    .eq('league_slug', slug)
    .gte('match_date', today)
    .limit(50);

  // League identity
  let leagueName = slugToTitle(slug);
  let country = '';
  let leagueExists = false;

  if (predictions && predictions.length > 0) {
    leagueName = predictions[0].league;
    country = (predictions as any)[0].country || '';
    leagueExists = true;
  } else if (resolved && resolved.length > 0) {
    leagueExists = true;
    const { data: any } = await supabase.from('match_predictions').select('league, country').eq('league_slug', slug).limit(1).single();
    if (any) { leagueName = any.league; country = any.country || ''; }
  } else {
    const { data: any } = await supabase.from('match_predictions').select('league, country').eq('league_slug', slug).limit(1).single();
    if (any) { leagueName = any.league; country = any.country || ''; leagueExists = true; }
  }

  if (!leagueExists) notFound();

  // Stats
  const resolvedList = resolved || [];
  const totalResolved = resolvedList.length;
  const winCount = resolvedList.filter((r) => r.is_correct).length;
  const winRate = totalResolved > 0 ? Math.round((winCount / totalResolved) * 100) : null;
  const avgProb = totalResolved > 0 ? avg(resolvedList.map((r) => r.probability)) : null;
  const avgOdds = totalResolved > 0 ? avg(resolvedList.filter((r) => r.recommended_odds > 0).map((r) => r.recommended_odds)) : null;
  const avgValue = totalResolved > 0 ? avg(resolvedList.filter((r) => r.value_edge > 0).map((r) => r.value_edge)) : null;

  // Unique teams with upcoming matches
  const teamSet = new Map<string, string>();
  (teamRows || []).forEach((r) => {
    if (!teamSet.has(r.home_team_slug)) teamSet.set(r.home_team_slug, r.home_team);
    if (!teamSet.has(r.away_team_slug)) teamSet.set(r.away_team_slug, r.away_team);
  });
  const uniqueTeams = Array.from(teamSet.entries()).slice(0, 12);

  // Group predictions by date
  const byDate = (predictions ?? []).reduce<Record<string, PredictionSummary[]>>((acc, p) => {
    if (!acc[p.match_date]) acc[p.match_date] = [];
    acc[p.match_date].push(p as PredictionSummary);
    return acc;
  }, {});

  const ll = leagueName.toLowerCase();
  const year = new Date().getFullYear();

  // JSON-LD
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
    name: `Pronostics ${leagueName} ${year} — AlgoPronos AI`,
    url: `https://algopronos.com/ligue/${slug}`,
    numberOfItems: (predictions ?? []).length,
    itemListElement: (predictions ?? []).slice(0, 10).map((p, i) => ({
      '@type': 'ListItem', position: i + 1,
      url: `https://algopronos.com/pronostic/${p.slug}`,
      name: `${p.home_team} vs ${p.away_team} — Pronostic ${p.prediction}`,
    })),
  };

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-secondary">Ligues</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">{leagueName}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero */}
            <section className="bg-surface rounded-2xl border border-surface-light p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    Pronostics {leagueName} {year}
                  </h1>
                  <p className="text-text-secondary">
                    {(predictions ?? []).length} match{(predictions ?? []).length > 1 ? 's' : ''} analysés
                    {country && <> · {country}</>}
                    {totalResolved > 0 && winRate !== null && (
                      <> · <span className={`font-semibold ${winRate >= 60 ? 'text-green-400' : 'text-white'}`}>{winRate}% de réussite IA</span></>
                    )}
                  </p>
                  <p className="text-text-muted text-sm mt-2">
                    Retrouvez tous les pronostics IA générés pour la {leagueName}{country ? ` (${country})` : ''}.
                    Notre algorithme analyse chaque match en temps réel : forme des équipes, statistiques xG,
                    confrontations directes et cotes du marché pour identifier les meilleures opportunités de value betting.
                  </p>
                </div>
              </div>
            </section>

            {/* Stats cards */}
            {totalResolved > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Performance IA — {leagueName}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface rounded-xl border border-surface-light p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{totalResolved}</div>
                    <div className="text-xs text-text-muted mt-1">Matchs résolus</div>
                  </div>
                  {winRate !== null && (
                    <div className="bg-surface rounded-xl border border-surface-light p-4 text-center">
                      <div className={`text-2xl font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{winRate}%</div>
                      <div className="text-xs text-text-muted mt-1">Taux de réussite</div>
                    </div>
                  )}
                  {avgProb !== null && (
                    <div className="bg-surface rounded-xl border border-surface-light p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{avgProb}%</div>
                      <div className="text-xs text-text-muted mt-1">Prob. moyenne</div>
                    </div>
                  )}
                  {avgOdds !== null && avgOdds > 0 && (
                    <div className="bg-surface rounded-xl border border-surface-light p-4 text-center">
                      <div className="text-2xl font-bold text-orange-400">{avgOdds}</div>
                      <div className="text-xs text-text-muted mt-1">Cote moyenne</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Analysis narrative */}
            <section className="bg-surface rounded-2xl border border-surface-light p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Analyse IA — {leagueName}
              </h2>
              <div className="space-y-3 text-text-secondary text-sm leading-relaxed">
                {totalResolved > 0 && winRate !== null ? (
                  <>
                    <p>
                      Sur les <strong className="text-white">{totalResolved} derniers matchs analysés</strong> en {leagueName},
                      notre intelligence artificielle a atteint un taux de réussite de{' '}
                      <strong className={`${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-white'}`}>
                        {winRate}%
                      </strong>.
                      {winRate >= 65 && ` C'est l'une des compétitions les plus rentables sur AlgoPronos pour le value betting.`}
                      {winRate >= 50 && winRate < 65 && ` Un taux supérieur à 50% confirme la rentabilité statistique de nos pronostics sur cette compétition.`}
                    </p>
                    {avgValue !== null && avgValue > 0 && (
                      <p>
                        Le <strong className="text-white">value edge moyen</strong> détecté sur les matchs de {leagueName} est de{' '}
                        <strong className="text-green-400">+{avgValue}%</strong> — ce qui signifie que les bookmakers
                        sous-évaluent systématiquement certains résultats dans cette compétition, créant des opportunités
                        de profit récurrentes pour les parieurs algorithmiques.
                      </p>
                    )}
                  </>
                ) : (
                  <p>
                    Notre IA analyse activement les matchs de {leagueName} pour générer des pronostics à haute valeur ajoutée.
                    Les statistiques de performance seront affichées dès que suffisamment de matchs auront été résolus.
                  </p>
                )}
                <p>
                  Pour chaque match de {leagueName}, notre algorithme intègre :{' '}
                  <strong className="text-white">statistiques xG</strong> sur les 10 derniers matchs de chaque équipe,
                  données de forme domicile/extérieur, historique des confrontations directes, blessures et suspensions,
                  et analyse comparative des cotes proposées par plus de 20 bookmakers pour calculer le{' '}
                  <strong className="text-white">value edge</strong>.
                </p>
                <p>
                  La stratégie la plus efficace pour parier sur {leagueName} consiste à combiner nos pronostics avec
                  un <Link href="/compte-optimise-ia" className="text-primary hover:underline font-medium">Compte Optimisé IA</Link> —
                  un compte configuré pour accéder aux meilleures cotes du marché et maximiser le retour sur investissement
                  à long terme sur chaque value bet identifié.
                </p>
              </div>
            </section>

            {/* Upcoming predictions by date */}
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pronostics à venir — {leagueName}
              </h2>
              {predictions && predictions.length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(byDate).map(([date, preds]) => (
                    <div key={date}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-surface-light" />
                        <span className="text-sm font-medium text-text-secondary capitalize">{formatDate(date, true)}</span>
                        <div className="h-px flex-1 bg-surface-light" />
                      </div>
                      <div className="space-y-3">
                        {preds.map((p) => (
                          <Link key={p.slug} href={`/pronostic/${p.slug}`}
                            className="block bg-surface hover:bg-surface-light rounded-2xl border border-surface-light hover:border-primary/30 p-5 transition-all group">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <div className="text-base font-semibold text-white group-hover:text-primary transition-colors">
                                  {p.home_team} vs {p.away_team}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Link href={`/equipe/${p.home_team_slug}`} className="text-xs text-text-muted hover:text-primary" onClick={(e) => e.stopPropagation()}>{p.home_team}</Link>
                                  <span className="text-text-muted text-xs">·</span>
                                  <span className="text-xs text-text-muted">{p.match_time}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
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
                                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
                                    <div className="text-xs text-text-muted">Value</div>
                                    <div className="text-sm font-bold text-green-400">+{p.value_edge}%</div>
                                  </div>
                                )}
                                <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-primary flex-shrink-0" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface rounded-2xl border border-dashed border-surface-light p-8 text-center">
                  <Target className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
                  <h3 className="text-white font-semibold mb-1">Aucun match programmé</h3>
                  <p className="text-text-secondary text-sm max-w-xs mx-auto">
                    Nos pronostics pour {leagueName} s'activeront dès que le calendrier sera mis à jour.
                  </p>
                  <Button asChild variant="outline" className="rounded-full mt-5">
                    <Link href="/pronostics">Voir tous les pronostics</Link>
                  </Button>
                </div>
              )}
            </section>

            {/* Past results */}
            {totalResolved > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Historique IA — {leagueName}
                </h2>
                <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-xs text-text-muted px-5 py-3 border-b border-surface-light">
                    <span>Match</span>
                    <span className="text-right pr-4">Pronostic</span>
                    <span className="text-right pr-4">Cote</span>
                    <span className="text-center">Résultat</span>
                  </div>
                  {resolvedList.slice(0, 10).map((r, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-5 py-3 border-b border-surface-light/50 last:border-0 hover:bg-surface-light/30 transition-colors">
                      <div>
                        <div className="text-sm text-white">{r.home_team} vs {r.away_team}</div>
                        <div className="text-xs text-text-muted">{formatDate(r.match_date)}</div>
                      </div>
                      <div className="text-sm text-primary font-medium pr-4 self-center text-right">{r.prediction}</div>
                      <div className="text-sm text-text-secondary pr-4 self-center text-right">
                        {r.recommended_odds > 0 ? r.recommended_odds : '—'}
                      </div>
                      <div className="self-center text-center">
                        {r.is_correct
                          ? <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />
                          : <XCircle className="h-5 w-5 text-red-400 mx-auto" />}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Teams in league */}
            {uniqueTeams.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Équipes à suivre — {leagueName}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uniqueTeams.map(([teamSlug, name]) => (
                    <Link key={teamSlug} href={`/equipe/${teamSlug}`}
                      className="bg-surface hover:bg-surface-light rounded-xl border border-surface-light hover:border-primary/30 p-3 flex items-center justify-between gap-2 transition-all group">
                      <span className="text-sm text-white group-hover:text-primary truncate">{name}</span>
                      <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            <section className="bg-surface rounded-2xl border border-surface-light p-6">
              <h2 className="text-lg font-bold text-white mb-5">FAQ — Pronostics {leagueName}</h2>
              <div className="space-y-5">
                {[
                  {
                    q: `Comment fonctionnent les pronostics IA pour la ${leagueName} ?`,
                    a: `Notre algorithme analyse chaque match de ${leagueName} en temps réel : statistiques xG des deux équipes sur les 10 derniers matchs, historique des confrontations directes, forme domicile/extérieur, blessures et suspensions, puis compare les probabilités calculées avec les cotes du marché pour identifier les value bets. Chaque pronostic est accompagné d'un taux de confiance et d'un value edge en pourcentage.`,
                  },
                  {
                    q: `Quel est le meilleur bookmaker pour parier sur la ${leagueName} ?`,
                    a: `1xBet propose les meilleures cotes sur la majorité des matchs de ${leagueName}. Pour optimiser chaque mise, nous recommandons de configurer un Compte Optimisé IA : un compte spécifiquement paramétré pour le value betting algorithmique avec les limites de mise adaptées et l'accès aux marchés les plus rentables.`,
                  },
                  {
                    q: `Quelle est la fiabilité des pronostics AlgoPronos sur la ${leagueName} ?`,
                    a: totalResolved > 0 && winRate !== null
                      ? `Sur les ${totalResolved} derniers matchs de ${leagueName} analysés, notre IA a atteint ${winRate}% de réussite. Ces statistiques sont calculées en temps réel et mises à jour après chaque match résolu.`
                      : `Notre IA génère des pronostics pour ${leagueName} en utilisant un modèle multi-facteurs qui a prouvé son efficacité sur des centaines de compétitions. Le taux de réussite sera affiché dès que les premiers matchs seront résolus.`,
                  },
                  {
                    q: `Quels marchés sont disponibles pour les matchs de ${leagueName} ?`,
                    a: `Pour chaque match de ${leagueName}, notre IA analyse les principaux marchés : résultat 1X2, les deux équipes marquent (BTTS), total buts (Over/Under), double chance et handicap asiatique. Le pronostic affiché est celui où le value edge est le plus significatif selon notre modèle.`,
                  },
                  {
                    q: `C'est quoi le Compte Optimisé IA d'AlgoPronos ?`,
                    a: `Le Compte Optimisé IA est un compte bookmaker configuré selon les recommandations de notre algorithme : choix du bookmaker offrant les meilleures cotes sur ${leagueName}, gestion de bankroll calibrée sur les probabilités IA, stratégie anti-limitation et accès en temps réel à tous les value bets détectés. C'est la façon la plus efficace de transformer nos pronostics en gains réguliers.`,
                  },
                ].map((item, i) => (
                  <div key={i} className="border-b border-surface-light last:border-0 pb-5 last:pb-0">
                    <h3 className="text-white font-medium mb-2">{item.q}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="space-y-5">
            <div className="sticky top-4 space-y-5">

              {/* Compte Optimisé IA */}
              <div className="bg-gradient-to-br from-primary/20 via-surface to-surface rounded-2xl border border-primary/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="text-primary font-bold text-sm uppercase tracking-wide">Compte Optimisé IA</span>
                </div>
                <h3 className="text-white font-bold text-base mb-2">
                  Maximisez vos gains sur {leagueName}
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  Un compte bookmaker configuré par notre IA pour exploiter chaque value bet détecté sur {leagueName}.
                </p>
                <ul className="space-y-2 mb-5">
                  {['Meilleures cotes du marché', 'Value bets en temps réel', 'Gestion bankroll IA', 'Stratégie anti-limitation'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/compte-optimise-ia"
                  className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                  <Zap className="h-4 w-4" />
                  Découvrir le Compte Optimisé IA
                </Link>
              </div>

              {/* Stats mini */}
              {totalResolved > 0 && winRate !== null && (
                <div className="bg-surface rounded-2xl border border-surface-light p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-semibold text-sm">Stats — {leagueName}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Taux de réussite</span>
                      <span className={`font-bold ${winRate >= 60 ? 'text-green-400' : 'text-white'}`}>{winRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Matchs analysés</span>
                      <span className="text-white font-bold">{totalResolved}</span>
                    </div>
                    {avgValue !== null && avgValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Value edge moyen</span>
                        <span className="text-green-400 font-bold">+{avgValue}%</span>
                      </div>
                    )}
                    {avgOdds !== null && avgOdds > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Cote moyenne</span>
                        <span className="text-orange-400 font-bold">{avgOdds}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Link to pronostics */}
              <div className="bg-surface rounded-2xl border border-surface-light p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-white font-semibold text-sm">Tous les pronostics</span>
                </div>
                <Link href="/pronostics" className="flex items-center justify-between text-sm text-primary hover:text-white transition-colors">
                  <span>Explorer tous les matchs</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>

        </div>
      </div>

      <PageBottomCTA />
    </main>
  );
}

export const revalidate = 3600;
