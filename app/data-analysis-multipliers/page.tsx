import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Brain,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Activity,
  Target,
  Layers,
  RefreshCw,
  DollarSign,
  Percent,
  Clock,
  CheckCircle2,
  Zap,
  BookOpen,
} from 'lucide-react';
import { TerminalIAWidget } from '@/components/landing/TerminalIAWidget';
import { FloatingIACTA } from '@/components/landing/FloatingIACTA';
import { GainsNotification } from '@/components/landing/GainsNotification';
import { MobileMagicCopy } from '@/components/landing/MobileMagicCopy';

// ─── Config ────────────────────────────────────────────────────────────────────

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

const CURRENT_YEAR = new Date().getFullYear();

// ─── SEO Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `Analyse des Tendances Multiplicateurs par IA — Data Visualization | AlgoPronos ${CURRENT_YEAR}`,
  description:
    "Guide analytique complet sur la visualisation des données historiques des jeux à multiplicateurs (Crash, Apple of Fortune). Cycles statistiques, Money Management rigoureux, et intégration du code AlgoPronos pour un cashback mensuel.",
  keywords: [
    'analyse multiplicateurs 1xbet',
    'tendances crash game statistiques',
    'apple of fortune analyse données',
    'visualisation historique tirages',
    'cycles statistiques multiplicateurs',
    'money management crash game',
    'gestion bankroll jeux haute fréquence',
    'data science paris sportifs',
    'algorithme analyse multiplicateurs',
    'cashback 1xbet code algopronos',
    '1xgames analyse ia',
    'stratégie crash 1xbet données',
    'analyse probabilité apple of fortune',
    'jeu responsable data science',
    'algopronos data analysis',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/data-analysis-multipliers',
  },
  openGraph: {
    title: `Analyse des Tendances Multiplicateurs IA — Crash & Apple of Fortune | AlgoPronos`,
    description:
      "Transformez votre approche des jeux à multiplicateurs grâce à la Data Science. Cycles statistiques, Money Management et cashback mensuel via le code AlgoPronos.",
    url: 'https://algopronos.com/data-analysis-multipliers',
    siteName: 'AlgoPronos AI',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analyse des Tendances Multiplicateurs par IA | AlgoPronos',
    description:
      'Données, cycles statistiques et Money Management pour les jeux à multiplicateurs. Code AlgoPronos = cashback mensuel.',
  },
};

