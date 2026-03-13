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
  Activity,
  Target,
  Layers,
  Sigma,
  FlaskConical,
  BookOpen,
  CheckCircle2,
  Zap,
  RefreshCw,
  DollarSign,
  Cpu,
  GitBranch,
  Info,
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
  title: `Optimisation des Probabilités de Tirage — Modèles Statistiques IA | AlgoPronos ${CURRENT_YEAR}`,
  description:
    "Guide technique sur l'application des modèles de probabilités (Loi de Poisson, distribution normale) pour comprendre les marges opérateur dans les jeux 1xBet. Compte Optimisé IA AlgoPronos : synchronisation des outils d'analyse externe et cashback mensuel.",
  keywords: [
    'probabilité tirage 1xbet',
    'loi de poisson paris sportifs',
    'distribution normale multiplicateurs',
    'modèles statistiques jeux casino',
    'marge opérateur RTP analyse',
    'house edge calcul probabiliste',
    'optimisation probabilité tirage',
    'modèle probabiliste crash game',
    'statistiques apple of fortune',
    'compte optimisé ia synchronisation',
    'algorithme analyse probabiliste',
    'data science jeux hasard',
    'algopronos modèle probabilité',
    'cashback 1xbet affiliation',
    'jeu responsable modèles quantitatifs',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/probability-optimization-models',
  },
  openGraph: {
    title: `Optimisation des Probabilités de Tirage par IA | AlgoPronos — Modèles Quantitatifs`,
    description:
      "Application des modèles de probabilités (Poisson, distribution normale) pour comprendre les marges opérateur 1xBet. Compte Optimisé IA et synchronisation des outils d'analyse.",
    url: 'https://algopronos.com/probability-optimization-models',
    siteName: 'AlgoPronos AI',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Modèles de Probabilités pour Jeux de Tirage — AlgoPronos IA',
    description:
      "Loi de Poisson, distribution normale, RTP : comprendre les marges opérateur 1xBet avec les outils quantitatifs AlgoPronos.",
  },
};

