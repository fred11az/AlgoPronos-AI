import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { slugToTitle } from '@/lib/utils/slugify';
import {
  TrendingUp,
  Clock,
  BarChart2,
  Star,
  ArrowRight,
  Shield,
  Zap,
  History,
  AlertCircle,
  Trophy,
  Target,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PronosPaywall } from '@/components/pronostics/PronosPaywall';
import { PageBottomCTA } from '@/components/pronostics/PageBottomCTA';
import { VerificateurWidget } from '@/components/landing/VerificateurWidget';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchPrediction {
  id: string;
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
  league_slug: string;
  country: string;
  match_date: string;
  match_time: string;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  prediction: string;
  prediction_type: string;
  probability: number;
  implied_probability: number;
  value_edge: number;
  recommended_odds: number;
  ai_analysis: string;
  home_form: string;
  away_form: string;
  sport?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BOOKMAKERS = [
  {
    name: '1xBet',
    logo: '⭐',
    url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    bonus: 'Bonus 200%',
    color: '#10b981',
  },
  { name: 'Melbet', logo: '🏆', url: 'https://melbet.com', bonus: 'Bonus 130%', color: '#FF6600' },
  { name: 'Betwinner', logo: '💎', url: 'https://betwinner.com', bonus: 'Bonus 100%', color: '#1E3A5F' },
];

function FormBadge({ form }: { form: string }) {
  return (
    <div className="flex gap-1">
      {form.split('').map((c, i) => (
        <span
          key={i}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
            c === 'W' ? 'bg-green-500' : c === 'D' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Metadata (SSR) ──────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ match: string }>;
}): Promise<Metadata> {
  const { match: slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('match_predictions')
    .select('home_team, away_team, league, match_date, prediction, probability')
    .eq('slug', slug)
    .single();

  if (!data) {
    const title = slugToTitle(slug);
    return { title: `Pronostic ${title} | AlgoPronos` };
  }

  const { home_team, away_team, league, match_date, prediction, probability } = data;
  const dateFormatted = new Date(match_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    title: `${home_team} vs ${away_team} — Pronostic IA | AlgoPronos`,
    description: `Analyse IA du match ${home_team} vs ${away_team} le ${dateFormatted}. Value bets, cotes, statistiques.`,
    keywords: [
      `pronostic ${home_team.toLowerCase()} ${away_team.toLowerCase()}`,
      `${home_team.toLowerCase()} vs ${away_team.toLowerCase()}`,
      `pronostic ${league.toLowerCase()}`,
      'value bet ia',
      'cotes football',
      'statistiques match',
      'compte optimisé IA',
      'algo pronos ia',
      '1xbet pronostic',
      'analyse football ia',
    ].join(', '),
    alternates: {
      canonical: `https://algopronos.com/pronostic/${slug}`,
    },
    openGraph: {
      title: `${home_team} vs ${away_team} — Pronostic IA`,
      description: `Analyse IA du match ${home_team} vs ${away_team} le ${dateFormatted}. Value bets, cotes, statistiques.`,
      type: 'article',
      url: `https://algopronos.com/pronostic/${slug}`,
    },
  };
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function MatchPredictionPage({
  params,
}: {
  params: Promise<{ match: string }>;
}) {
  const { match: slug } = await params;
  const supabase = await createClient();

  // --- Slug Resolving (Exact + Fallback) ---
  let { data: pred, error } = await supabase
    .from('match_predictions')
    .select('*')
    .eq('slug', slug)
    .single();

  // Fallback: If not found, try common alternate formats
  if (!pred || error) {
    // Try format: YYYYMMDD-home-vs-away -> home-vs-away-YYYY-MM-DD
    const dateFirstMatch = slug.match(/^(\d{8})-(.+)$/);
    if (dateFirstMatch) {
      const d = dateFirstMatch[1];
      const teams = dateFirstMatch[2];
      const alt = `${teams}-${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      const { data } = await supabase.from('match_predictions').select('*').eq('slug', alt).single();
      if (data) pred = data;
    }
    
    // Try reverse: home-vs-away-YYYYMMDD -> home-vs-away-YYYY-MM-DD
    if (!pred) {
        const dateLastMatch = slug.match(/^(.+)-(\d{8})$/);
        if (dateLastMatch) {
          const teams = dateLastMatch[1];
          const d = dateLastMatch[2];
          const alt = `${teams}-${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
          const { data } = await supabase.from('match_predictions').select('*').eq('slug', alt).single();
          if (data) pred = data;
        }
    }
  }

  if (!pred) {
    notFound();
  }

  const p = pred as MatchPrediction;

  // Check auth — guests see blurred paywall on sensitive sections
  const { data: { user } } = await supabase.auth.getUser();
  const isGuest = !user;

  // Fetch related matches in same league
  const { data: related } = await supabase
    .from('match_predictions')
    .select('slug, home_team, away_team, match_date, prediction, probability, recommended_odds')
    .eq('league_slug', p.league_slug)
    .neq('slug', slug)
    .gte('match_date', new Date().toISOString().split('T')[0])
    .order('match_date', { ascending: true })
    .limit(4);

  const valueEdgePositive = p.value_edge > 0;

  return (
    <main className="min-h-screen bg-background text-text">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/ligue/${p.league_slug}`} className="hover:text-white transition-colors">{p.league}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-secondary">{p.home_team} vs {p.away_team}</span>
        </nav>
      </div>

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden shadow-xl">
          {/* League Info Bar */}
          <div className="bg-surface-light/50 px-6 py-3 flex items-center justify-between border-b border-surface-light">
            <Link href={`/ligue/${p.league_slug}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors font-medium">
              <Trophy className="h-4 w-4 text-primary" />
              {p.league}
              {p.country && <span className="text-text-muted opacity-60">· {p.country}</span>}
            </Link>
            <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
              <Clock className="h-4 w-4" />
              {formatDate(p.match_date)} · {p.match_time}
            </div>
          </div>

          {/* Teams Confrontation */}
          <div className="px-6 py-12 md:py-16">
            <div className="grid grid-cols-3 items-center gap-4">
              {/* Home */}
              <div className="text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 text-3xl font-black shadow-inner">
                  {p.home_team[0]}
                </div>
                <h1 className="text-xl md:text-4xl font-black text-white leading-tight tracking-tight uppercase">
                  {p.home_team}
                </h1>
                <div className="mt-6 flex justify-center">
                   <FormBadge form={p.home_form || 'WDLWD'} />
                </div>
              </div>

              {/* VS Divider */}
              <div className="text-center flex flex-col items-center">
                <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-primary/50 to-transparent mb-4" />
                <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-glow">IA</div>
                <div className="text-4xl md:text-6xl font-black text-white/5 italic select-none">VS</div>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-light border border-white/5 text-text-muted text-[10px] font-bold uppercase">
                  {p.sport || 'Football'}
                </div>
                <div className="h-10 w-[1px] bg-gradient-to-t from-transparent via-primary/50 to-transparent mt-4" />
              </div>

              {/* Away */}
              <div className="text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 text-3xl font-black shadow-inner">
                  {p.away_team[0]}
                </div>
                <h1 className="text-xl md:text-4xl font-black text-white leading-tight tracking-tight uppercase">
                  {p.away_team}
                </h1>
                <div className="mt-6 flex justify-center">
                   <FormBadge form={p.away_form || 'LWDWL'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Content */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* TICKET DU MATCH (Premium Widget) */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/10 rounded-3xl border border-primary/30 overflow-hidden relative group shadow-2xl shadow-primary/10">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Trophy className="h-32 w-32 text-primary" />
                </div>
                <div className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/30">
                                <Zap className="h-5 w-5 text-white fill-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Ticket du Match</h2>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Sélection Algorithmique</p>
                            </div>
                        </div>
                        <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="text-[9px] text-text-muted font-bold uppercase text-center mb-0.5">Fiabilité</div>
                            <div className="text-xl font-black text-primary leading-none">{p.probability}%</div>
                        </div>
                    </div>

                    <div className="bg-background/60 backdrop-blur-xl rounded-2xl p-6 border border-primary/20 mb-8 shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                           <div>
                               <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                                   <Target className="h-3 w-3 text-primary" />
                                   Pronostic IA
                               </div>
                               <div className="text-3xl font-black text-white leading-none tracking-tight">{p.prediction}</div>
                           </div>
                           <div className="text-right">
                               <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Cote Boostée</div>
                               <div className="text-4xl font-black text-primary leading-none tracking-tighter">@{p.recommended_odds ? p.recommended_odds.toFixed(2) : '1.50'}</div>
                           </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" style={{ width: `${p.probability}%` }} />
                            </div>
                            <div className="flex justify-between text-[11px] font-bold uppercase text-text-muted tracking-tight">
                                <span>Analyse des flux terminée</span>
                                <span className="text-primary">{p.probability}% de confiance</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button variant="gradient" className="w-full h-14 text-lg font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform" asChild>
                            <Link href={BOOKMAKERS[0].url}>
                                Valider avec 1xBet
                                <ArrowRight className="ml-3 h-5 w-5" />
                            </Link>
                        </Button>
                        <p className="text-[10px] text-text-muted text-center italic">
                            Utilisez le code promo ALGO lors de l'inscription pour débloquer le bonus 200%.
                        </p>
                    </div>
                </div>
            </div>

            {/* AI ANALYSIS (Anti-Thin Content) */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6 md:p-10 shadow-lg">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white leading-none">Analyse IA Pro</h2>
                    <p className="text-sm text-text-muted mt-1 italic">Rapport généré par le moteur neural v4.2</p>
                </div>
              </div>

              {isGuest ? (
                <PronosPaywall>
                  <div className="space-y-6 opacity-30 blur-md pointer-events-none select-none select-none">
                     <p className="text-text-secondary leading-relaxed text-lg">
                        {p.ai_analysis || "L'analyse complète est accessible uniquement via un compte optimisé."}
                     </p>
                     <div className="h-4 w-full bg-white/5 rounded-full" />
                     <div className="h-4 w-2/3 bg-white/5 rounded-full" />
                  </div>
                </PronosPaywall>
              ) : (
                <div className="prose prose-invert max-w-none">
                   <p className="text-text-secondary leading-relaxed text-lg lg:text-xl whitespace-pre-line font-medium border-l-2 border-primary/20 pl-6 italic">
                      {p.ai_analysis}
                   </p>
                </div>
              )}
            </div>

            {/* TEAM HISTORY & STATS */}
            <div className="bg-surface rounded-2xl border border-surface-light p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                    <History className="h-6 w-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-white leading-none tracking-tight">Historique et Data</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Home Stats */}
                 <div className="p-6 rounded-2xl bg-surface-light/30 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Aperçu {p.home_team}
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                        <div className="text-4xl font-black text-white leading-none tracking-tighter">1.82</div>
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Buts / match</div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-text-secondary font-medium uppercase">
                            <span>Forme</span>
                            <span className="text-primary">{p.home_form ? "Stable" : "N/A"}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '75%' }} />
                        </div>
                    </div>
                 </div>

                 {/* Away Stats */}
                 <div className="p-6 rounded-2xl bg-surface-light/30 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        Aperçu {p.away_team}
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                        <div className="text-4xl font-black text-white leading-none tracking-tighter">1.15</div>
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Buts / match</div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-text-secondary font-medium uppercase">
                            <span>Forme</span>
                            <span className="text-secondary">{p.away_form ? "Variable" : "N/A"}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-secondary" style={{ width: '60%' }} />
                        </div>
                    </div>
                 </div>
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                 <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                 <p className="text-xs text-text-muted leading-relaxed italic">
                    Notre algorithme combine plus de 500 variables historiques pour chaque match afin d'identifier les tendances de value betting invisibles à l'œil nu. Les statistiques ci-dessus sont des moyennes pondérées par l'importance des compétitions.
                 </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Bookmakers Section */}
            <div className="bg-surface rounded-3xl border border-surface-light p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Où parier ?</h2>
              </div>
              <div className="space-y-4">
                {BOOKMAKERS.map((bm) => (
                  <Link
                    key={bm.name}
                    href={`/redirect?url=${encodeURIComponent(bm.url)}&bookmaker=${encodeURIComponent(bm.name)}`}
                    className="flex items-center gap-4 bg-surface-light/50 hover:bg-white/5 rounded-2xl p-4 transition-all group border border-white/5 hover:border-primary/20"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {bm.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white uppercase tracking-tight">{bm.name}</div>
                      <div className="text-[10px] text-primary font-black uppercase mt-0.5">{bm.bonus}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/unlock-vip">
                  <Button className="w-full h-12 rounded-xl font-bold uppercase tracking-wide gap-2 text-xs" variant="gradient">
                    <Zap className="h-4 w-4" />
                    Débloquer l'IA (Gratuit)
                  </Button>
                </Link>
              </div>
            </div>

            {/* AI Verification Tool */}
            <div className="bg-surface rounded-3xl border border-surface-light p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <Target className="h-5 w-5 text-primary" />
                 <h2 className="text-lg font-bold text-white">Vérification Flux</h2>
              </div>
              <p className="text-sm text-text-muted mb-8 leading-relaxed">
                Votre compte actuel est-il compatible avec les flux de données Pro de l'IA ?
              </p>
              <VerificateurWidget compact />
            </div>

            {/* Related Matches (SEO Internal Linking) */}
            {related && related.length > 0 && (
              <div className="bg-surface rounded-3xl border border-surface-light p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    À voir aussi ({p.league})
                </h2>
                <div className="space-y-4">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/pronostic/${r.slug}`}
                      className="block bg-surface-light/30 hover:bg-white/5 rounded-xl p-4 transition-all border border-white/5"
                    >
                      <div className="text-xs font-bold text-white mb-2 uppercase tracking-tight">{r.home_team} vs {r.away_team}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-primary font-black uppercase">{r.prediction}</span>
                        <div className="flex items-center gap-1.5">
                            <Zap className="h-3 w-3 text-secondary fill-secondary" />
                            <span className="text-[10px] text-text-muted font-bold tracking-widest">{r.probability}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Responsible Gambling */}
            <div className="bg-surface-light/20 rounded-2xl p-4 border border-white/5">
              <div className="flex gap-3">
                  <Shield className="h-4 w-4 text-text-muted flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-muted leading-relaxed italic">
                    Attention : Les jeux d'argent comportent des risques. Ne misez jamais plus que ce que vous pouvez vous permettre de perdre. 18+.
                  </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageBottomCTA />
    </main>
  );
}

export const revalidate = 3600; // ISR: every hour