// ─── JSON-LD Structured Data ───────────────────────────────────────────────────

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: "Analyse des Tendances Multiplicateurs par Intelligence Artificielle",
  description:
    "Guide technique sur la visualisation et l'analyse des données historiques des jeux à multiplicateurs (Crash, Apple of Fortune) pour une approche rationnelle et responsable.",
  author: { '@type': 'Organization', name: 'AlgoPronos AI', url: 'https://algopronos.com' },
  publisher: {
    '@type': 'Organization',
    name: 'AlgoPronos AI',
    logo: {
      '@type': 'ImageObject',
      url: 'https://algopronos.com/logo-premium.png',
      width: '512',
      height: '512',
      caption: 'AlgoPronos AI Logo',
    },
  },
  datePublished: `${CURRENT_YEAR}-01-01`,
  dateModified: new Date().toISOString().split('T')[0],
  url: 'https://algopronos.com/data-analysis-multipliers',
  about: [
    { '@type': 'Thing', name: 'Analyse de données' },
    { '@type': 'Thing', name: 'Jeux à multiplicateurs' },
    { '@type': 'Thing', name: 'Money Management' },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Data Analysis', item: 'https://algopronos.com/data-analysis-multipliers' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Comment l'IA analyse-t-elle les tendances des jeux à multiplicateurs ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "L'algorithme AlgoPronos collecte les données historiques de tirages publics (Crash, Apple of Fortune et autres flux live) et applique des techniques de visualisation statistique pour identifier les distributions de fréquence, les cycles d'apparition et les écarts à la moyenne théorique. Ces analyses ne permettent pas de prédire le prochain résultat (les RNG certifiés sont indépendants), mais éclairent la structure probabiliste du jeu.",
      },
    },
    {
      '@type': 'Question',
      name: "Qu'est-ce que le Money Management pour les jeux à haute fréquence ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Le Money Management rigoureux pour les jeux à haute fréquence (Crash, Apple of Fortune) consiste à définir : 1) un budget de session fixe (1-2% du bankroll total), 2) un objectif de gain journalier (+20-30%), 3) un stop-loss absolu (-50% de la session). Sans ces règles, la haute fréquence des tirages crée un biais cognitif (gambler's fallacy) qui entraîne des surenchères compensatoires — le principal facteur de perte.",
      },
    },
    {
      '@type': 'Question',
      name: "Qu'est-ce que le code AlgoPronos garantit comme cashback ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Le code promo AlgoPronos active le programme de cashback mensuel chez nos partenaires : selon votre niveau d'activité (volume de mises et résultats nets), vous recevez un remboursement partiel chaque mois. Le niveau Starter offre un cashback de base, le niveau Pro un cashback majoré, et le niveau Elite un cashback premium. Ce système est structuré pour réduire l'impact statistique des pertes sur le long terme.",
      },
    },
    {
      '@type': 'Question',
      name: "Apple of Fortune et Crash sont-ils des jeux prévisibles statistiquement ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Non. Ces jeux utilisent des générateurs de nombres aléatoires (RNG) cryptographiquement sécurisés et certifiés indépendants. Chaque tirage est un événement statistiquement indépendant. L'analyse des tendances permet de comprendre la distribution des résultats passés et les marges opérateur (RTP), mais ne confère aucun avantage prédictif sur les tirages futurs. L'approche rationnelle consiste à comprendre cette limite et à gérer son exposition financière en conséquence.",
      },
    },
    {
      '@type': 'Question',
      name: "Comment visualiser l'historique des tirages Crash ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Les flux live affichent l'historique récent des multiplicateurs Crash directement dans l'interface. Pour une analyse plus approfondie, AlgoPronos compile ces données publiques et génère des visualisations (histogrammes de distribution, courbes de fréquence cumulée, heat maps temporelles) accessibles via le dashboard Compte Optimisé IA créé avec le code AlgoPronos.",
      },
    },
  ],
};

// ─── Money Management Rules ────────────────────────────────────────────────────

const MM_RULES = [
  {
    icon: DollarSign,
    color: 'text-primary',
    bg: 'bg-primary/10',
    title: 'Règle du 1-2% de Bankroll',
    description:
      "Chaque session ne doit pas dépasser 1 à 2% de votre bankroll total. Si votre budget total est de 10 000 FCFA, votre mise maximale par session est de 100–200 FCFA. Cette règle préserve la longévité statistique.",
    formula: 'Mise session = Bankroll × 0,01',
  },
  {
    icon: Target,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    title: 'Objectif de gain journalier (+20–30%)',
    description:
      "Fixez un objectif de gain réaliste par session (20–30% de la mise initiale). Atteint cet objectif ? Arrêtez immédiatement. La continuité post-objectif expose au biais de récupération des gains.",
    formula: 'Take Profit = Mise × 1,25',
  },
  {
    icon: AlertTriangle,
    color: 'text-error',
    bg: 'bg-error/10',
    title: 'Stop-Loss absolu (-50% de la session)',
    description:
      "Un stop-loss de 50% sur la mise de session est non négociable. Perdre 50% de votre mise de session déclenche l'arrêt immédiat. Aucune mise de rattrapage — le gambler's fallacy est un piège cognitif documenté.",
    formula: 'Stop Loss = -Mise × 0,50',
  },
  {
    icon: Clock,
    color: 'text-accent',
    bg: 'bg-accent/10',
    title: 'Limite temporelle de session (max 30 min)',
    description:
      "La haute fréquence des jeux comme Crash (1 tirage toutes les 30–60 secondes) crée un état de flow décisionnel dégradé après 20–30 minutes. Limitez vos sessions à 30 minutes maximum pour maintenir la lucidité analytique.",
    formula: 'Session max = 30 minutes',
  },
];