// ─── JSON-LD Structured Data ───────────────────────────────────────────────────

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: "Optimisation des Probabilités de Tirage — Application des Modèles Statistiques",
  description:
    "Guide technique sur l'application de la Loi de Poisson et de la distribution normale pour analyser les probabilités de tirage dans les jeux à multiplicateurs 1xBet et comprendre les marges opérateur.",
  author: { '@type': 'Organization', name: 'AlgoPronos AI', url: 'https://algopronos.com' },
  publisher: {
    '@type': 'Organization',
    name: 'AlgoPronos AI',
    logo: { '@type': 'ImageObject', url: 'https://algopronos.com/favicon.svg' },
  },
  datePublished: `${CURRENT_YEAR}-01-01`,
  dateModified: new Date().toISOString().split('T')[0],
  url: 'https://algopronos.com/probability-optimization-models',
  about: [
    { '@type': 'Thing', name: 'Probabilités' },
    { '@type': 'Thing', name: 'Loi de Poisson' },
    { '@type': 'Thing', name: 'Distribution normale' },
    { '@type': 'Thing', name: 'Modèles statistiques' },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Probability Models', item: 'https://algopronos.com/probability-optimization-models' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Comment la Loi de Poisson s'applique-t-elle aux jeux à multiplicateurs ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "La Loi de Poisson modélise la probabilité d'observer un nombre donné d'événements rares dans un intervalle fixe. Dans le contexte des jeux à multiplicateurs, elle permet d'estimer la fréquence d'apparition de multiplicateurs élevés (ex : x10+) sur N tirages, et de quantifier statistiquement l'écart entre la fréquence observée et la fréquence théorique attendue selon le RTP déclaré par l'opérateur.",
      },
    },
    {
      '@type': 'Question',
      name: "Qu'est-ce que la distribution normale appliquée aux tirages ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "La distribution normale (courbe en cloche de Gauss) décrit comment les résultats de tirage se concentrent autour d'une moyenne avec une dispersion mesurable (écart-type). Pour les jeux de casino, elle permet de calculer les intervalles de confiance autour du résultat attendu théorique sur N tirages, confirmant que toute session individuelle peut s'écarter significativement de la moyenne long terme — ce qui ne valide pas les stratégies de martingale.",
      },
    },
    {
      '@type': 'Question',
      name: "Comment AlgoPronos calcule-t-il la marge de l'opérateur (House Edge) ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "AlgoPronos collecte les données historiques de tirages publics et calcule empiriquement le RTP (Return to Player) = somme des gains distribués / somme des mises totales sur l'échantillon. La House Edge = 1 - RTP. Ce calcul empirique est ensuite comparé au RTP théorique déclaré pour vérifier la conformité. Sur des échantillons suffisamment larges (>10 000 tirages), les deux valeurs doivent converger (loi des grands nombres).",
      },
    },
    {
      '@type': 'Question',
      name: "Qu'est-ce que le Compte Optimisé IA et comment synchronise-t-il les outils d'analyse ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Le Compte Optimisé IA est un compte 1xBet créé via AlgoPronos avec le code ALGOPRONOS. Cette configuration active la synchronisation entre votre compte bookmaker et l'ensemble des outils analytiques AlgoPronos : modules de visualisation probabiliste, calculateurs de RTP empirique, simulateurs de distribution, alertes de variance et rapports mensuels. Les données de votre activité (volume, résultats nets) alimentent le calcul du cashback mensuel.",
      },
    },
    {
      '@type': 'Question',
      name: "Peut-on battre la marge opérateur avec des modèles statistiques ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Non. Les modèles statistiques ne permettent pas de battre une House Edge positive sur les jeux RNG (hasard pur). La valeur des modèles probabilistes réside dans : 1) la compréhension objective de l'espérance négative, 2) le calibrage rationnel de l'exposition financière, 3) la détection d'anomalies statistiques dans les données historiques. L'unique avantage structurel accessible au joueur reste le cashback (remboursement partiel des pertes) activé via le code ALGOPRONOS.",
      },
    },
    {
      '@type': 'Question',
      name: "Comment fonctionne le modèle d'affiliation AlgoPronos ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "AlgoPronos opère comme affilié officiel de 1xBet. Lorsqu'un utilisateur crée un compte via notre lien partenaire avec le code ALGOPRONOS, 1xBet verse une commission à AlgoPronos sur le volume généré. Cette commission finance les outils analytiques gratuits offerts aux utilisateurs et le programme de cashback mensuel. Le modèle est transparent : AlgoPronos est rémunéré par 1xBet, pas par les utilisateurs.",
      },
    },
  ],
};

// ─── Probability Models Data ───────────────────────────────────────────────────

