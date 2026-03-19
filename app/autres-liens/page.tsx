import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { MobileMagicCopy } from '@/components/landing/MobileMagicCopy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Home,
  Zap,
  BarChart3,
  Brain,
  Shield,
  Globe,
  BookOpen,
  Tag,
  Trophy,
  Users,
  Sigma,
  TrendingUp,
  Map,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Tous les Liens AlgoPronos — Plan du Site & Pages SEO | AlgoPronos AI',
  description:
    "Plan complet du site AlgoPronos AI : pages principales, outils IA, codes promo 1xBet par pays, guides Data Science, analyses multiplicateurs, modèles probabilistes et accès rapide à tous les contenus.",
  keywords: [
    'plan du site algopronos',
    'tous les liens algopronos',
    'pages algopronos ai',
    'sitemap algopronos',
    'liens 1xbet afrique',
    'pages data science algopronos',
  ].join(', '),
  alternates: { canonical: 'https://algopronos.com/autres-liens' },
  openGraph: {
    title: 'Plan du Site — Tous les Liens AlgoPronos AI',
    description: "Accédez à l'ensemble des pages et outils AlgoPronos AI : pronostics, comptes optimisés, codes promo 1xBet, analyses data science et bien plus.",
    url: 'https://algopronos.com/autres-liens',
    siteName: 'AlgoPronos AI',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Autres Liens', item: 'https://algopronos.com/autres-liens' },
  ],
};

const siteNavJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SiteNavigationElement',
  name: 'Plan du site AlgoPronos AI',
  url: 'https://algopronos.com/autres-liens',
};