// ─── Visualisation AI Features ─────────────────────────────────────────────────

const VIZ_FEATURES = [
  {
    icon: BarChart3,
    title: 'Histogramme de Distribution des Multiplicateurs',
    description:
      "Représentation graphique de la fréquence d'apparition de chaque tranche de multiplicateur (x1–x2, x2–x5, x5–x10, x10+) sur les 1 000 derniers tirages. Permet de visualiser l'écart entre la distribution observée et la distribution théorique attendue selon le RTP déclaré.",
  },
  {
    icon: TrendingUp,
    title: 'Courbe de Tendance Glissante',
    description:
      "Calcul de la moyenne mobile sur 50, 100 et 200 tirages. Cette visualisation révèle les phases de régression vers la moyenne — un concept clé pour comprendre que les séries de valeurs extrêmes (très hauts ou très bas multiplicateurs) sont statistiquement transitoires.",
  },
  {
    icon: Activity,
    title: 'Heat Map Temporelle des Tirages',
    description:
      "Cartographie des multiplicateurs par plage horaire et par jour de la semaine. Bien que les RNG soient indépendants de l'heure, cette visualisation documente empiriquement l'absence de cycles temporels — renforçant une approche rationnelle désengagée des croyances de timing.",
  },
  {
    icon: Percent,
    title: 'Analyse de la Marge Opérateur (House Edge)',
    description:
      "Calcul du RTP (Return to Player) empirique à partir des données historiques et comparaison avec le RTP théorique déclaré par le partenaire. Cette transparence quantitative permet à l'utilisateur de comprendre la structure économique du jeu avant de s'y engager.",
  },
];

// ─── Cashback Tiers ────────────────────────────────────────────────────────────

const CASHBACK_TIERS = [
  {
    level: 'Starter',
    color: 'border-primary/30 bg-primary/5',
    titleColor: 'text-primary',
    cashback: '5%',
    condition: 'Volume mensuel < 50 000 FCFA',
    features: ['Cashback sur pertes nettes mensuelles', 'Versement en fin de mois', 'Accès outils analyse de base'],
  },
  {
    level: 'Pro',
    color: 'border-secondary/40 bg-secondary/5 ring-1 ring-secondary/20',
    titleColor: 'text-secondary',
    cashback: '10%',
    condition: 'Volume mensuel 50 000–200 000 FCFA',
    features: ['Cashback majoré sur pertes nettes', 'Dashboard analytics avancé', 'Rapports de distribution hebdomadaires', 'Alertes statistiques personnalisées'],
    recommended: true,
  },
  {
    level: 'Elite',
    color: 'border-accent/30 bg-accent/5',
    titleColor: 'text-accent',
    cashback: '15%',
    condition: 'Volume mensuel > 200 000 FCFA',
    features: ['Cashback premium toutes pertes', 'Analyse de portefeuille complète', 'Rapport mensuel personnalisé', 'Accès prioritaire nouveaux outils', 'Support analytique dédié'],
  },
];

// ─── 1xGames Section ───────────────────────────────────────────────────────────

const GAMES_INFO = [
  {
    name: 'Crash',
    icon: '📈',
    color: 'border-primary/30',
    description:
      "Un multiplicateur croissant décolle depuis x1.00 et peut crasher à tout moment. Le joueur doit encaisser avant le crash. Distribution typique : 50% des tirages crashent avant x2, ~30% entre x2 et x5, ~20% dépassent x5.",
    rtp: '97%',
    frequency: '~1 tirage / 30 sec',
    variance: 'Très haute',
    keyMetric: "Probabilité crash < x2 : ~50%",
  },
  {
    name: 'Apple of Fortune',
    icon: '🍎',
    color: 'border-secondary/30',
    description:
      "Jeu de secteurs où une roue détermine un multiplicateur (x2 à x1000). La distribution des probabilités par secteur est fixe et publique. L'analyse statistique permet de vérifier empiriquement la conformité des tirages au RTP théorique.",
    rtp: '96–97%',
    frequency: '~1 tirage / 20 sec',
    variance: 'Extrême (queue lourde)',
    keyMetric: "Secteur x2 : ~45% de probabilité",
  },
];

