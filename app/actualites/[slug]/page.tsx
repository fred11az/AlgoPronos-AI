import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  ChevronRight,
  Clock,
  User,
  Tag,
  ArrowRight,
  Zap,
  Trophy,
  TrendingUp,
  Star,
  Newspaper,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { worldCupMatches, formatWorldCupDate } from '@/lib/worldcup2026';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  published_at: string;
  category: string;
  tags: string[];
  author: string;
  cover_image: string | null;
}

// ─── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('news_articles')
    .select('title, summary, category, tags, published_at, author')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!data) {
    return { title: 'Article — AlgoPronos' };
  }

  const description =
    data.summary ||
    `${data.category} — Analyse AlgoPronos sur la Coupe du Monde 2026. Pronostics IA, value bets et statistiques.`;

  return {
    title: `${data.title} | AlgoPronos`,
    description,
    keywords: [
      ...(data.tags ?? []).map((t: string) => t.toLowerCase()),
      'coupe du monde 2026',
      'pronostic mondial 2026',
      'analyse ia football',
      'algopronos',
    ].join(', '),
    authors: [{ name: data.author }],
    alternates: {
      canonical: `https://algopronos.com/actualites/${slug}`,
    },
    openGraph: {
      title: data.title,
      description,
      type: 'article',
      url: `https://algopronos.com/actualites/${slug}`,
      publishedTime: data.published_at,
      authors: [data.author],
      tags: data.tags ?? [],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const CATEGORY_STYLES: Record<string, string> = {
  'Présentation':     'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'Groupes':          'text-primary bg-primary/10 border-primary/20',
  'Analyse IA':       'text-secondary bg-secondary/10 border-secondary/20',
  'Résultats':        'text-rose-400 bg-rose-400/10 border-rose-400/20',
  'Infos pratiques':  'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Afrique':          'text-green-400 bg-green-400/10 border-green-400/20',
  'Stratégie':        'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Actualités':       'text-text-muted bg-surface-light border-white/10',
};

const BOOKMAKER_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

// Pick 3 related WC matches for the sidebar (based on article tags)
function getRelatedMatches(tags: string[]): typeof worldCupMatches {
  const normalized = tags.map((t) => t.toLowerCase());
  const scored = worldCupMatches.map((m) => {
    const score = [m.homeTeam, m.awayTeam, `Groupe ${m.group}`].filter((label) =>
      normalized.some((t) => label.toLowerCase().includes(t) || t.includes(label.toLowerCase()))
    ).length;
    return { match: m, score };
  });
  const sorted = scored.sort((a, b) => b.score - a.score);
  return sorted.slice(0, 3).map((s) => s.match);
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!article) notFound();

  const a = article as Article;

  // Related articles (same category, excluding this one)
  const { data: related } = await supabase
    .from('news_articles')
    .select('id, title, slug, summary, category, published_at')
    .eq('status', 'published')
    .eq('category', a.category)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(3);

  const relatedMatches = getRelatedMatches(a.tags ?? []);
  const minutes = readingTime(a.content ?? a.summary ?? '');
  const categoryStyle = CATEGORY_STYLES[a.category] ?? CATEGORY_STYLES['Actualités'];

  // JSON-LD — NewsArticle schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.summary ?? '',
    datePublished: a.published_at,
    dateModified: a.published_at,
    author: { '@type': 'Organization', name: a.author, url: 'https://algopronos.com' },
    publisher: {
      '@type': 'Organization',
      name: 'AlgoPronos AI',
      url: 'https://algopronos.com',
      logo: { '@type': 'ImageObject', url: 'https://algopronos.com/logo-premium.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://algopronos.com/actualites/${slug}` },
    keywords: (a.tags ?? []).join(', '),
    articleSection: a.category,
    url: `https://algopronos.com/actualites/${slug}`,
  };

  // Render paragraphs (blank-line separated)
  const paragraphs = (a.content ?? '').split(/\n\n+/).filter(Boolean);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/actualites" className="hover:text-white transition-colors">Actualités</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-secondary truncate max-w-[200px]">{a.title}</span>
        </nav>
      </div>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Article — Main Column ── */}
          <article className="lg:col-span-2">

            {/* Hero card */}
            <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden shadow-xl mb-8">
              <div className="bg-gradient-to-r from-amber-600/15 to-primary/10 px-6 py-4 border-b border-amber-500/10 flex items-center justify-between flex-wrap gap-2">
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${categoryStyle}`}>
                  {a.category}
                </span>
                <div className="flex items-center gap-4 text-[10px] text-text-muted font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {formatDate(a.published_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {a.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Newspaper className="h-3 w-3" />
                    {minutes} min de lecture
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight mb-4">
                  {a.title}
                </h1>
                {a.summary && (
                  <p className="text-lg text-text-secondary leading-relaxed font-medium italic border-l-2 border-primary/30 pl-5">
                    {a.summary}
                  </p>
                )}
              </div>
            </div>

            {/* ── Article Content ── */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6 md:p-10 shadow-lg mb-8">
              {paragraphs.length > 0 ? (
                <div className="space-y-5">
                  {paragraphs.map((para, i) => {
                    // Detect "N. Title:" pattern → render as subheading
                    const headingMatch = para.match(/^(\d+\.\s+.+?)(?:\s*:|\s*—)/);
                    if (headingMatch && para.length < 80) {
                      return (
                        <h2 key={i} className="text-lg font-black text-white pt-2">
                          {para}
                        </h2>
                      );
                    }
                    return (
                      <p key={i} className="text-text-secondary leading-relaxed text-base">
                        {para}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-muted italic">Contenu bientôt disponible.</p>
              )}
            </div>

            {/* ── Mid-article CTA (conversion) ── */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl border border-primary/30 p-6 mb-8 shadow-lg shadow-primary/5">
              <div className="flex items-start gap-4">
                <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/30 shrink-0">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-white mb-1">
                    Générez votre ticket IA pour la Coupe du Monde 2026
                  </h3>
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    Notre algorithme analyse en temps réel les cotes et statistiques pour identifier les meilleurs value bets du Mondial 2026.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="gradient" className="h-10 px-5 font-black text-xs uppercase tracking-wider rounded-xl gap-2 shadow-md shadow-primary/20" asChild>
                      <Link href="/">
                        <Zap className="h-4 w-4" />
                        Ticket IA gratuit
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-10 px-5 font-bold text-xs uppercase tracking-wider rounded-xl gap-2 border-white/20 hover:border-primary/30" asChild>
                      <Link href={BOOKMAKER_URL} target="_blank" rel="noopener noreferrer">
                        Parier sur 1xBet
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {a.tags && a.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-8">
                <Tag className="h-4 w-4 text-text-muted shrink-0" />
                {a.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] text-text-secondary bg-surface-light px-2.5 py-1 rounded-lg border border-white/5 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Related articles */}
            {related && related.length > 0 && (
              <div className="bg-surface rounded-2xl border border-surface-light p-6 shadow-lg">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  Articles similaires
                </h2>
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/actualites/${r.slug}`}
                      className="flex items-center justify-between bg-surface-light/30 hover:bg-white/5 rounded-xl p-4 border border-white/5 group transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                          {r.title}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {r.category} · {new Date(r.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back link */}
            <div className="mt-6">
              <Link
                href="/actualites"
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Toutes les actualités
              </Link>
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">

            {/* 1xBet CTA */}
            <div className="bg-surface rounded-2xl border border-surface-light p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">1xBet — Bonus 200%</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Profitez des meilleures cotes sur tous les matchs de la Coupe du Monde 2026. Code ALGO à l'inscription.
              </p>
              <Button variant="gradient" className="w-full h-11 font-black text-xs uppercase tracking-wide rounded-xl gap-2 shadow-lg shadow-primary/20" asChild>
                <Link href={BOOKMAKER_URL} target="_blank" rel="noopener noreferrer">
                  Ouvrir 1xBet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Ticket IA CTA */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl border border-primary/30 p-6 shadow-lg">
              <Zap className="h-7 w-7 text-primary fill-primary/20 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">Ticket IA Mondial 2026</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Algorithme IA : value bets, cotes optimisées, analyse xG sur chaque match du Mondial.
              </p>
              <Button variant="gradient" className="w-full h-11 font-black text-xs uppercase tracking-wide rounded-xl gap-2" asChild>
                <Link href="/">
                  <Zap className="h-4 w-4" />
                  Générer mon ticket
                </Link>
              </Button>
            </div>

            {/* Related WC matches */}
            {relatedMatches.length > 0 && (
              <div className="bg-surface rounded-2xl border border-surface-light p-6 shadow-lg">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Matchs à parier
                </h3>
                <div className="space-y-3">
                  {relatedMatches.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/coupe-du-monde-2026/${m.slug}`}
                      className="block bg-surface-light/30 hover:bg-white/5 rounded-xl p-3 border border-white/5 group transition-colors"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                        {m.homeTeam} vs {m.awayTeam}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1">
                        Groupe {m.group} · {formatWorldCupDate(m.date)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All WC matches link */}
            <div className="bg-surface rounded-2xl border border-surface-light p-5 text-center shadow-lg">
              <Trophy className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white mb-3">Tous les matchs du Mondial 2026</p>
              <Button variant="outline" className="w-full h-10 font-bold text-xs uppercase tracking-wide rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2" asChild>
                <Link href="/coupe-du-monde-2026">
                  <Trophy className="h-4 w-4" />
                  Voir le programme
                </Link>
              </Button>
            </div>

          </aside>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600;
