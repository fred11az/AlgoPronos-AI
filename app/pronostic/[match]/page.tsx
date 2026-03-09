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
  Target,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BOOKMAKERS = [
  {
    name: '1xBet',
    logo: '/bookmakers/1xbet.webp',
    url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://1xbet.com',
    bonus: 'Bonus 200%',
    color: '#0066CC',
  },
  { name: 'Melbet', logo: '/bookmakers/melbet.png', url: 'https://melbet.com', bonus: 'Bonus 130%', color: '#FF6600' },
  { name: 'Betwinner', logo: '/bookmakers/betwinner.webp', url: 'https://betwinner.com', bonus: 'Bonus 100%', color: '#1E3A5F' },
];

function FormBadge({ form }: { form: string }) {
  return (
    <div className="flex gap-1">
      {form.split('').map((c, i) => (
        <span
          key={i}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
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
    title: `Pronostic ${home_team} vs ${away_team} — ${dateFormatted} | AlgoPronos`,
    description: `Pronostic IA pour ${home_team} vs ${away_team} en ${league}. Analyse algorithmique : ${prediction} avec ${probability}% de probabilité. Cotes et analyse complète.`,
    keywords: [
      `pronostic ${home_team.toLowerCase()} ${away_team.toLowerCase()}`,
      `${home_team.toLowerCase()} vs ${away_team.toLowerCase()}`,
      `pronostic ${league.toLowerCase()}`,
      'pronostic football ia',
      'paris sportifs',
      'analyse football',
    ].join(', '),
    openGraph: {
      title: `Pronostic IA : ${home_team} vs ${away_team}`,
      description: `${prediction} — Probabilité ${probability}% — Analyse AlgoPronos`,
      type: 'article',
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

  const { data: pred, error } = await supabase
    .from('match_predictions')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !pred) {
    notFound();
  }

  const p = pred as MatchPrediction;

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
    <main className="min-h-screen bg-background">
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

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden">
          {/* League badge */}
          <div className="bg-surface-light px-6 py-3 flex items-center justify-between">
            <Link href={`/ligue/${p.league_slug}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
              <BarChart2 className="h-4 w-4 text-primary" />
              {p.league}
              {p.country && <span className="text-text-muted">· {p.country}</span>}
            </Link>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Clock className="h-4 w-4" />
              {formatDate(p.match_date)} · {p.match_time}
            </div>
          </div>

          {/* Teams */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-3 items-center gap-4">
              {/* Home Team */}
              <div className="text-center">
                <Link href={`/equipe/${p.home_team.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-2xl md:text-3xl font-bold text-white hover:text-primary transition-colors block">
                  {p.home_team}
                </Link>
                <span className="text-sm text-text-muted mt-1 block">Domicile</span>
                {p.home_form && (
                  <div className="mt-3 flex justify-center">
                    <FormBadge form={p.home_form} />
                  </div>
                )}
              </div>

              {/* VS + Odds */}
              <div className="text-center">
                <div className="text-4xl font-bold text-text-muted mb-4">VS</div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className={`rounded-lg p-2 ${p.prediction_type === 'home' ? 'bg-primary/20 border border-primary' : 'bg-surface-light'}`}>
                    <div className="text-xs text-text-muted mb-1">1</div>
                    <div className={`font-bold ${p.prediction_type === 'home' ? 'text-primary' : 'text-white'}`}>
                      {p.odds_home?.toFixed(2)}
                    </div>
                  </div>
                  <div className={`rounded-lg p-2 ${p.prediction_type === 'draw' ? 'bg-primary/20 border border-primary' : 'bg-surface-light'}`}>
                    <div className="text-xs text-text-muted mb-1">N</div>
                    <div className={`font-bold ${p.prediction_type === 'draw' ? 'text-primary' : 'text-white'}`}>
                      {p.odds_draw?.toFixed(2)}
                    </div>
                  </div>
                  <div className={`rounded-lg p-2 ${p.prediction_type === 'away' ? 'bg-primary/20 border border-primary' : 'bg-surface-light'}`}>
                    <div className="text-xs text-text-muted mb-1">2</div>
                    <div className={`font-bold ${p.prediction_type === 'away' ? 'text-primary' : 'text-white'}`}>
                      {p.odds_away?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center">
                <Link href={`/equipe/${p.away_team.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-2xl md:text-3xl font-bold text-white hover:text-primary transition-colors block">
                  {p.away_team}
                </Link>
                <span className="text-sm text-text-muted mt-1 block">Extérieur</span>
                {p.away_form && (
                  <div className="mt-3 flex justify-center">
                    <FormBadge form={p.away_form} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left — Analysis + Stats */}
          <div className="md:col-span-2 space-y-6">
            {/* AI Prediction Card */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-white">Pronostic IA</h2>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-[#00D4FF]/10 rounded-xl p-5 border border-primary/20 mb-4">
                <div className="text-2xl font-bold text-white mb-1">{p.prediction}</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-primary font-semibold">Cote : {p.recommended_odds?.toFixed(2)}</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-secondary">Probabilité modèle : <span className="text-white font-semibold">{p.probability}%</span></span>
                </div>
              </div>

              {/* Value stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-light rounded-xl p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Prob. implicite</div>
                  <div className="text-lg font-bold text-white">{p.implied_probability}%</div>
                </div>
                <div className="bg-surface-light rounded-xl p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Prob. modèle</div>
                  <div className="text-lg font-bold text-white">{p.probability}%</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${valueEdgePositive ? 'bg-green-500/10 border border-green-500/30' : 'bg-surface-light'}`}>
                  <div className="text-xs text-text-muted mb-1">Value Edge</div>
                  <div className={`text-lg font-bold ${valueEdgePositive ? 'text-green-400' : 'text-red-400'}`}>
                    {valueEdgePositive ? '+' : ''}{p.value_edge}%
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {p.ai_analysis && (
              <div className="bg-surface rounded-2xl border border-surface-light p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white">Analyse du match</h2>
                </div>
                <p className="text-text-secondary leading-relaxed">{p.ai_analysis}</p>
              </div>
            )}

            {/* Form */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-white">Forme récente</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary font-medium">{p.home_team}</span>
                  {p.home_form && <FormBadge form={p.home_form} />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary font-medium">{p.away_team}</span>
                  {p.away_form && <FormBadge form={p.away_form} />}
                </div>
              </div>
              <p className="text-xs text-text-muted mt-4">W = Victoire · D = Nul · L = Défaite (5 derniers matchs)</p>
            </div>
          </div>

          {/* Right — Bookmakers + Related */}
          <div className="space-y-6">
            {/* Bookmaker CTA */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <h2 className="text-base font-bold text-white">Parier sur ce match</h2>
              </div>
              <p className="text-sm text-text-muted mb-4">Ouvrez un compte optimisé pour profiter de cotes boostées</p>
              <div className="space-y-3">
                {BOOKMAKERS.map((bm) => (
                  <a
                    key={bm.name}
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-surface-light hover:bg-white/10 rounded-xl p-3 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Image src={bm.logo} alt={bm.name} width={32} height={32} className="object-contain" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{bm.name}</div>
                      <div className="text-xs text-green-400">{bm.bonus}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-surface-light">
                <Link href="/compte-optimise-ia">
                  <Button className="w-full" size="sm" variant="gradient">
                    Compte Optimisé IA →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-surface-light rounded-xl p-4 flex items-start gap-3">
              <Shield className="h-4 w-4 text-text-muted flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted leading-relaxed">
                Les pronostics sont fournis à titre indicatif. Pariez de manière responsable. Les paris sportifs comportent des risques.
              </p>
            </div>

            {/* Related matches */}
            {related && related.length > 0 && (
              <div className="bg-surface rounded-2xl border border-surface-light p-6">
                <h2 className="text-base font-bold text-white mb-4">Autres pronostics · {p.league}</h2>
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/pronostic/${r.slug}`}
                      className="block bg-surface-light hover:bg-white/10 rounded-xl p-3 transition-colors"
                    >
                      <div className="text-sm font-medium text-white">{r.home_team} vs {r.away_team}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primary">{r.prediction}</span>
                        <span className="text-xs text-text-muted">· Cote {r.recommended_odds?.toFixed(2)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-[#00D4FF]/10 border-t border-primary/20">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Accédez à tous les pronostics IA
          </h2>
          <p className="text-text-secondary mb-6">
            Ouvrez un compte bookmaker optimisé et recevez le ticket du jour généré par notre algorithme.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/compte-optimise-ia">
              <Button size="lg" variant="gradient">
                Créer mon compte optimisé IA
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/generate">
              <Button size="lg" variant="outline">
                Générer un ticket maintenant
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600; // ISR: revalidate every hour
