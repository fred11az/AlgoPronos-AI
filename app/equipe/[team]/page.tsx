import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { slugToTitle } from '@/lib/utils/slugify';
import { Users, ChevronRight, TrendingUp, Target, BarChart2, CheckCircle2, XCircle, ArrowRight, Star, Zap, Brain, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBottomCTA } from '@/components/pronostics/PageBottomCTA';

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

interface ResolvedMatch {
  is_correct: boolean;
  home_team: string;
  away_team: string;
  home_team_slug: string;
  away_team_slug: string;
  prediction: string;
  match_date: string;
  league: string;
  league_slug: string;
  recommended_odds: number;
  probability: number;
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

  const { data } = await supabase
    .from('match_predictions')
    .select('home_team, away_team, home_team_slug, away_team_slug, league, country')
    .or(`home_team_slug.eq.${slug},away_team_slug.eq.${slug}`)
    .limit(1)
    .single();

  const teamName = data
    ? data.home_team_slug === slug ? data.home_team : data.away_team
    : slugToTitle(slug);

  const league = data?.league || '';
  const country = data?.country || '';
  const tl = teamName.toLowerCase();
  const year = new Date().getFullYear();

  return {
    title: `Pronostics ${teamName} ${year} — Analyse IA, Cotes & Value Bets | AlgoPronos`,
    description: `Pronostics IA ${teamName} ${year} : analyse algorithme des matchs à venir, taux de réussite, value edge, cotes 1xBet. ${league ? `${league}. ` : ''}Gratuit sur AlgoPronos.`,
    keywords: [
      `pronostic ${tl}`,
      `${tl} pronostic`,
      `pronostic ${tl} ${year}`,
      `paris sportifs ${tl}`,
      `${tl} paris sportifs`,
      `prochain match ${tl}`,
      `analyse ${tl} IA`,
      `cote ${tl}`,
      `value bet ${tl}`,
      `1xbet ${tl}`,
      league ? `pronostic ${league.toLowerCase()}` : '',
      country ? `pronostics football ${country.toLowerCase()}` : '',
      'pronostics football IA',
      'paris sportifs intelligence artificielle',
      'algopronos pronostics',
    ].filter(Boolean).join(', '),
    alternates: { canonical: `https://algopronos.com/equipe/${slug}` },
    openGraph: {
      title: `Pronostics ${teamName} ${year} — AlgoPronos IA`,
      description: `Analyse IA complète pour ${teamName} : value bets, probabilités, historique et prochains matchs.`,
      url: `https://algopronos.com/equipe/${slug}`,
      siteName: 'AlgoPronos AI',
      type: 'website',
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  } catch { return dateStr; }
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
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

  // Upcoming matches
  const { data: predictions } = await supabase
    .from('match_predictions')
    .select('slug, home_team, away_team, home_team_slug, away_team_slug, league, league_slug, match_date, match_time, prediction, probability, recommended_odds, value_edge')
    .or(`home_team_slug.eq.${slug},away_team_slug.eq.${slug}`)
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(20);

  // Past resolved matches — extended fetch for richer stats
  const { data: resolved } = await supabase
    .from('match_predictions')
    .select('is_correct, home_team, away_team, home_team_slug, away_team_slug, prediction, match_date, league, league_slug, recommended_odds, probability, value_edge')
    .or(`home_team_slug.eq.${slug},away_team_slug.eq.${slug}`)
    .eq('is_resolved', true)
    .order('match_date', { ascending: false })
    .limit(20);

  // Team identity
  let teamName = slugToTitle(slug);
  let teamLeague = '';
  let teamLeagueSlug = '';
  let teamExists = false;

  const firstSource = predictions?.[0] || resolved?.[0];
  if (firstSource) {
    teamName = firstSource.home_team_slug === slug ? firstSource.home_team : firstSource.away_team;
    teamLeague = firstSource.league || '';
    teamLeagueSlug = firstSource.league_slug || '';
    teamExists = true;
  } else {
    const { data: any } = await supabase
      .from('match_predictions')
      .select('home_team, away_team, home_team_slug, away_team_slug, league, league_slug')
      .or(`home_team_slug.eq.${slug},away_team_slug.eq.${slug}`)
      .limit(1).single();
    if (any) {
      teamName = any.home_team_slug === slug ? any.home_team : any.away_team;
      teamLeague = any.league || '';
      teamLeagueSlug = any.league_slug || '';
      teamExists = true;
    }
  }

  if (!teamExists) notFound();

  // ── Stats calculation ──────────────────────────────────────────────────────
  const resolvedList = (resolved || []) as ResolvedMatch[];
  const totalResolved = resolvedList.length;
  const winCount = resolvedList.filter((r) => r.is_correct).length;
  const winRate = totalResolved > 0 ? Math.round((winCount / totalResolved) * 100) : null;
  const avgProb = totalResolved > 0 ? avg(resolvedList.map((r) => r.probability)) : null;
  const avgOdds = totalResolved > 0 ? avg(resolvedList.filter((r) => r.recommended_odds > 0).map((r) => r.recommended_odds)) : null;
  const avgValue = totalResolved > 0 ? avg(resolvedList.filter((r) => r.value_edge > 0).map((r) => r.value_edge)) : null;

  // Best markets
  const marketMap: Record<string, { total: number; wins: number }> = {};
  resolvedList.forEach((r) => {
    const k = r.prediction;
    if (!marketMap[k]) marketMap[k] = { total: 0, wins: 0 };
    marketMap[k].total++;
    if (r.is_correct) marketMap[k].wins++;
  });
  const bestMarkets = Object.entries(marketMap)
    .filter(([, s]) => s.total >= 2)
    .map(([pred, s]) => ({ pred, rate: Math.round((s.wins / s.total) * 100), total: s.total }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  const upcomingCount = (predictions || []).length;
  const tl = teamName.toLowerCase();
  const year = new Date().getFullYear();

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
      { '@type': 'ListItem', position: 2, name: 'Pronostics', item: 'https://algopronos.com/pronostics' },
      { '@type': 'ListItem', position: 3, name: teamName, item: `https://algopronos.com/equipe/${slug}` },
    ],
  };
  const teamJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Pronostics ${teamName} ${year} — AlgoPronos AI`,
    description: `Analyse IA complète pour ${teamName} : value bets, probabilités, historique et prochains matchs.`,
    url: `https://algopronos.com/equipe/${slug}`,
    breadcrumb: breadcrumbJsonLd,
    mainEntity: {
      '@type': 'SportsTeam',
      name: teamName,
      url: `https://algopronos.com/equipe/${slug}`,
      ...(teamLeague && { memberOf: { '@type': 'SportsOrganization', name: teamLeague } }),
    },
  };

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamJsonLd) }} />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          {teamLeagueSlug ? (
            <Link href={`/ligue/${teamLeagueSlug}`} className="hover:text-white transition-colors">{teamLeague}</Link>
          ) : (
            <span className="text-text-secondary">Équipes</span>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">{teamName}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero */}
            <section className="bg-surface rounded-2xl border border-surface-light p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    Pronostics {teamName} {year}
                  </h1>
                  <p className="text-text-secondary">
                    Analyse IA complète — {upcomingCount} match{upcomingCount > 1 ? 's' : ''} à venir
                    {teamLeague && <> · <Link href={`/ligue/${teamLeagueSlug}`} className="text-primary hover:underline">{teamLeague}</Link></>}
                  </p>
                  <p className="text-text-muted text-sm mt-2">
                    Notre intelligence artificielle analyse en continu les données de {teamName} : forme récente,
                    statistiques xG, cotes du marché et historique des confrontations pour générer des pronostics
                    à haute valeur ajoutée. Chaque prédiction est accompagnée d'une probabilité, d'un value edge
                    et d'une cote recommandée.
                  </p>
                </div>
              </div>
            </section>

            {/* Stats cards */}
            {totalResolved > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Performance IA — {teamName}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface rounded-xl border border-surface-light p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{totalResolved}</div>
                    <div className="text-xs text-text-muted mt-1">Matchs analysés</div>
                  </div>
                  {winRate !== null && (
                    <div className="bg-surface rounded-xl border border-surface-light p-4 text-center">
                      <div className={`text-2xl font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {winRate}%
                      </div>
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
                Analyse IA — {teamName}
              </h2>
              <div className="space-y-3 text-text-secondary text-sm leading-relaxed">
                {totalResolved > 0 && winRate !== null ? (
                  <>
                    <p>
                      Sur les <strong className="text-white">{totalResolved} derniers matchs analysés</strong> par notre
                      algorithme, {teamName} affiche un taux de réussite de{' '}
                      <strong className={`${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-white'}`}>
                        {winRate}%
                      </strong>{' '}
                      sur les pronostics générés.
                      {winRate >= 65 && ' Ce niveau de performance place cette équipe parmi les plus rentables pour le value betting sur AlgoPronos.'}
                      {winRate >= 50 && winRate < 65 && ' Un taux au-dessus de 50% signifie que les paris sur cet équipe sont statistiquement profitables sur le long terme.'}
                      {winRate < 50 && ' L\'IA continue d\'affiner ses modèles pour améliorer la précision sur cette équipe.'}
                    </p>
                    {avgValue !== null && avgValue > 0 && (
                      <p>
                        Le <strong className="text-white">value edge moyen</strong> détecté sur {teamName} est de{' '}
                        <strong className="text-green-400">+{avgValue}%</strong>, ce qui signifie que les cotes proposées
                        par les bookmakers sous-estiment régulièrement les chances réelles de cette équipe.
                        C'est exactement ce type d'inefficacité de marché que notre IA est conçue pour exploiter.
                      </p>
                    )}
                    {bestMarkets.length > 0 && (
                      <p>
                        Les marchés les plus performants pour {teamName} sont :{' '}
                        {bestMarkets.map((m, i) => (
                          <span key={m.pred}>
                            <strong className="text-primary">{m.pred}</strong>{' '}
                            <span className="text-text-muted">({m.rate}% sur {m.total} paris)</span>
                            {i < bestMarkets.length - 1 ? ', ' : '.'}
                          </span>
                        ))}
                        {' '}Concentrer ses paris sur ces marchés maximise le retour sur investissement statistique.
                      </p>
                    )}
                  </>
                ) : (
                  <p>
                    Notre IA commence à accumuler des données sur {teamName} pour affiner ses modèles prédictifs.
                    Les pronostics sont générés en analysant les statistiques xG, la forme récente, les confrontations
                    directes et les cotes du marché en temps réel.
                  </p>
                )}
                <p>
                  Chaque pronostic pour {teamName} intègre une analyse multi-facteurs :
                  <strong className="text-white"> Expected Goals (xG)</strong>, forme sur les 5 derniers matchs,
                  <strong className="text-white"> taux de possession</strong>, blessures et suspensions connues,
                  ainsi que les cotes proposées par plus de 20 bookmakers pour calculer le{' '}
                  <strong className="text-white">value edge</strong>.
                </p>
                <p>
                  Pour maximiser vos gains sur les matchs de {teamName}, l'idéal est de combiner nos pronostics
                  avec un <Link href="/compte-optimise-ia" className="text-primary hover:underline font-medium">Compte Optimisé IA</Link> —
                  un compte bookmaker configuré spécifiquement pour le value betting algorithmique avec des limites
                  de mise adaptées et les meilleures cotes disponibles sur le marché.
                </p>
              </div>
            </section>

            {/* Upcoming matches */}
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Prochains matchs — Pronostics {teamName}
              </h2>
              {predictions && predictions.length > 0 ? (
                <div className="space-y-3">
                  {(predictions as PredictionSummary[]).map((p) => {
                    const isHome = p.home_team_slug === slug;
                    const opponent = isHome ? p.away_team : p.home_team;
                    const opponentSlug = isHome ? p.away_team_slug : p.home_team_slug;
                    return (
                      <Link
                        key={p.slug}
                        href={`/pronostic/${p.slug}`}
                        className="block bg-surface hover:bg-surface-light rounded-2xl border border-surface-light hover:border-primary/30 p-5 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-white group-hover:text-primary transition-colors">
                              {isHome ? teamName : opponent}
                              <span className="text-text-muted font-normal"> vs </span>
                              {isHome ? opponent : teamName}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <Link href={`/ligue/${p.league_slug}`} className="text-xs text-text-muted hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                {p.league}
                              </Link>
                              <span className="text-xs text-text-muted">· {formatDate(p.match_date)} {p.match_time}</span>
                              <span className={`text-xs font-medium ${isHome ? 'text-blue-400' : 'text-orange-400'}`}>
                                {isHome ? 'Domicile' : 'Extérieur'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
                              <div className="text-xs text-text-muted">Pronostic</div>
                              <div className="text-sm font-semibold text-primary">{p.prediction}</div>
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
                    );
                  })}
                </div>
              ) : (
                <div className="bg-surface rounded-2xl border border-dashed border-surface-light p-8 text-center">
                  <Users className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
                  <h3 className="text-white font-semibold mb-1">Pas de match programmé</h3>
                  <p className="text-text-secondary text-sm max-w-xs mx-auto">
                    Nos pronostics pour {teamName} s'activeront dès que le calendrier sera mis à jour.
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
                  Historique des pronostics IA — {teamName}
                </h2>
                <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-xs text-text-muted px-5 py-3 border-b border-surface-light">
                    <span>Match</span>
                    <span className="text-right pr-4">Pronostic</span>
                    <span className="text-right pr-4">Cote</span>
                    <span className="text-center">Résultat</span>
                  </div>
                  {resolvedList.slice(0, 10).map((r, i) => {
                    const isHome = r.home_team_slug === slug;
                    return (
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
                    );
                  })}
                </div>
              </section>
            )}

            {/* FAQ */}
            <section className="bg-surface rounded-2xl border border-surface-light p-6">
              <h2 className="text-lg font-bold text-white mb-5">
                FAQ — Pronostics {teamName}
              </h2>
              <div className="space-y-5">
                {[
                  {
                    q: `Comment sont générés les pronostics pour ${teamName} ?`,
                    a: `Notre intelligence artificielle analyse en temps réel les données de ${teamName} : forme sur les 10 derniers matchs, statistiques xG offensives et défensives, taux de possession, blessures connues, performance domicile/extérieur et les cotes proposées par plus de 20 bookmakers. L'algorithme calcule ensuite la probabilité réelle et compare avec les cotes du marché pour détecter les value bets.`,
                  },
                  {
                    q: `Qu'est-ce que le value edge sur les matchs de ${teamName} ?`,
                    a: `Le value edge représente l'écart entre la probabilité calculée par notre IA et celle implicite dans les cotes du bookmaker. Par exemple, si notre IA donne 60% de chances à ${teamName} de gagner, mais que la cote correspond à seulement 45%, le value edge est positif (+15%). C'est sur ces écarts que se construit une rentabilité à long terme.`,
                  },
                  {
                    q: `Où parier sur les matchs de ${teamName} avec les meilleures cotes ?`,
                    a: `1xBet propose généralement les meilleures cotes sur les matchs de ${teamName}${teamLeague ? ` et ${teamLeague}` : ''}. Pour maximiser la valeur de chaque pari, nous recommandons d'utiliser un Compte Optimisé IA : un compte configuré spécifiquement pour le value betting algorithmique avec une gestion de bankroll adaptée.`,
                  },
                  {
                    q: `Quel est le taux de réussite de l'IA sur ${teamName} ?`,
                    a: totalResolved > 0 && winRate !== null
                      ? `Sur les ${totalResolved} derniers matchs analysés, notre IA a atteint un taux de réussite de ${winRate}% sur ${teamName}. Ce chiffre est mis à jour automatiquement après chaque match résolu et reflète la précision réelle de notre algorithme.`
                      : `Notre IA commence à accumuler des données sur ${teamName}. Le taux de réussite sera affiché dès que suffisamment de matchs auront été analysés et résolus. Toutes les prédictions intègrent déjà notre modèle multi-facteurs complet.`,
                  },
                  {
                    q: `Comment suivre tous les pronostics de ${teamName} ?`,
                    a: `Cette page est automatiquement mise à jour à chaque nouveau match programmé pour ${teamName}. Vous pouvez également consulter les pages de ${teamLeague ? `la ${teamLeague}` : 'chaque compétition'} pour voir tous les pronostics de la compétition, ou accéder directement à la page de chaque match pour une analyse détaillée.`,
                  },
                  {
                    q: `C'est quoi le Compte Optimisé IA d'AlgoPronos ?`,
                    a: `Le Compte Optimisé IA est un compte bookmaker configuré selon les recommandations de notre algorithme pour maximiser le retour sur investissement : choix du bookmaker offrant les meilleures cotes, gestion de bankroll adaptée au value betting, et stratégie de mise calibrée sur les probabilités IA. Consultez notre guide complet sur la page dédiée.`,
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

            {/* Compte Optimisé IA — primary CTA */}
            <div className="sticky top-4 space-y-5">
              <div className="bg-gradient-to-br from-primary/20 via-surface to-surface rounded-2xl border border-primary/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="text-primary font-bold text-sm uppercase tracking-wide">Compte Optimisé IA</span>
                </div>
                <h3 className="text-white font-bold text-base mb-2">
                  Pariez sur {teamName} avec l'avantage algorithmique
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  Un compte bookmaker configuré par notre IA pour maximiser vos gains sur chaque value bet détecté.
                </p>
                <ul className="space-y-2 mb-5">
                  {[
                    'Meilleures cotes garanties',
                    'Gestion bankroll IA incluse',
                    'Accès aux value bets en temps réel',
                    'Stratégie anti-limitation',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/compte-optimise-ia"
                  className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Zap className="h-4 w-4" />
                  Découvrir le Compte Optimisé IA
                </Link>
              </div>

              {/* Stats mini */}
              {totalResolved > 0 && winRate !== null && (
                <div className="bg-surface rounded-2xl border border-surface-light p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-semibold text-sm">Stats IA — {teamName}</span>
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
                  </div>
                </div>
              )}

              {/* League link */}
              {teamLeagueSlug && (
                <div className="bg-surface rounded-2xl border border-surface-light p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-white font-semibold text-sm">Compétition</span>
                  </div>
                  <Link
                    href={`/ligue/${teamLeagueSlug}`}
                    className="flex items-center justify-between text-sm text-primary hover:text-white transition-colors"
                  >
                    <span>{teamLeague}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <PageBottomCTA />
    </main>
  );
}

export const revalidate = 3600;
