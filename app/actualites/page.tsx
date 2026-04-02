import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Newspaper,
  Trophy,
  Calendar,
  ChevronRight,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { worldCupMatches, formatWorldCupDate } from '@/lib/worldcup2026';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  published_at: string;
  category: string;
  tags: string[];
  author: string;
}

// ─── Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Actualités Coupe du Monde 2026 — Analyse IA Football | AlgoPronos',
  description:
    'Toutes les actualités de la Coupe du Monde 2026 : analyses IA, pronostics, résultats, classements groupes. Suivez le Mondial 2026 avec AlgoPronos.',
  keywords: [
    'actualites coupe du monde 2026',
    'news mondial 2026',
    'coupe du monde 2026 actualite',
    'resultats coupe du monde 2026',
    'classement groupe mondial 2026',
    'analyse mondial 2026',
    'pronostic mondial 2026',
    'algopronos mondial 2026',
    'coupe du monde 2026 aujourd hui',
    'news football coupe du monde 2026',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/actualites',
  },
  openGraph: {
    title: 'Actualités Coupe du Monde 2026 | AlgoPronos',
    description: 'Analyses IA quotidiennes, résultats et pronostics pour le Mondial 2026.',
    type: 'website',
    url: 'https://algopronos.com/actualites',
  },
};

// ─── Static news articles (hardcoded, will be replaced/augmented from DB) ──