const PROBABILITY_MODELS = [
  {
    icon: FlaskConical,
    color: 'text-primary',
    bg: 'bg-primary/10',
    borderColor: 'border-primary/30',
    title: 'Loi de Poisson',
    subtitle: 'Modélisation des événements rares',
    formula: 'P(X=k) = (λᵏ × e⁻λ) / k!',
    description:
      "La Loi de Poisson modélise la probabilité d'observer exactement k occurrences d'un événement rare sur un intervalle donné, paramétré par λ (taux moyen d'occurrence). Dans le contexte des jeux à multiplicateurs, elle permet de quantifier la fréquence théorique des multiplicateurs élevés (x10+, x50+) et de détecter les écarts statistiquement significatifs dans les données historiques.",
    application: "Fréquence des multiplicateurs élevés dans Crash / Apple of Fortune",
    example: "λ = 0,05 pour x10+ → P(0 occurrences sur 20 tirages) = e⁻¹ ≈ 36,8%",
  },
  {
    icon: Activity,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    borderColor: 'border-secondary/30',
    title: 'Distribution Normale (Gaussienne)',
    subtitle: 'Convergence vers la moyenne théorique',
    formula: 'f(x) = (1/σ√2π) × e^[-(x-μ)²/2σ²]',
    description:
      "La distribution normale (courbe de Gauss) décrit la dispersion des résultats de session autour de l'espérance mathématique théorique. Elle confirme que les sessions individuelles s'écartent de la moyenne long terme selon l'écart-type σ, calculable à partir de la variance du jeu. Un écart de ±2σ représente ~95% des sessions — les résultats extrêmes sont rares mais inévitables.",
    application: "Intervalle de confiance des résultats de session et validation du RTP",
    example: "Sur 1000 tirages Crash (σ ≈ 1,8) : 95% des sessions finissent entre μ±3,6%",
  },
  {
    icon: Sigma,
    color: 'text-accent',
    bg: 'bg-accent/10',
    borderColor: 'border-accent/30',
    title: 'Espérance Mathématique et House Edge',
    subtitle: 'Quantification de la marge opérateur',
    formula: 'E[X] = Σ xᵢ × P(xᵢ) = RTP - 1 < 0',
    description:
      "L'espérance mathématique E[X] d'un jeu de casino est toujours strictement négative (RTP < 1). Pour Crash avec un RTP de 97%, E[X] = -0,03 par unité misée. Sur N mises de montant m, la perte attendue = N × m × 0,03. Ce calcul déterministe est le fondement de toute décision rationnelle de bankroll management.",
    application: "Calcul de la perte attendue sur N mises pour le dimensionnement du bankroll",
    example: "100 mises de 1000 FCFA sur Crash : perte attendue = 100 × 1000 × 0,03 = 3 000 FCFA",
  },
  {
    icon: TrendingUp,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    title: 'Loi des Grands Nombres',
    subtitle: 'Convergence empirique vers le RTP théorique',
    formula: 'RTP_empirique → RTP_théorique quand N → ∞',
    description:
      "La Loi des Grands Nombres garantit que le RTP empirique calculé sur les données historiques converge vers le RTP théorique déclaré à mesure que le nombre de tirages augmente. Cette propriété est utilisée par AlgoPronos pour valider la conformité des données de tirage avec les paramètres déclarés — une forme de contrôle qualité statistique appliqué aux données opérateur.",
    application: "Validation de la conformité RTP empirique vs. RTP déclaré sur l'historique",
    example: "Sur 10 000 tirages : écart RTP empirique/théorique devrait être < 0,5%",
  },
];

// ─── RTP Analysis Data ────────────────────────────────────────────────────────

const RTP_DATA = [
  { game: 'Crash (1xGames)', rtpTheo: '97%', houseEdge: '3%', variance: 'Très haute', sampleNeeded: '>50 000 tirages' },
  { game: 'Apple of Fortune', rtpTheo: '96-97%', houseEdge: '3-4%', variance: 'Extrême', sampleNeeded: '>100 000 tirages' },
  { game: 'Roulette Européenne', rtpTheo: '97.3%', houseEdge: '2.7%', variance: 'Modérée', sampleNeeded: '>10 000 tirages' },
  { game: 'Paris Sportifs (1xBet)', rtpTheo: '93-95%', houseEdge: '5-7%', variance: 'Variable', sampleNeeded: 'N/A (non-RNG)' },
];

// ─── AlgoPronos Sync Features ─────────────────────────────────────────────────

const SYNC_FEATURES = [
  {
    icon: Cpu,
    title: 'Moteur de calcul probabiliste',
    description: "Calcul en temps réel de l'espérance mathématique, de la variance et des intervalles de confiance pour chaque jeu actif dans votre session 1xBet.",
  },
  {
    icon: BarChart3,
    title: 'Dashboard analytique synchronisé',
    description: "Visualisations dynamiques des distributions de vos tirages historiques, comparées aux distributions théoriques. Détection automatique des écarts statistiques.",
  },
  {
    icon: Target,
    title: 'Calculateur de bankroll optimal',
    description: "Sur la base de votre RTP empirique et de la variance mesurée, calcul du dimensionnement optimal de bankroll pour atteindre vos objectifs avec une probabilité de ruine maîtrisée.",
  },
  {
    icon: GitBranch,
    title: 'Simulateur de Monte Carlo',
    description: "Simulation de 10 000 trajectoires de session pour visualiser la distribution des outcomes possibles sur vos paramètres de mise — quantifie le risque avant de jouer.",
  },
  {
    icon: RefreshCw,
    title: 'Rapport mensuel de performance',
    description: "Synthèse analytique mensuelle : RTP empirique, décomposition gain/perte, cashback calculé, comparaison aux benchmarks statistiques et recommandations d'ajustement.",
  },
  {
    icon: Layers,
    title: 'Modèle d\'affiliation transparent',
    description: "Accès au détail de votre cashback mensuel : volume comptabilisé, niveau atteint, taux applicable et montant versé. Traçabilité complète du modèle économique.",
  },
];