// ─── Page Component ────────────────────────────────────────────────────────────

export default function DataAnalysisMultipliersPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Header />

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary rounded-full blur-[130px] animate-blob" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-secondary rounded-full blur-[130px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-accent rounded-full blur-[130px] animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-xs text-text-muted mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Data Analysis · Multiplicateurs</span>
          </nav>

          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            <BarChart3 className="h-3 w-3 mr-1" /> Silo Data Science · AlgoPronos
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Analyse des Tendances{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Multiplicateurs par IA
            </span>
          </h1>

          <p className="text-lg text-text-secondary mb-4 max-w-3xl mx-auto leading-relaxed">
            Comment l&apos;Intelligence Artificielle visualise l&apos;historique des tirages publics
            (Crash, Apple of Fortune et flux live) pour identifier les cycles statistiques, comprendre
            les marges opérateur et structurer un Money Management rigoureux.
          </p>

          <p className="text-sm text-text-muted mb-8 max-w-2xl mx-auto">
            Approche académique · Données quantitatives · Jeu responsable · Code{' '}
            <strong className="text-primary">{PROMO_CODE}</strong> = cashback mensuel garanti
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-5 mb-10 text-sm text-text-muted">
            {[
              { icon: Brain, text: 'Analyse algorithmique' },
              { icon: Shield, text: 'Jeu 100% responsable' },
              { icon: BarChart3, text: 'Données historiques publiques' },
              { icon: RefreshCw, text: 'Cashback mensuel' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/redirect?url=${encodeURIComponent(AFFILIATE_URL)}&bookmaker=1xBet`}>
              <Button variant="gradient" size="lg">
                <Zap className="mr-2 h-5 w-5" />
                Créer mon Compte Optimisé IA
              </Button>
            </Link>
            <Link href="/dashboard/generate">
              <Button variant="outline" size="lg">
                Accéder au générateur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TERMINAL IA WIDGET ─────────────────────────────────────────────── */}
      <section className="py-8 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-green-400 text-xs font-mono font-medium">
              Analyse du flux live en temps réel...
            </span>
          </div>
          <TerminalIAWidget />
        </div>
      </section>

      {/* ─── INTRO ACADÉMIQUE ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex items-start gap-4 bg-background border border-primary/20 rounded-2xl p-6 mb-8">
              <BookOpen className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Prérequis épistémologique</h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  L&apos;analyse des tendances dans les jeux à multiplicateurs repose sur un postulat
                  fondamental : les résultats passés ne conditionnent <strong className="text-white">pas</strong> les
                  résultats futurs (indépendance stochastique des tirages RNG). L&apos;objectif de la
                  Data Science n&apos;est pas de &quot;prédire&quot; le prochain tirage — c&apos;est
                  <strong className="text-white"> impossible</strong> — mais de quantifier les
                  paramètres de la distribution (RTP, variance, fréquence) pour calibrer une
                  gestion du risque rationnelle.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Pourquoi visualiser les données de multiplicateurs ?
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Les jeux à multiplicateurs — notamment <strong className="text-white">Crash</strong> et{' '}
                <strong className="text-white">Apple of Fortune</strong> disponibles sur la plateforme
                1xGames de 1xBet — génèrent un volume massif de données publiques. Chaque tirage
                constitue un point de données structuré (multiplicateur final, durée, horodatage) qui,
                agrégé sur plusieurs milliers d&apos;itérations, révèle la structure probabiliste sous-jacente
                du jeu.
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                L&apos;Intelligence Artificielle d&apos;AlgoPronos traite ces flux de données en temps réel
                pour produire des visualisations statistiques accessibles : distributions de fréquence,
                analyse des queues de distribution, cartographie temporelle des variances. Ces outils
                transforment le parieur émotionnel en un{' '}
                <strong className="text-white">utilisateur rationnel de données</strong>.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 1xGames : Crash & Apple of Fortune ──────────────────────────────── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">1xGames — Jeux Analysés</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Structure probabiliste des multiplicateurs pro
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Comprendre les mécanismes statistiques de Crash et Apple of Fortune est la première
                étape d&apos;une approche data-driven. Voici les paramètres quantitatifs clés.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {GAMES_INFO.map((game, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className={`bg-surface border ${game.color} rounded-2xl p-6 h-full`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{game.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{game.name}</h3>
                      <span className="text-xs text-text-muted">1xGames · 1xBet</span>
                    </div>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed mb-5">{game.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'RTP théorique', value: game.rtp },
                      { label: 'Fréquence', value: game.frequency },
                      { label: 'Variance', value: game.variance },
                      { label: 'Métrique clé', value: game.keyMetric },
                    ].map((stat, j) => (
                      <div key={j} className="bg-background rounded-xl p-3">
                        <div className="text-xs text-text-muted mb-1">{stat.label}</div>
                        <div className="text-sm font-semibold text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-xs text-text-secondary">
                    <strong className="text-primary">Note analytique :</strong> L&apos;espérance mathématique
                    par unité misée est strictement négative (= RTP − 1). Toute stratégie rentable
                    à long terme est statistiquement impossible sans avantage structurel (cashback).
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OUTILS DE VISUALISATION IA ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-secondary border-secondary/30">
                <Brain className="h-3 w-3 mr-1" /> Outils IA de Visualisation
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Comment l&apos;IA visualise l&apos;historique des tirages
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                AlgoPronos déploie quatre modules analytiques pour transformer les données brutes
                de tirages en insights statistiques actionnables.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-5">
            {VIZ_FEATURES.map((feat, i) => (
              <ScrollReveal key={i} delay={(i % 2) * 0.1}>
                <div className="bg-background border border-surface-light rounded-2xl p-6 hover:border-primary/30 transition-colors h-full">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feat.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Visual explainer — pseudo-histogram */}
          <ScrollReveal delay={0.2}>
            <div className="mt-8 bg-background border border-surface-light rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-white">Distribution théorique illustrative — Crash (RTP 97%)</h3>
              </div>
              <div className="flex items-end gap-2 h-28 mb-3">
                {[
                  { label: 'x1–1.5', pct: 40, color: 'bg-error' },
                  { label: 'x1.5–2', pct: 22, color: 'bg-accent' },
                  { label: 'x2–3', pct: 16, color: 'bg-secondary' },
                  { label: 'x3–5', pct: 10, color: 'bg-primary' },
                  { label: 'x5–10', pct: 7, color: 'bg-primary/70' },
                  { label: 'x10–50', pct: 4, color: 'bg-primary/40' },
                  { label: 'x50+', pct: 1, color: 'bg-primary/20' },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="text-xs text-text-muted">{bar.pct}%</span>
                    <div
                      className={`w-full ${bar.color} rounded-t-md`}
                      style={{ height: `${bar.pct * 2}px` }}
                    />
                    <span className="text-xs text-text-muted text-center leading-tight">{bar.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                * Distribution illustrative basée sur les paramètres théoriques. Les données réelles
                peuvent varier selon le volume d&apos;échantillon. Source : modélisation AlgoPronos AI.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── MONEY MANAGEMENT ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-error border-error/30">
                <AlertTriangle className="h-3 w-3 mr-1" /> Module Money Management
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Gestion rigoureuse du capital pour jeux à haute fréquence
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                La haute fréquence des tirages est le principal vecteur de risque psychologique.
                Ces quatre règles quantitatives constituent le framework de Money Management
                recommandé par AlgoPronos pour tout utilisateur des jeux à multiplicateurs.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {MM_RULES.map((rule, i) => (
              <ScrollReveal key={i} delay={(i % 2) * 0.1}>
                <div className="bg-surface border border-surface-light rounded-2xl p-6 h-full hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-11 h-11 ${rule.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <rule.icon className={`h-5 w-5 ${rule.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{rule.title}</h3>
                      <code className={`text-xs font-mono ${rule.color} mt-1 block`}>{rule.formula}</code>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{rule.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Gambler's fallacy callout */}
          <ScrollReveal delay={0.2}>
            <div className="bg-error/5 border border-error/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white mb-2">Biais cognitif documenté : le Gambler&apos;s Fallacy</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-3">
                    Le Gambler&apos;s Fallacy (ou erreur du joueur) est la croyance erronée selon laquelle
                    une série de résultats similaires passés (ex : 10 crashes &lt; x2 consécutifs) augmente
                    la probabilité d&apos;un résultat opposé futur. Cette croyance est statistiquement fausse
                    pour tout processus RNG indépendant.
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    La réponse comportementale correcte face à une série défavorable est{' '}
                    <strong className="text-white">l&apos;application stricte du stop-loss</strong> —
                    non l&apos;augmentation des mises. Les outils de visualisation AlgoPronos documentent
                    ces séries pour renforcer la conscience de cette indépendance.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── COMPTE OPTIMISÉ IA + CASHBACK ───────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-accent border-accent/30">
                <RefreshCw className="h-3 w-3 mr-1" /> Code {PROMO_CODE} · Cashback Mensuel
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Le cashback : seul avantage structurel accessible au joueur
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Face à une espérance mathématique négative inhérente à tout jeu de casino,
                le cashback mensuel lié au code <strong className="text-white">{PROMO_CODE}</strong>{' '}
                constitue le seul mécanisme permettant de réduire concrètement la marge opérateur
                effective sur votre bankroll.
              </p>
            </div>
          </ScrollReveal>

          {/* Cashback formula explainer */}
          <ScrollReveal delay={0.1}>
            <div className="bg-background border border-accent/20 rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent" />
                Modélisation de l&apos;impact du cashback sur le RTP effectif
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Pour un jeu avec un RTP théorique de 97% (House Edge = 3%), chaque 10 000 FCFA
                misées génèrent en moyenne une perte de 300 FCFA. Avec un cashback de 10%
                sur les pertes nettes mensuelles, cette perte effective est réduite :
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'House Edge brut', value: '3%', color: 'text-error' },
                  { label: 'Cashback 10% sur pertes', value: '+0,30%', color: 'text-accent' },
                  { label: 'House Edge effectif', value: '~2,7%', color: 'text-primary' },
                ].map((item, i) => (
                  <div key={i} className="bg-surface rounded-xl p-4 text-center border border-surface-light">
                    <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
                    <div className="text-xs text-text-muted">{item.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-4">
                * Calcul illustratif. Le cashback réel dépend du volume mensuel et du niveau atteint.
                Il ne modifie pas les probabilités de tirage, uniquement le rendement net sur capital engagé.
              </p>
            </div>
          </ScrollReveal>

          {/* Cashback tiers */}
          <div className="grid md:grid-cols-3 gap-5">
            {CASHBACK_TIERS.map((tier, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className={`border rounded-2xl p-6 h-full ${tier.color} ${tier.recommended ? 'shadow-lg shadow-secondary/10' : ''}`}>
                  {tier.recommended && (
                    <div className="bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      Niveau recommandé
                    </div>
                  )}
                  <div className={`text-3xl font-bold ${tier.titleColor} mb-1`}>{tier.cashback}</div>
                  <div className="text-sm font-bold text-white mb-1">Niveau {tier.level}</div>
                  <div className="text-xs text-text-muted mb-4">{tier.condition}</div>
                  <ul className="space-y-2">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-text-secondary">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ENTONNOIR DE CONVERSION ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4">Activation en 3 étapes</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Synchroniser vos outils d&apos;analyse avec votre compte partenaire
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Le <strong className="text-white">Compte Optimisé IA</strong> via le code{' '}
                <strong className="text-primary">{PROMO_CODE}</strong> est la configuration qui
                permet d&apos;activer l&apos;ensemble des outils analytiques AlgoPronos sur votre
                compte partenaire — incluant les modules de visualisation multiplicateurs et le cashback.
              </p>
            </div>
          </ScrollReveal>

          <ol className="space-y-4 mb-10">
            {[
              {
                n: '1',
                color: 'from-primary to-primary/50',
                title: `Copiez le code ${PROMO_CODE} et ouvrez votre compte partenaire`,
                desc: `Utilisez notre lien partenaire et saisissez le code ${PROMO_CODE} lors de l'inscription. Ce code active simultanément le bonus de bienvenue et le statut Compte Optimisé IA.`,
              },
              {
                n: '2',
                color: 'from-secondary to-secondary/50',
                title: 'Accédez au dashboard analytics AlgoPronos',
                desc: "Connectez-vous sur AlgoPronos.com. Le dashboard de visualisation des multiplicateurs est automatiquement activé pour votre compte. Explorez les historiques Crash et Apple of Fortune.",
              },
              {
                n: '3',
                color: 'from-accent to-accent/50',
                title: 'Appliquez le framework Money Management + recevez votre cashback',
                desc: "Configurez vos règles de bankroll dans le module Money Management. En fin de mois, votre cashback est calculé selon votre niveau d'activité et versé automatiquement.",
              },
            ].map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <li className="flex gap-5 bg-surface border border-surface-light rounded-2xl p-5 hover:border-primary/30 transition-colors">
                  <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                    {step.n}
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                  </div>
                </li>
              </ScrollReveal>
            ))}
          </ol>

          <ScrollReveal delay={0.3}>
            <div className="text-center">
              <Link href={`/redirect?url=${encodeURIComponent(AFFILIATE_URL)}&bookmaker=Partenaire`}>
                <Button variant="gradient" size="lg" className="mr-4">
                  <Zap className="mr-2 h-5 w-5" />
                  Créer mon Compte Optimisé IA — Code {PROMO_CODE}
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Questions fréquentes — Analyse des Multiplicateurs
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {faqJsonLd.mainEntity.map((item, i) => (
              <details
                key={i}
                className="group bg-background border border-surface-light rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="font-semibold text-white pr-4 text-left text-sm">{item.name}</h3>
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-text-secondary leading-relaxed text-sm">{item.acceptedAnswer.text}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              Du parieur émotionnel à l&apos;utilisateur de données rationnel
            </h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto">
              Créez votre Compte Optimisé IA avec le code{' '}
              <strong className="text-primary">{PROMO_CODE}</strong> pour accéder aux outils
              de visualisation, au module Money Management et au cashback mensuel structuré.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gradient" size="lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Activer le code {PROMO_CODE}
                </Button>
              </a>
              <Link href="/probability-optimization-models">
                <Button variant="outline" size="lg">
                  Modèles de probabilités
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-text-muted mt-6">
              18+ · Jouez responsable · AlgoPronos ne garantit pas les gains · Les jeux comportent des risques financiers.
              L&apos;analyse statistique ne confère pas d&apos;avantage prédictif sur les tirages RNG.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <Footer />

      {/* ─── FLOATING UX LAYERS ──────────────────────────────────────────────── */}
      <FloatingIACTA affiliateUrl={AFFILIATE_URL} promoCode={PROMO_CODE} />
      <GainsNotification />
      <MobileMagicCopy affiliateUrl={AFFILIATE_URL} promoCode={PROMO_CODE} />
    </main>
  );
}