// ─── Link sections ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'principales',
    icon: Home,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    borderColor: 'border-primary/25',
    headerBg: 'bg-primary/5',
    title: 'Pages Principales',
    badge: 'Essentiels',
    badgeColor: 'bg-primary/15 text-primary border-primary/30',
    links: [
      { label: 'Accueil AlgoPronos AI',          href: '/',                      desc: 'Page d\'accueil — Générateur IA & ticket du jour', hot: true },
      { label: 'Pronostics du jour',             href: '/pronostics',            desc: 'Tous les pronostics IA disponibles aujourd\'hui' },
      { label: 'Matchs du jour',                 href: '/matchs',               desc: 'Calendrier complet des matchs analysés par l\'IA' },
      { label: 'Grandes Affiches',               href: '/grandes-affiches',     desc: 'Sélection hebdomadaire des meilleures affiches' },
      { label: 'Classement des utilisateurs',   href: '/classement',           desc: 'Tableau de classement des meilleurs parieurs IA' },
      { label: 'Historique des tickets',         href: '/historique',           desc: 'Résultats et historique public de tous les tickets' },
    ],
  },
  {
    id: 'outils-ia',
    icon: Brain,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
    borderColor: 'border-secondary/25',
    headerBg: 'bg-secondary/5',
    title: 'Outils IA & Compte',
    badge: 'IA Exclusive',
    badgeColor: 'bg-secondary/15 text-secondary border-secondary/30',
    links: [
      { label: 'Compte Optimisé IA',             href: '/compte-optimise-ia',    desc: 'Créer votre compte bookmaker reconnu par l\'algorithme IA', hot: true },
      { label: 'Générateur de tickets IA',       href: '/dashboard/generate',   desc: 'Générer votre combiné optimisé personnalisé' },
      { label: 'Vérificateur de compte',         href: '/verificateur-compte',  desc: 'Vérifier si votre compte est Optimisé IA' },
      { label: 'Essai gratuit',                  href: '/try-free',             desc: 'Tester AlgoPronos AI sans inscription' },
      { label: 'Accès VIP',                      href: '/unlock-vip',           desc: 'Débloquer les fonctionnalités premium' },
      { label: 'Connexion',                      href: '/login',                desc: 'Se connecter à votre compte AlgoPronos' },
    ],
  },
  {
    id: 'data-science',
    icon: Sigma,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    borderColor: 'border-purple-500/25',
    headerBg: 'bg-purple-500/5',
    title: 'Data Science & Visualisation',
    badge: 'Nouveau',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    links: [
      { label: 'Analyse des Tendances Multiplicateurs', href: '/data-analysis-multipliers',      desc: 'Visualisation IA des données Crash & Apple of Fortune — Cycles statistiques & Money Management', hot: true },
      { label: 'Optimisation des Probabilités de Tirage', href: '/probability-optimization-models', desc: 'Loi de Poisson, distribution normale, RTP — Modèles quantitatifs appliqués aux jeux 1xBet', hot: true },
    ],
  },
  {
    id: 'code-promo',
    icon: Tag,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
    borderColor: 'border-accent/25',
    headerBg: 'bg-accent/5',
    title: 'Codes Promo 1xBet',
    badge: 'AlgoPronos',
    badgeColor: 'bg-accent/15 text-accent border-accent/30',
    links: [
      { label: 'Code Promo 1xBet Afrique',           href: '/code-promo-1xbet',              desc: 'Code ALGOPRONOS — Bonus 200% + Compte Optimisé IA', hot: true },
      { label: 'Code Promo 1xBet Bénin, CI, Sénégal', href: '/code-promo-1xbet-benin-ci-sn', desc: 'Guide spécifique Afrique de l\'Ouest — Bénin, Côte d\'Ivoire, Sénégal' },
      { label: 'Ancien Code Promo 1xBet',            href: '/ancien-code-promo-1xbet',       desc: 'Archives & comparatif des anciens codes promo 1xBet' },
      { label: 'Retrait 1xBet Orange Money',         href: '/retrait-1xbet-orange-money',    desc: 'Guide complet retrait 1xBet via Orange Money en Afrique' },
    ],
  },
  {
    id: '1xbet-pays',
    icon: Globe,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    borderColor: 'border-primary/20',
    headerBg: 'bg-primary/3',
    title: '1xBet par Pays — Afrique',
    badge: '12 pays',
    badgeColor: 'bg-primary/15 text-primary border-primary/30',
    links: [
      { label: '1xBet Bénin',           href: '/1xbet/benin',          desc: 'Code promo & guide 1xBet au Bénin' },
      { label: '1xBet Côte d\'Ivoire',  href: '/1xbet/cote-divoire',   desc: 'Code promo & guide 1xBet en Côte d\'Ivoire' },
      { label: '1xBet Sénégal',         href: '/1xbet/senegal',        desc: 'Code promo & guide 1xBet au Sénégal' },
      { label: '1xBet Cameroun',        href: '/1xbet/cameroun',       desc: 'Code promo & guide 1xBet au Cameroun' },
      { label: '1xBet Mali',            href: '/1xbet/mali',           desc: 'Code promo & guide 1xBet au Mali' },
      { label: '1xBet Togo',            href: '/1xbet/togo',           desc: 'Code promo & guide 1xBet au Togo' },
      { label: '1xBet Burkina Faso',    href: '/1xbet/burkina-faso',   desc: 'Code promo & guide 1xBet au Burkina Faso' },
      { label: '1xBet Niger',           href: '/1xbet/niger',          desc: 'Code promo & guide 1xBet au Niger' },
      { label: '1xBet Congo',           href: '/1xbet/congo',          desc: 'Code promo & guide 1xBet au Congo' },
      { label: '1xBet Gabon',           href: '/1xbet/gabon',          desc: 'Code promo & guide 1xBet au Gabon' },
      { label: '1xBet Guinée',          href: '/1xbet/guinee',         desc: 'Code promo & guide 1xBet en Guinée' },
      { label: '1xBet Madagascar',      href: '/1xbet/madagascar',     desc: 'Code promo & guide 1xBet à Madagascar' },
    ],
  },
  {
    id: 'guides',
    icon: BookOpen,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
    borderColor: 'border-secondary/20',
    headerBg: 'bg-secondary/3',
    title: 'Guides & Ressources SEO',
    badge: 'Articles',
    badgeColor: 'bg-secondary/15 text-secondary border-secondary/30',
    links: [
      { label: 'Algorithme Pronostic Football',  href: '/algorithme-pronostic-foot', desc: 'Comment fonctionne l\'algorithme de pronostic football AlgoPronos' },
      { label: 'Avis AlgoPronos',               href: '/avis-algopronos',            desc: 'Avis & témoignages utilisateurs — Analyse indépendante' },
    ],
  },
  {
    id: 'stats',
    icon: TrendingUp,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    borderColor: 'border-success/20',
    headerBg: 'bg-success/3',
    title: 'Statistiques & Performance',
    badge: 'Live',
    badgeColor: 'bg-success/15 text-success border-success/30',
    links: [
      { label: 'Classement Public',     href: '/classement',          desc: 'Classement en temps réel des utilisateurs et tickets AlgoPronos' },
      { label: 'Grandes Affiches',      href: '/grandes-affiches',    desc: 'Analyses détaillées des affiches phares de la semaine' },
    ],
  },
] as const;

// ─── Page ──────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