// ─── Affiliation Funnel Steps ──────────────────────────────────────────────────

const FUNNEL_STEPS = [
  {
    step: '01',
    color: 'from-primary to-primary/50',
    stage: 'Sensibilisation',
    title: 'Comprendre les modèles probabilistes',
    desc: "L'utilisateur découvre les fondamentaux statistiques des jeux (RTP, House Edge, variance). La Data Science remplace l'intuition — fondement de l'approche AlgoPronos.",
    cta: null,
  },
  {
    step: '02',
    color: 'from-secondary to-secondary/50',
    stage: 'Considération',
    title: 'Explorer les outils d\'analyse AlgoPronos',
    desc: "Accès gratuit aux visualisations publiques et aux calculateurs. L'utilisateur comprend la valeur des outils analytiques disponibles avec un Compte Optimisé IA.",
    cta: null,
  },
  {
    step: '03',
    color: 'from-accent to-accent/50',
    stage: 'Décision',
    title: `Créer un compte via le code ${PROMO_CODE}`,
    desc: "L'utilisateur crée son compte 1xBet via notre lien partenaire avec le code ALGOPRONOS. Activation simultanée : bonus bienvenue + Compte Optimisé IA + cashback mensuel.",
    cta: AFFILIATE_URL,
  },
  {
    step: '04',
    color: 'from-primary to-secondary',
    stage: 'Rétention',
    title: 'Utilisation continue + cashback mensuel',
    desc: "L'utilisateur exploite les outils analytiques mensuellement. Le cashback structuré réduit la House Edge effective et fidélise l'utilisateur dans une approche data-driven durable.",
    cta: null,
  },
];

// ─── Page Component ────────────────────────────────────────────────────────────

