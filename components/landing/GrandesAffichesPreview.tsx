import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Star, ArrowRight, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface KeyMatch {
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
  prediction_type: string;
  probability: number;
  recommended_odds: number;
  value_edge: number;
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
}

function predBadge(type: string): { label: string; cls: string } {
  if (type === 'home') return { label: '1 — Dom.', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  if (type === 'draw') return { label: 'N — Nul', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
  return { label: '2 — Ext.', cls: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
}

function formatWeek(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const e = new Date(end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${s} – ${e}`;
}

export async function GrandesAffichesPreview() {
  const supabase = await createClient();

  const { data: spotlight } = await supabase
    .from('weekly_spotlights')
    .select('id, slug, title, week_start, week_end, hero_match, featured_league, summary, key_matches')
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (!spotlight) return null;

  const s = spotlight as Spotlight;
  // Afficher les 3 premiers matchs max en preview
  const previewMatches = (s.key_matches || []).slice(0, 3);

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="outline" className="mb-3 flex items-center gap-1.5 w-fit">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              Grandes Affiches
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{s.title}</h2>
            <div className="flex items-center gap-2 mt-2 text-text-muted text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatWeek(s.week_start, s.week_end)}</span>
              {s.featured_league && (
                <>
                  <span>·</span>
                  <span className="text-primary">{s.featured_league}</span>
                </>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/grandes-affiches">
              Voir l&apos;analyse complète
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Hero match */}
        {s.hero_match && (
          <div className="bg-gradient-to-br from-primary/10 via-surface-light to-surface rounded-2xl border border-primary/20 px-6 py-5 mb-6">
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">
              À la une
            </p>
            <p className="text-xl font-bold text-white">{s.hero_match}</p>
            {s.summary && (
              <p className="text-text-secondary text-sm mt-2 leading-relaxed line-clamp-2">
                {s.summary.split('\n')[0]}
              </p>
            )}
          </div>
        )}

        {/* Match cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {previewMatches.map((m) => {
            const badge = predBadge(m.prediction_type);
            return (
              <Link
                key={m.slug}
                href={`/pronostic/${m.slug}`}
                className="group bg-surface-light rounded-2xl border border-surface-light hover:border-primary/30 p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* League */}
                <p className="text-xs text-text-muted mb-3">{m.league}</p>

                {/* Teams */}
                <p className="font-bold text-white text-sm mb-1 group-hover:text-primary transition-colors">
                  {m.home_team}
                </p>
                <p className="text-text-muted text-xs mb-3">vs {m.away_team}</p>

                {/* Stats */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`border rounded-md px-2 py-1 text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    {m.probability}% · @{m.recommended_odds?.toFixed(2)}
                  </span>
                  {m.value_edge > 0 && (
                    <span className="text-xs font-semibold text-green-400 ml-auto">
                      +{m.value_edge}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-primary text-xs mt-4 group-hover:gap-2 transition-all">
                  Analyse complète
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/grandes-affiches">
              <Star className="mr-2 h-4 w-4 fill-current" />
              Voir toutes les grandes affiches
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
