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
  Brain,
  CheckCircle2,
  Lock,
  Rocket,
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

            {/* ── Mid-article CTA — Compte Optimisé IA (conversion principale) ── */}
            <div className="rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-primary/10 border border-primary/30">
              {/* Header badge */}
              <div className="bg-gradient-to-r from-primary to-secondary px-6 py-3 flex items-center gap-3">
                <Brain className="h-5 w-5 text-white shrink-0" />
                <span className="text-white text-xs font-black uppercase tracking-widest">
                  Compte Optimisé IA — AlgoPronos × 1xBet
                </span>
                <span className="ml-auto text-[10px] font-black text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                  100% GRATUIT
                </span>
              </div>

              <div className="bg-gradient-to-br from-primary/15 to-secondary/10 p-6">
                <h3 className="text-xl font-black text-white mb-2 leading-tight">
                  C'est quoi le Compte Optimisé IA ?
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-5">
                  C'est un compte 1xBet créé via AlgoPronos avec le code{' '}
                  <span className="font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">ALGOPRONOS</span>.
                  Il synchronise votre compte bookmaker avec notre algorithme IA — vous recevez
                  chaque jour le ticket optimal, les value bets détectés et les analyses xG.
                  C'est le seul système qui combine un compte bookmaker et une IA exclusive dès
                  l'inscription.
                </p>

                {/* Benefits grid */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { icon: Zap,          text: 'Ticket IA quotidien' },
                    { icon: TrendingUp,   text: 'Value bets détectés' },
                    { icon: Brain,        text: 'Analyses xG en temps réel' },
                    { icon: Star,         text: 'Bonus majoré 200%' },
                    { icon: CheckCircle2, text: 'Gratuit — sans abonnement' },
                    { icon: Lock,         text: 'Code ALGOPRONOS obligatoire' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-text-secondary">
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="gradient"
                    className="flex-1 h-12 font-black text-sm uppercase tracking-wider rounded-xl gap-2 shadow-xl shadow-primary/20"
                    asChild
                  >
                    <Link href="/compte-optimise-ia">
                      <Rocket className="h-4 w-4" />
                      Créer mon Compte Optimisé IA
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-5 font-bold text-xs uppercase tracking-wider rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    asChild
                  >
                    <Link href="/">
                      <Zap className="h-4 w-4" />
                      Ticket IA gratuit
                    </Link>
                  </Button>
                </div>
                <p className="text-[10px] text-text-muted text-center mt-3 italic">
                  Saisissez le code ALGOPRONOS lors de votre inscription 1xBet pour activer l'optimisation IA.
                </p>
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

            {/* ── 1. Compte Optimisé IA — CTA principal sticky ── */}
            <div className="bg-surface rounded-2xl border border-primary/30 overflow-hidden shadow-2xl shadow-primary/10 lg:sticky lg:top-6">
              <div className="bg-gradient-to-r from-primary to-secondary px-4 py-2.5 flex items-center gap-2">
                <Brain className="h-4 w-4 text-white shrink-0" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest flex-1">
                  Compte Optimisé IA
                </span>
                <span className="text-[9px] font-black text-white/80 bg-white/15 px-2 py-0.5 rounded-full">GRATUIT</span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-black text-white mb-1 leading-snug">
                  Accédez à l'IA AlgoPronos
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Créez votre compte 1xBet avec le code{' '}
                  <span className="font-mono font-black text-primary">ALGOPRONOS</span> et
                  débloquez : ticket IA quotidien, value bets, analyses xG — le tout gratuitement.
                </p>

                {/* Mini benefits */}
                <ul className="space-y-1.5 mb-5">
                  {[
                    'Ticket IA chaque jour',
                    'Value bets détectés auto',
                    'Bonus 200% à l\'inscription',
                    '100% gratuit, sans abonnement',
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-[11px] text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="gradient"
                  className="w-full h-12 font-black text-xs uppercase tracking-wider rounded-xl gap-2 shadow-xl shadow-primary/20"
                  asChild
                >
                  <Link href="/compte-optimise-ia">
                    <Rocket className="h-4 w-4" />
                    Créer mon Compte IA
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-9 mt-2 font-bold text-[11px] uppercase tracking-wide rounded-xl gap-2 border-white/10 text-text-muted hover:text-primary hover:border-primary/30"
                  asChild
                >
                  <Link href={BOOKMAKER_URL} target="_blank" rel="noopener noreferrer">
                    Ou ouvrir 1xBet directement
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* ── 2. Ticket IA du jour ── */}
            <div className="bg-gradient-to-br from-primary/15 to-secondary/5 rounded-2xl border border-primary/20 p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-primary fill-primary/20" />
                <h3 className="text-sm font-bold text-white">Ticket IA du jour</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Générez gratuitement votre combiné optimisé par l'algorithme pour les matchs du jour.
              </p>
              <Button variant="gradient" className="w-full h-10 font-black text-xs uppercase tracking-wide rounded-xl gap-2" asChild>
                <Link href="/">
                  <Zap className="h-4 w-4" />
                  Mon ticket gratuit
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