export default function ProbabilityOptimizationPage() {
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
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-secondary rounded-full blur-[130px] animate-blob" />
          <div className="absolute top-40 left-1/4 w-72 h-72 bg-primary rounded-full blur-[130px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-accent rounded-full blur-[130px] animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-xs text-text-muted mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/data-analysis-multipliers" className="hover:text-white transition-colors">Data Analysis</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Modèles Probabilistes</span>
          </nav>

          <Badge variant="outline" className="mb-4 text-secondary border-secondary/30">
            <Sigma className="h-3 w-3 mr-1" /> Silo Quantitatif · AlgoPronos
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Optimisation des{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#00D4FF]">
              Probabilités de Tirage
            </span>
          </h1>

          <p className="text-lg text-text-secondary mb-4 max-w-3xl mx-auto leading-relaxed">
            Application des modèles statistiques formels — Loi de Poisson, distribution normale,
            espérance mathématique — pour comprendre les marges opérateur 1xBet et synchroniser
            ces outils d&apos;analyse quantitative avec l&apos;expérience utilisateur via le
            Compte Optimisé IA.
          </p>

          <p className="text-sm text-text-muted mb-8 max-w-2xl mx-auto">
            Guide technique · Niveau avancé · Données quantitatives · Code{' '}
            <strong className="text-primary">{PROMO_CODE}</strong> = accès outils analytiques + cashback
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-5 mb-10 text-sm text-text-muted">
            {[
              { icon: FlaskConical, text: 'Modèles mathématiques formels' },
              { icon: Brain, text: 'IA quantitative' },
              { icon: Shield, text: 'Approche académique' },
              { icon: DollarSign, text: 'Cashback structuré' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-secondary" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gradient" size="lg">
                <Zap className="mr-2 h-5 w-5" />
                Activer le Compte Optimisé IA
              </Button>
            </a>
            <Link href="/data-analysis-multipliers">
              <Button variant="outline" size="lg">
                <BarChart3 className="mr-2 h-5 w-5" />
                Analyse des tendances
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
              Analyse du flux 1xBet en temps réel...
            </span>
          </div>
          <TerminalIAWidget />
        </div>
      </section>

      {/* ─── INTRO ACADÉMIQUE ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex items-start gap-4 bg-background border border-secondary/20 rounded-2xl p-6 mb-8">
              <BookOpen className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Cadre théorique</h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Ce guide technique s&apos;inscrit dans le cadre de la théorie des probabilités
                  appliquée aux jeux d&apos;argent. L&apos;objectif n&apos;est pas de fournir
                  une stratégie &quot;gagnante&quot; — mathématiquement impossible face à une
                  House Edge positive — mais d&apos;équiper l&apos;utilisateur d&apos;une
                  compréhension quantitative précise de la structure économique des jeux,
                  permettant une prise de décision rationnelle sur l&apos;exposition financière
                  et la gestion du risque.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Pourquoi appliquer des modèles probabilistes formels ?
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Les jeux à multiplicateurs disponibles sur 1xGames (Crash, Apple of Fortune) sont
              des processus stochastiques gouvernés par des générateurs de nombres aléatoires (RNG)
              certifiés. Leurs propriétés statistiques sont définies mathématiquement par leurs
              paramètres de distribution. L&apos;application de modèles probabilistes formels
              permet de passer d&apos;une perception subjective (&quot;je suis en chance&quot;)
              à une description objective des mécanismes sous-jacents.
            </p>
            <p className="text-text-secondary leading-relaxed">
              L&apos;algorithme AlgoPronos implémente ces modèles comme couche analytique entre
              les données brutes de tirage et l&apos;interface utilisateur —{' '}
              <strong className="text-white">transformant le bruit statistique en signal
              quantifiable</strong>. L&apos;activation via le code{' '}
              <strong className="text-primary">{PROMO_CODE}</strong> synchronise ces calculs
              avec votre compte 1xBet.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── PROBABILITY MODELS ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                <FlaskConical className="h-3 w-3 mr-1" /> Modèles Statistiques Formels
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Les 4 modèles probabilistes clés
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Chaque modèle apporte un éclairage distinct sur la structure probabiliste
                des jeux à tirages. Ensemble, ils forment le framework analytique complet
                d&apos;AlgoPronos.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-5">
            {PROBABILITY_MODELS.map((model, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className={`bg-surface border ${model.borderColor} rounded-2xl p-6 hover:shadow-lg transition-all`}>
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* Icon + header */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${model.bg} rounded-xl flex items-center justify-center mb-2`}>
                        <model.icon className={`h-6 w-6 ${model.color}`} />
                      </div>
                      <code className={`text-xs font-mono ${model.color} bg-black/30 rounded-lg px-2 py-1 block text-center whitespace-nowrap`}>
                        {model.formula}
                      </code>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">{model.title}</h3>
                        <span className="text-xs text-text-muted bg-surface-light rounded-full px-2 py-0.5">
                          {model.subtitle}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed mb-3">{model.description}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-background rounded-xl p-3 border border-surface-light">
                          <div className="text-xs text-text-muted mb-1">Application pratique</div>
                          <div className="text-sm text-white">{model.application}</div>
                        </div>
                        <div className="bg-background rounded-xl p-3 border border-surface-light">
                          <div className="text-xs text-text-muted mb-1">Exemple chiffré</div>
                          <div className="text-xs font-mono text-primary">{model.example}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RTP / HOUSE EDGE ANALYSIS ────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4 text-accent border-accent/30">
                <Target className="h-3 w-3 mr-1" /> Analyse Comparative des Marges Opérateur
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Comprendre les marges opérateur par type de jeu
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                La connaissance précise du RTP (Return to Player) et de la House Edge est le
                prérequis fondamental à toute décision d&apos;engagement financier rationnel.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-surface-light">
                    <th className="text-left p-4 text-text-muted text-sm font-medium">Jeu</th>
                    <th className="p-4 text-center text-text-muted text-sm font-medium">RTP Théorique</th>
                    <th className="p-4 text-center text-text-muted text-sm font-medium">House Edge</th>
                    <th className="p-4 text-center text-text-muted text-sm font-medium">Variance</th>
                    <th className="p-4 text-center text-text-muted text-sm font-medium hidden sm:table-cell">Échantillon requis</th>
                  </tr>
                </thead>
                <tbody>
                  {RTP_DATA.map((row, i) => (
                    <tr key={i} className={`border-b border-surface-light ${i % 2 === 0 ? 'bg-background/30' : ''}`}>
                      <td className="p-4 text-white font-medium text-sm">{row.game}</td>
                      <td className="p-4 text-center text-primary font-bold">{row.rtpTheo}</td>
                      <td className="p-4 text-center text-error font-bold">{row.houseEdge}</td>
                      <td className="p-4 text-center text-text-secondary text-sm">{row.variance}</td>
                      <td className="p-4 text-center text-text-muted text-xs hidden sm:table-cell">{row.sampleNeeded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Key insight */}
          <ScrollReveal delay={0.2}>
            <div className="bg-background border border-accent/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white mb-2">
                    Insight clé : la variance comme risque sous-estimé
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-3">
                    Un RTP de 97% semble favorable, mais la variance extrême des jeux à
                    multiplicateurs (Crash, Apple of Fortune) implique des écarts-types de session
                    très larges. Il est statistiquement probable de perdre 50–100% de la mise de
                    session sur une courte période, même avec un RTP de 97%.
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    La convergence vers le RTP théorique ne se produit qu&apos;asymptotiquement
                    (sur des dizaines de milliers de tirages). Les sessions courtes sont dominées
                    par la variance, pas par l&apos;espérance — ce qui rend le Money Management
                    (dimensionnement des mises) plus déterminant que le choix du jeu.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── COMPTE OPTIMISÉ IA — SYNCHRONISATION ────────────────────────────── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                <Cpu className="h-3 w-3 mr-1" /> Compte Optimisé IA · Configuration Exclusive
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Le Compte Optimisé IA via le code{' '}
                <span className="text-primary">{PROMO_CODE}</span>
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                La configuration <strong className="text-white">Compte Optimisé IA</strong> est
                une architecture technique spécifique qui synchronise les outils d&apos;analyse
                probabiliste d&apos;AlgoPronos avec l&apos;expérience utilisateur 1xBet —
                uniquement accessible via notre code partenaire.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {SYNC_FEATURES.map((feat, i) => (
              <ScrollReveal key={i} delay={(i % 3) * 0.08}>
                <div className="bg-surface border border-surface-light rounded-2xl p-5 h-full hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <feat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-2">{feat.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{feat.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Architecture diagram — text-based */}
          <ScrollReveal delay={0.2}>
            <div className="bg-surface border border-primary/20 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Architecture de synchronisation — Compte Optimisé IA
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-3 text-sm">
                {[
                  { node: 'Données 1xBet', desc: 'Historique tirages\nvolume activité', color: 'bg-surface-light border-surface-light' },
                  { arrow: true },
                  { node: 'Moteur AlgoPronos', desc: 'Modèles probabilistes\nVisualisations IA', color: 'bg-primary/10 border-primary/30' },
                  { arrow: true },
                  { node: 'Dashboard Utilisateur', desc: 'Analytics temps réel\nRapports mensuels', color: 'bg-secondary/10 border-secondary/30' },
                  { arrow: true },
                  { node: 'Cashback', desc: 'Calcul niveau\nVersement mensuel', color: 'bg-accent/10 border-accent/30' },
                ].map((item, i) =>
                  'arrow' in item ? (
                    <ArrowRight key={i} className="h-4 w-4 text-text-muted flex-shrink-0 rotate-90 md:rotate-0" />
                  ) : (
                    <div key={i} className={`border rounded-xl p-3 text-center flex-1 ${item.color}`}>
                      <div className="font-bold text-white text-xs mb-1">{item.node}</div>
                      <div className="text-text-muted text-xs whitespace-pre-line">{item.desc}</div>
                    </div>
                  )
                )}
              </div>
              <p className="text-xs text-text-muted mt-4 text-center">
                Flux de synchronisation activé uniquement pour les comptes créés avec le code{' '}
                <strong className="text-primary">{PROMO_CODE}</strong>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── ENTONNOIR DE CONVERSION ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Modèle d&apos;affiliation · Transparent</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                L&apos;entonnoir de conversion AlgoPronos — Architecture du modèle
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                AlgoPronos est un affilié officiel 1xBet. Notre modèle économique est
                transparent : les outils analytiques et le cashback sont financés par la
                commission d&apos;affiliation — vous ne payez rien.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-4 mb-10">
            {FUNNEL_STEPS.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="flex gap-4 items-start bg-background border border-surface-light rounded-2xl p-5 hover:border-primary/20 transition-colors">
                  <div className={`bg-gradient-to-br ${step.color} rounded-2xl w-14 h-14 flex flex-col items-center justify-center flex-shrink-0`}>
                    <span className="text-white/70 text-xs">{step.step}</span>
                    <span className="text-white font-bold text-xs">{step.stage}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                    {step.cta && (
                      <div className="mt-3">
                        <a href={step.cta} target="_blank" rel="noopener noreferrer">
                          <Button variant="gradient" size="sm">
                            Créer mon compte — Code {PROMO_CODE}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-1 ${i < 3 ? 'text-primary' : 'text-text-muted'}`} />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Affiliation transparency box */}
          <ScrollReveal delay={0.3}>
            <div className="bg-background border border-surface-light rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-text-muted" />
                Transparence du modèle d&apos;affiliation
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                {[
                  {
                    title: 'Pour vous',
                    items: ['Outils analytiques gratuits', 'Cashback mensuel', 'Dashboard probabiliste', 'Rapports de performance'],
                    color: 'text-primary',
                  },
                  {
                    title: 'Pour AlgoPronos',
                    items: ['Commission affiliation 1xBet', 'Versée sur volume utilisateur', 'Finance les outils IA', 'Aucun frais utilisateur'],
                    color: 'text-secondary',
                  },
                  {
                    title: 'Pour 1xBet',
                    items: ['Acquisition de nouveaux clients', 'Rétention via outils valeur', 'Utilisateurs data-literate', 'Volume de mises informé'],
                    color: 'text-accent',
                  },
                ].map((col, i) => (
                  <div key={i}>
                    <div className={`font-bold ${col.color} mb-2`}>{col.title}</div>
                    <ul className="space-y-1">
                      {col.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-text-secondary text-xs">
                          <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Questions techniques — Modèles de Probabilités
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {faqJsonLd.mainEntity.map((item, i) => (
              <details
                key={i}
                className="group bg-surface border border-surface-light rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
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

      {/* ─── CROSS-LINK SILO ─────────────────────────────────────────────────── */}
      <section className="py-10 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-5">
              <Link href="/data-analysis-multipliers" className="bg-background border border-primary/20 rounded-2xl p-5 hover:border-primary/40 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-white text-sm">Analyse des Tendances Multiplicateurs</h3>
                </div>
                <p className="text-xs text-text-secondary">Visualisation historique, cycles statistiques et Money Management pour Crash et Apple of Fortune.</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary group-hover:gap-2 transition-all">
                  Lire l&apos;article <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
              <Link href="/compte-optimise-ia" className="bg-background border border-secondary/20 rounded-2xl p-5 hover:border-secondary/40 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="h-5 w-5 text-secondary" />
                  <h3 className="font-bold text-white text-sm">Compte Optimisé IA 1xBet</h3>
                </div>
                <p className="text-xs text-text-secondary">Créez votre compte bookmaker reconnu par l&apos;algorithme AlgoPronos. Bonus, analyses et cashback.</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-secondary group-hover:gap-2 transition-all">
                  Créer mon compte <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/8 via-transparent to-primary/8 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              Appliquez les modèles probabilistes à votre stratégie
            </h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto">
              Synchronisez les outils analytiques AlgoPronos avec votre compte 1xBet via le code{' '}
              <strong className="text-primary">{PROMO_CODE}</strong>. Accédez aux modules
              probabilistes, au dashboard de visualisation et au cashback mensuel structuré.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gradient" size="lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Activer le code {PROMO_CODE}
                </Button>
              </a>
              <Link href="/dashboard/generate">
                <Button variant="outline" size="lg">
                  Générateur IA AlgoPronos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-text-muted mt-6">
              18+ · Jouez responsable · AlgoPronos ne garantit pas les gains · Les modèles
              statistiques ne confèrent pas d&apos;avantage prédictif sur les jeux RNG.
              L&apos;unique avantage structurel accessible est le cashback via le code{' '}
              <strong className="text-primary">{PROMO_CODE}</strong>.
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