const STATIC_ARTICLES: NewsItem[] = [
  {
    id: 'wc2026-presentation',
    title: 'Coupe du Monde 2026 : tout ce qu\'il faut savoir avant le coup d\'envoi',
    slug: 'coupe-du-monde-2026-presentation',
    summary:
      '48 équipes, 3 pays hôtes, 104 matchs. La Coupe du Monde 2026 s\'annonce comme la plus grande de l\'histoire du football. AlgoPronos analyse les favoris, les outsiders et les groupes.',
    content: '',
    published_at: '2026-04-02T10:00:00Z',
    category: 'Présentation',
    tags: ['Mondial 2026', 'Présentation', 'Favoris'],
    author: 'AlgoPronos AI',
  },
  {
    id: 'wc2026-groupe-e',
    title: 'Groupe E : Argentine vs France, le remake de la finale 2022',
    slug: 'groupe-e-argentine-france-mondial-2026',
    summary:
      'Le tirage au sort a placé l\'Argentine et la France dans le même groupe ! Un remake de la finale 2022 dès la phase de groupes. Notre IA analyse les chances de qualification.',
    content: '',
    published_at: '2026-04-01T14:00:00Z',
    category: 'Groupes',
    tags: ['Groupe E', 'Argentine', 'France', 'Analyse'],
    author: 'AlgoPronos AI',
  },
  {
    id: 'wc2026-favoris-2026',
    title: 'Analyse IA : les 5 favoris pour remporter la Coupe du Monde 2026',
    slug: 'favoris-coupe-du-monde-2026-analyse-ia',
    summary:
      'Notre algorithme analyse les cotes, les performances récentes et les compositions d\'équipe pour identifier les 5 nations les plus susceptibles de soulever le trophée à New York.',
    content: '',
    published_at: '2026-03-30T09:00:00Z',
    category: 'Analyse IA',
    tags: ['Favoris', 'Analyse IA', 'France', 'Argentine', 'Brésil'],
    author: 'AlgoPronos AI',
  },
  {
    id: 'wc2026-villes-hotes',
    title: 'Les 16 stades hôtes de la Coupe du Monde 2026 : guide complet',
    slug: 'stades-villes-hotes-coupe-du-monde-2026',
    summary:
      'De Los Angeles à Toronto en passant par Mexico et New York, découvrez les 16 stades qui accueilleront la Coupe du Monde 2026. Capacités, villes, ambiances attendues.',
    content: '',
    published_at: '2026-03-28T11:00:00Z',
    category: 'Infos pratiques',
    tags: ['Stades', 'Villes hôtes', 'USA', 'Canada', 'Mexique'],
    author: 'AlgoPronos AI',
  },
  {
    id: 'wc2026-afrique',
    title: 'Coupe du Monde 2026 : les équipes africaines en force',
    slug: 'equipes-africaines-coupe-du-monde-2026',
    summary:
      'Le Maroc, le Nigéria, le Sénégal, la Côte d\'Ivoire, l\'Égypte, le Ghana et le Kenya représentent l\'Afrique. Analyse de leurs chances et de leurs matchs clés.',
    content: '',
    published_at: '2026-03-25T16:00:00Z',
    category: 'Afrique',
    tags: ['Afrique', 'Maroc', 'Nigeria', 'Sénégal', 'Analyse'],
    author: 'AlgoPronos AI',
  },
  {
    id: 'wc2026-value-bets',
    title: 'Meilleurs value bets pour la phase de groupes — stratégie IA',
    slug: 'meilleurs-value-bets-phase-groupes-mondial-2026',
    summary:
      'Notre algorithme IA identifie les meilleures opportunités de value betting pour la phase de groupes de la Coupe du Monde 2026. Cotes sous-estimées, outsiders à surveiller.',
    content: '',
    published_at: '2026-03-22T13:00:00Z',
    category: 'Stratégie',
    tags: ['Value Betting', 'Stratégie IA', 'Phase de groupes', 'Cotes'],
    author: 'AlgoPronos AI',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Présentation': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'Groupes': 'text-primary bg-primary/10 border-primary/20',
  'Analyse IA': 'text-secondary bg-secondary/10 border-secondary/20',
  'Infos pratiques': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Afrique': 'text-green-400 bg-green-400/10 border-green-400/20',
  'Stratégie': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Résultats': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

function formatArticleDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Get upcoming WC matches (next 7 days from today)
function getUpcomingMatches() {
  const today = new Date('2026-04-02');
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 70); // show upcoming matches in the next 70 days before WC starts
  return worldCupMatches
    .filter((m) => {
      const d = new Date(m.date);
      return d >= today && d <= in7Days;
    })
    .slice(0, 5);
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ActualitesPage() {
  // Try to fetch news from Supabase (table: news_articles) — graceful fallback
  let dbArticles: NewsItem[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('news_articles')
      .select('id, title, slug, summary, published_at, category, tags, author')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);
    if (data && data.length > 0) {
      dbArticles = data as NewsItem[];
    }
  } catch {
    // table may not exist yet — use static articles
  }

  const articles = dbArticles.length > 0 ? dbArticles : STATIC_ARTICLES;
  const upcomingMatches = getUpcomingMatches();

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Actualités Coupe du Monde 2026 — AlgoPronos',
    description: 'Analyses IA quotidiennes sur la Coupe du Monde 2026',
    url: 'https://algopronos.com/actualites',
    publisher: { '@type': 'Organization', name: 'AlgoPronos AI', url: 'https://algopronos.com' },
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Actualités</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-br from-amber-600/15 to-primary/10 rounded-2xl border border-amber-500/20 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Newspaper className="h-48 w-48 text-amber-400" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
              <Newspaper className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-amber-400 font-bold text-sm uppercase tracking-widest">Live Blog</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tighter mb-3">
            Actualités<br />
            <span className="text-amber-400">Coupe du Monde 2026</span>
          </h1>
          <p className="text-text-secondary max-w-xl leading-relaxed">
            Analyses IA, résultats, classements et pronostics — suivez le Mondial 2026 chaque jour avec AlgoPronos. Mis à jour quotidiennement.
          </p>
          <div className="flex gap-3 mt-6">
            <Link href="/coupe-du-monde-2026">
              <Button variant="outline" className="h-10 px-5 font-bold text-xs uppercase tracking-wide rounded-xl gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <Trophy className="h-4 w-4" />
                Tous les matchs
              </Button>
            </Link>
            <Link href="/">
              <Button variant="gradient" className="h-10 px-5 font-bold text-xs uppercase tracking-wide rounded-xl gap-2">
                <Zap className="h-4 w-4" />
                Ticket IA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Articles — Main column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Articles & Analyses
              </h2>
              <span className="text-xs text-text-muted font-bold bg-surface-light px-3 py-1 rounded-full border border-white/5">
                {articles.length} articles
              </span>
            </div>

            {articles.map((article, i) => (
              <article
                key={article.id}
                className={`bg-surface rounded-2xl border border-surface-light overflow-hidden shadow-lg hover:border-primary/20 transition-colors group ${
                  i === 0 ? 'ring-1 ring-amber-500/20' : ''
                }`}
              >
                {i === 0 && (
                  <div className="bg-amber-500/10 px-4 py-1.5 border-b border-amber-500/10 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">
                      Article à la une
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      CATEGORY_COLORS[article.category] || 'text-text-muted bg-surface-light border-white/10'
                    }`}>
                      {article.category}
                    </span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatArticleDate(article.published_at)}
                    </span>
                  </div>
                  <Link href={`/actualites/${article.slug}`}>
                    <h3 className="text-lg font-bold text-white leading-snug mb-2 group-hover:text-primary transition-colors cursor-pointer">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {article.summary}
                  </p>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-text-muted bg-surface-light px-2 py-0.5 rounded border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">Par {article.author}</span>
                    <Link
                      href={`/actualites/${article.slug}`}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      Lire l'article
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prochains matchs WC */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6 shadow-lg">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                Prochains matchs Mondial 2026
              </h3>
              {upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <Link
                      key={match.slug}
                      href={`/coupe-du-monde-2026/${match.slug}`}
                      className="block bg-surface-light/30 hover:bg-white/5 rounded-xl p-3 border border-white/5 group transition-colors"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1">
                        Groupe {match.group} · {formatWorldCupDate(match.date)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {worldCupMatches.slice(0, 5).map((match) => (
                    <Link
                      key={match.slug}
                      href={`/coupe-du-monde-2026/${match.slug}`}
                      className="block bg-surface-light/30 hover:bg-white/5 rounded-xl p-3 border border-white/5 group transition-colors"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1">
                        Groupe {match.group} · {formatWorldCupDate(match.date)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/coupe-du-monde-2026" className="block mt-4">
                <Button variant="outline" className="w-full h-9 text-xs font-bold uppercase tracking-wide rounded-xl border-white/10 hover:border-amber-500/30 hover:text-amber-400">
                  Tous les matchs
                </Button>
              </Link>
            </div>

            {/* Ticket IA CTA */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl border border-primary/30 p-6 shadow-lg">
              <Zap className="h-8 w-8 text-primary fill-primary/20 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">Ticket IA Gratuit</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Générez votre ticket de paris optimisé par IA pour le Mondial 2026. Analyse value betting en temps réel.
              </p>
              <Link href="/">
                <Button variant="gradient" className="w-full h-11 font-black text-xs uppercase tracking-wide rounded-xl gap-2 shadow-lg shadow-primary/20">
                  <Zap className="h-4 w-4" />
                  Générer mon ticket
                </Button>
              </Link>
            </div>

            {/* Categories */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6 shadow-lg">
              <h3 className="text-base font-bold text-white mb-4">Catégories</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CATEGORY_COLORS).map((cat) => (
                  <span
                    key={cat}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-default ${CATEGORY_COLORS[cat]}`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600; // refresh hourly — articles update daily
