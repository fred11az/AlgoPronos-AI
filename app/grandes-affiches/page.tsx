import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Star, ChevronRight, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Grandes Affiches de la Semaine — Analyse IA | AlgoPronos',
  description:
    'Analyse approfondie par IA des plus grandes affiches football de la semaine. Champions League, Premier League, La Liga et plus. Pronostics et décryptage tactique.',
  keywords: [
    'grandes affiches football semaine',
    'analyse champions league',
    'pronostic choc de la semaine',
    'analyse football approfondie',
    'pronostics semaine football',
  ].join(', '),
};

interface KeyMatch {
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
  deep_analysis: string;
}

interface Spotlight {
  id: string;
  slug: string;
  title: string;
  week_start: string;
  week_end: string;
  hero_match: string;
  featured_league: string;
  summary: string;
  key_matches: KeyMatch[];
  published_at: string;
}

function predBadge(type: string): { label: string; cls: string } {
  if (type === 'home') return { label: '1 — Domicile', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  if (type === 'draw') return { label: 'N — Nul', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
  return { label: '2 — Extérieur', cls: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default async function GrandesAffichesPage() {
  const supabase = await createClient();

  // Load the latest spotlight
  const { data: spotlight, error } = await supabase
    .from('weekly_spotlights')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (error || !spotlight) {
    notFound();
  }

  const s = spotlight as Spotlight;

  // Previous spotlights for archive section
  const { data: archive } = await supabase
    .from('weekly_spotlights')
    .select('slug, title, week_start, hero_match, featured_league')
    .order('week_start', { ascending: false })
    .range(1, 5);

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Grandes Affiches</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-br from-primary/10 via-surface to-surface rounded-2xl border border-primary/20 p-6 md:p-10">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-primary fill-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Grandes Affiches</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">{s.title}</h1>
          {s.hero_match && (
            <p className="text-lg text-text-secondary mb-4">
              À la une : <span className="text-white font-semibold">{s.hero_match}</span>
              {s.featured_league && <span className="text-primary ml-2">· {s.featured_league}</span>}
            </p>
          )}
          {/* Editorial intro */}
          <div className="text-text-secondary leading-relaxed space-y-3 text-sm md:text-base">
            {s.summary.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-6 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(s.week_start)} — {formatDate(s.week_end)}
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              {s.key_matches.length} matchs analysés
            </span>
          </div>
        </div>
      </section>

      {/* Key Matches */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-white mb-6">Décryptage des chocs</h2>
        <div className="space-y-5">
          {s.key_matches.map((m, idx) => {
            const badge = predBadge(m.prediction_type);
            return (
              <div
                key={m.slug}
                className="bg-surface rounded-2xl border border-surface-light overflow-hidden"
              >
                {/* Match header */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-surface-light flex-wrap">
                  <span className="text-2xl font-bold text-primary/30">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/pronostic/${m.slug}`}
                      className="text-lg font-bold text-white hover:text-primary transition-colors"
                    >
                      {m.home_team} <span className="text-text-muted font-normal text-base">vs</span> {m.away_team}
                    </Link>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                      <Link href={`/ligue/${m.league_slug}`} className="hover:text-primary transition-colors">
                        {m.league}
                      </Link>
                      <span>·</span>
                      <span>{formatDate(m.match_date)}</span>
                      <span>·</span>
                      <span>{m.match_time}</span>
                    </div>
                  </div>
                  {/* Odds */}
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="bg-surface-light rounded px-2 py-1">1 · {m.odds_home?.toFixed(2)}</span>
                    <span className="bg-surface-light rounded px-2 py-1">N · {m.odds_draw?.toFixed(2)}</span>
                    <span className="bg-surface-light rounded px-2 py-1">2 · {m.odds_away?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Analysis body */}
                <div className="px-5 py-4">
                  <p className="text-text-secondary text-sm leading-relaxed">{m.deep_analysis}</p>
                </div>

                {/* Verdict */}
                <div className="flex items-center gap-3 px-5 py-3 bg-surface-light/50 flex-wrap">
                  <div className={`border rounded-lg px-3 py-1.5 text-sm font-semibold ${badge.cls}`}>
                    {badge.label}
                  </div>
                  <div className="text-sm text-text-muted">
                    Probabilité : <span className="text-white font-medium">{m.probability}%</span>
                  </div>
                  <div className="text-sm text-text-muted">
                    Cote conseillée : <span className="text-white font-medium">{m.recommended_odds?.toFixed(2)}</span>
                  </div>
                  {m.value_edge > 0 && (
                    <div className="text-sm font-semibold text-green-400 ml-auto">
                      Value +{m.value_edge}%
                    </div>
                  )}
                  <Link
                    href={`/pronostic/${m.slug}`}
                    className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Analyse complète <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Archive */}
      {archive && archive.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-lg font-bold text-white mb-4">Semaines précédentes</h2>
          <div className="space-y-2">
            {archive.map((a) => (
              <Link
                key={a.slug}
                href={`/grandes-affiches/${a.slug}`}
                className="flex items-center gap-4 bg-surface hover:bg-surface-light rounded-xl border border-surface-light hover:border-primary/30 px-4 py-3 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">{a.title}</div>
                  {a.hero_match && <div className="text-xs text-text-muted mt-0.5">À la une : {a.hero_match}</div>}
                </div>
                <span className="text-xs text-text-muted">{a.featured_league}</span>
                <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-[#00D4FF]/10 border-t border-primary/20">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Construire votre ticket sur ces affiches
          </h2>
          <p className="text-text-secondary mb-6 text-sm">
            Sélectionnez les meilleures opportunités parmi les grandes affiches de la semaine.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/dashboard/generate">
              <Button variant="gradient" size="lg">
                Générer mon combiné IA
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/matchs">
              <Button variant="outline" size="lg">
                Voir tous les matchs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600;
