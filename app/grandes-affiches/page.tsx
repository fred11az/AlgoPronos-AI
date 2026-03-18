import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { 
  Star, ChevronRight, Calendar, TrendingUp, ArrowRight, 
  Sparkles, Brain, Zap, Trophy, Shield 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  alternates: { canonical: 'https://algopronos.com/grandes-affiches' },
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

function valueLabel(type: string): string {
  if (type === 'home') return 'Victoire Domicile';
  if (type === 'draw') return 'Match Nul';
  if (type === 'away') return 'Victoire Extérieur';
  return type;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default async function GrandesAffichesPage() {
  const supabase = createAdminClient();

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

      {/* Hero Section - Pro Sauced */}
      <section className="relative pt-10 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-bold text-primary mb-6 animate-in fade-in zoom-in duration-500">
              <Sparkles className="h-4 w-4" />
              ÉDITION SPÉCIALE IA
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight max-w-4xl">
              {s.title}
            </h1>
            
            {s.hero_match && (
              <div className="flex items-center gap-4 mb-8 bg-surface/40 backdrop-blur-md border border-white/5 px-6 py-3 rounded-2xl">
                 <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Trophy className="h-5 w-5 text-primary" />
                 </div>
                 <div className="text-left">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">Le Choc de la Semaine</div>
                    <div className="text-lg font-bold text-white uppercase italic">{s.hero_match}</div>
                 </div>
                 {s.featured_league && (
                   <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />
                 )}
                 {s.featured_league && (
                   <div className="hidden sm:block">
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Compétition</div>
                      <div className="text-sm font-bold text-white">{s.featured_league}</div>
                   </div>
                 )}
              </div>
            )}

            <div className="text-text-secondary max-w-3xl mx-auto text-base md:text-lg leading-relaxed mb-10 space-y-4">
              {s.summary.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="opacity-90">{para}</p>
              ))}
            </div>

            <div className="flex items-center gap-6 text-xs font-black text-text-muted uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {formatDate(s.week_start)} — {formatDate(s.week_end).split(' ').slice(1).join(' ')}
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-secondary" />
                {s.key_matches.length} ANALYSES PROFONDES
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Matches Overhaul */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Décryptage des sommets</h2>
          </div>
          <div className="text-[10px] font-bold text-text-muted tracking-widest uppercase">Propulsé par AlgoPronos AI</div>
        </div>

        <div className="space-y-10">
          {s.key_matches.map((m, idx) => (
            <div key={m.slug} className="relative group">
              {/* Glow Effect on Hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
              
              <div className="relative bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden">
                {/* Header with Index and Teams */}
                <div className="p-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <span className="text-6xl font-black text-white/5 italic select-none">#{idx + 1}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/ligue/${m.league_slug}`} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                          {m.league}
                        </Link>
                        <span className="text-white/20">·</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{formatDate(m.match_date)}</span>
                      </div>
                      <Link href={`/pronostic/${m.slug}`} className="text-2xl md:text-3xl font-black text-white group-hover:text-primary transition-colors block">
                        {m.home_team} <span className="text-white/20 italic mx-2">VS</span> {m.away_team}
                      </Link>
                    </div>
                  </div>

                  {/* Odds Display */}
                  <div className="flex items-center gap-3 bg-surface/50 p-2 rounded-2xl border border-white/5">
                    <div className="flex flex-col items-center px-4 py-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase">1</span>
                      <span className="text-sm font-black text-white">{m.odds_home?.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="flex flex-col items-center px-4 py-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase">N</span>
                      <span className="text-sm font-black text-white">{m.odds_draw?.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="flex flex-col items-center px-4 py-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase">2</span>
                      <span className="text-sm font-black text-white">{m.odds_away?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Deep Analysis Content */}
                <div className="px-8 py-6">
                  <div className="relative bg-surface/30 rounded-3xl p-6 border border-white/5">
                     <div className="absolute top-4 left-4">
                        <Shield className="h-5 w-5 text-primary/20" />
                     </div>
                     <p className="text-text-secondary leading-relaxed italic text-sm md:text-base pl-8">
                       "{m.deep_analysis}"
                     </p>
                  </div>
                </div>

                {/* Pro Verdict Footer */}
                <div className="bg-surface/50 px-8 py-6 flex flex-wrap items-center justify-between gap-6 border-t border-white/5">
                   <div className="flex items-center gap-8">
                      <div>
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Prédiction IA</div>
                        <Badge variant="gradient" className="px-4 py-1.5 text-xs font-black italic uppercase tracking-wider">
                          {valueLabel(m.prediction_type)} · @{m.recommended_odds?.toFixed(2)}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Confiance</div>
                        <div className="flex items-center gap-3">
                           <div className="w-24 h-2 bg-surface-light rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${m.probability}%` }} />
                           </div>
                           <span className="text-sm font-black text-white">{m.probability}%</span>
                        </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 ml-auto">
                      {m.value_edge > 0 && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
                           <TrendingUp className="h-4 w-4 text-green-400" />
                           <span className="text-xs font-black text-green-400">Value +{m.value_edge}%</span>
                        </div>
                      )}
                      
                      <Button variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest" asChild>
                        <Link href={`/pronostic/${m.slug}`}>
                          Analyse Complète <ChevronRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modern Archives Section */}
      {archive && archive.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="h-5 w-5 text-secondary" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Archives des Sommets</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archive.map((a) => (
              <Link
                key={a.slug}
                href={`/grandes-affiches/${a.slug}`}
                className="group relative bg-surface/30 backdrop-blur-sm border border-white/5 hover:border-primary/30 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                       {a.featured_league || 'CHAMPIONNATS'}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors mb-1">
                      {a.title}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-1">{a.hero_match}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center border border-white/5 shrink-0 group-hover:bg-primary/10 transition-colors">
                    <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Premium CTA */}
      <section className="relative bg-[#0F172A] border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 opacity-50" />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">
            Dominez le <span className="text-primary underline decoration-primary/30 underline-offset-8">Weekend</span>
          </h2>
          <p className="text-text-secondary mb-10 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Exploitez nos analyses IA pour construire vos combinés sur les chocs les plus attendus de la planète football.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="xl" className="h-16 px-10 text-base font-black uppercase italic tracking-widest shadow-xl shadow-primary/20" asChild>
              <Link href="/dashboard/generate">
                <Brain className="mr-3 h-6 w-6" />
                DÉMARRER L&apos;IA GÉNÉRATIVE
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="h-16 px-10 border-white/10 hover:bg-white/5 text-white font-bold text-base" asChild>
              <Link href="/matchs">
                TOUS LES MATCHS
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600;