export default async function AutresLiensPage() {
  let latestPredictions: { slug: string; home_team: string; away_team: string; league: string; match_date: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('match_predictions')
      .select('slug, home_team, away_team, league, match_date')
      .order('match_date', { ascending: false })
      .limit(100);
    latestPredictions = data || [];
  } catch { /* build without env vars — ISR will populate on first request */ }

  const totalLinks = SECTIONS.reduce((acc, s) => acc + s.links.length, 0) + (latestPredictions?.length || 0);

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavJsonLd) }} />

      <Header />

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-secondary rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-text-muted mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Autres Liens</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <Badge variant="outline" className="mb-3 text-text-muted border-surface-light">
                <Map className="h-3 w-3 mr-1" /> Plan du site
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Tous les liens{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
                  AlgoPronos AI
                </span>
              </h1>
              <p className="text-text-secondary">
                {totalLinks} pages disponibles · Accès rapide à l&apos;ensemble du contenu
                de la plateforme, organisé par catégorie.
              </p>
            </div>

            {/* Bouton retour accueil */}
            <Link href="/" className="shrink-0">
              <Button variant="gradient" size="lg" className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Retour à l&apos;Accueil
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── QUICK STATS ─────────────────────────────────────────────────────── */}
      <section className="pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BarChart3, label: 'Pages SEO',    value: `${totalLinks}`,  color: 'text-primary' },
              { icon: Globe,     label: 'Pays couverts', value: '12',            color: 'text-secondary' },
              { icon: Sigma,     label: 'Data Science', value: '2',              color: 'text-purple-400' },
              { icon: Tag,       label: 'Codes promo',  value: '4',              color: 'text-accent' },
            ].map((s, i) => (
              <div key={i} className="bg-surface border border-surface-light rounded-2xl px-4 py-3 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
                <div>
                  <div className={`text-lg font-bold ${s.color} leading-tight`}>{s.value}</div>
                  <div className="text-xs text-text-muted">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LINK SECTIONS ───────────────────────────────────────────────────── */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ─── DYNAMIC PRONOSTICS SECTIONS ─────────────────────────────────── */}
          {latestPredictions && latestPredictions.length > 0 && (
            <div className="border border-primary/25 rounded-2xl overflow-hidden">
              <div className="bg-primary/5 border-b border-primary/25 px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-white text-sm">Derniers Pronostics IA Générés</h2>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-primary/15 text-primary border-primary/30">
                  Nouveaux
                </span>
                <span className="text-xs text-text-muted">
                  {latestPredictions.length} liens
                </span>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-light/20">
                {latestPredictions.map((pred) => (
                  <Link
                    key={pred.slug}
                    href={`/pronostic/${pred.slug}`}
                    className="group bg-background hover:bg-surface transition-colors px-4 py-3 flex items-start gap-2"
                  >
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-white group-hover:text-primary transition-colors block truncate">
                        {pred.home_team} vs {pred.away_team}
                      </span>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {pred.league} · {new Date(pred.match_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {SECTIONS.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className={`border ${section.borderColor} rounded-2xl overflow-hidden`}
            >
              {/* Section header */}
              <div className={`${section.headerBg} border-b ${section.borderColor} px-5 py-4 flex items-center gap-3`}>
                <div className={`w-9 h-9 ${section.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                  <section.icon className={`h-4 w-4 ${section.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-white text-sm">{section.title}</h2>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${section.badgeColor}`}>
                  {section.badge}
                </span>
                <span className="text-xs text-text-muted">
                  {section.links.length} lien{section.links.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Links grid */}
              <div className="grid sm:grid-cols-2 gap-px bg-surface-light/30">
                {section.links.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    className="group bg-background hover:bg-surface transition-colors px-5 py-4 flex items-start gap-3"
                  >
                    <ChevronRight className={`h-4 w-4 ${section.iconColor} shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                          {link.label}
                        </span>
                        {'hot' in link && link.hot && (
                          <span className="text-[10px] font-bold bg-primary/15 text-primary border border-primary/25 rounded-full px-1.5 py-0.5 shrink-0">
                            ★ Populaire
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">
                        {link.desc}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-text-muted group-hover:text-primary shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION NAV RAPIDE ──────────────────────────────────────────────── */}
      <section className="py-8 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
            Navigation rapide par catégorie
          </h2>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${section.badgeColor} hover:opacity-80 transition-opacity`}
              >
                <section.icon className="h-3 w-3" />
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-secondary/6 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Prêt à utiliser AlgoPronos AI ?
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Créez votre Compte Optimisé IA ou générez votre premier ticket directement
            depuis l&apos;accueil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="gradient" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Retour à l&apos;Accueil AlgoPronos
              </Button>
            </Link>
            <Link href="/compte-optimise-ia">
              <Button variant="outline" size="lg">
                <Zap className="mr-2 h-4 w-4" />
                Compte Optimisé IA
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Back link arrow style */}
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Retourner sur algopronos.com
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      {/* ─── MOBILE MAGIC COPY ──────────────────────────────────────────────── */}
      <MobileMagicCopy affiliateUrl={AFFILIATE_URL} promoCode={PROMO_CODE} />
    </main>
  );
}
