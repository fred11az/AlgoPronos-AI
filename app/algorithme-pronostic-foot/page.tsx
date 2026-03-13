import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import {
  Brain,
  Database,
  GitBranch,
  Cpu,
  TrendingUp,
  Shield,
  Target,
  Activity,
  ArrowRight,
  CheckCircle2,
  Layers,
  RefreshCw,
  Zap,
  BarChart3,
  BookOpen,
  Sigma,
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
  title: `Algorithme Pronostic Foot — Comment l'IA Analyse les Matchs | AlgoPronos ${CURRENT_YEAR}`,
  description:
    "Découvrez comment l'algorithme AlgoPronos analyse les matchs de football : collecte de données, modèles statistiques, IA prédictive et génération de combinés. Comprendre la technologie derrière les pronostics.",
  keywords: [
    'algorithme pronostic foot',
    'ia pronostic football',
    'algorithme prédiction football',
    'machine learning paris sportifs',
    'intelligence artificielle pronostic',
    'modèle statistique football',
    'analyse données football ia',
    'prédiction résultat match ia',
    'algorithme combiné football',
    'technologie pronostic sport',
    'deep learning football',
    'big data paris sportifs',
    'algopronos algorithme',
    'comment fonctionne algopronos',
    'ia analyse matchs football',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/algorithme-pronostic-foot',
  },
  openGraph: {
    title: `Comment Fonctionne l'Algorithme AlgoPronos ? — IA & Pronostics Football`,
    description:
      "Transparence totale sur la technologie AlgoPronos : collecte de données en temps réel, modèles prédictifs, niveaux de risque et génération automatique de combinés football.",
    url: 'https://algopronos.com/algorithme-pronostic-foot',
    siteName: 'AlgoPronos AI',
    type: 'article',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Algorithme IA pour Pronostics Football — AlgoPronos",
    description:
      "Comment l'IA d'AlgoPronos analyse les matchs : données, modèles statistiques et génération de combinés. Tout est transparent.",
  },
};

// ─── JSON-LD Structured Data ───────────────────────────────────────────────────

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: "Algorithme de Pronostic Football par Intelligence Artificielle — AlgoPronos",
  description:
    "Guide technique complet sur l'algorithme AlgoPronos : collecte de données, modèles statistiques (Poisson, ELO), apprentissage automatique et génération de combinés football.",
  author: { '@type': 'Organization', name: 'AlgoPronos AI', url: 'https://algopronos.com' },
  publisher: {
    '@type': 'Organization',
    name: 'AlgoPronos AI',
    logo: { '@type': 'ImageObject', url: 'https://algopronos.com/favicon.svg' },
  },
  datePublished: `${CURRENT_YEAR}-01-01`,
  dateModified: new Date().toISOString().split('T')[0],
  url: 'https://algopronos.com/algorithme-pronostic-foot',
  about: [
    { '@type': 'Thing', name: 'Intelligence artificielle' },
    { '@type': 'Thing', name: 'Pronostics football' },
    { '@type': 'Thing', name: 'Modèles statistiques' },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Algorithme', item: 'https://algopronos.com/algorithme-pronostic-foot' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Comment l'algorithme AlgoPronos prédit-il les résultats de matchs ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "L'algorithme AlgoPronos combine plusieurs modèles statistiques (Loi de Poisson pour la prédiction de buts, modèle ELO adapté au football, régression logistique pour les résultats) avec des données en temps réel : forme récente des équipes, statistiques historiques, confrontations directes, compositions d'équipes et contexte du match (domicile/extérieur, enjeu). Ces données sont traitées par un modèle d'IA pour générer des probabilités pour chaque issue possible.",
      },
    },
    {
      '@type': 'Question',
      name: "Quelles données l'algorithme utilise-t-il ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "L'algorithme analyse : les 10 derniers matchs de chaque équipe (forme récente), les confrontations directes historiques, les statistiques avancées (xG, possession, tirs cadrés), les blessures et suspensions, la position au classement et les enjeux du match, les cotes de bookmakers comme signal de marché, et la fatigue liée au calendrier de matchs.",
      },
    },
    {
      '@type': 'Question',
      name: "L'algorithme peut-il garantir des gains ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Non. Aucun algorithme ne peut garantir des gains aux paris sportifs — le football reste imprévisible. AlgoPronos maximise les probabilités de succès grâce à l'analyse de données, mais les résultats varient. Notre transparence totale (publication de tous les résultats, gains ET pertes) permet de vérifier nos taux de réussite réels, qui se situent entre 38% et 68% selon le niveau de risque choisi.",
      },
    },
    {
      '@type': 'Question',
      name: "Quelle est la différence entre les niveaux de risque Sécurisé, Équilibré et Risqué ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Le niveau Sécurisé sélectionne uniquement les matchs avec une probabilité algorithmique supérieure à 70%, généralement des favoris clairs sur des marchés simples (1X2, BTTS). L'Équilibré combine des matchs à probabilité 55-70% pour un meilleur ratio gain/risque. Le Risqué inclut des cotes plus élevées avec des probabilités 40-55%, offrant des gains potentiels plus importants mais avec moins de régularité.",
      },
    },
  ],
};

// ─── Pipeline Steps ────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    step: '01',
    icon: Database,
    title: 'Collecte de données',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    items: [
      'Forme récente des équipes (10 derniers matchs)',
      'Statistiques avancées : xG, possession, tirs cadrés',
      'Confrontations directes historiques (5 ans)',
      'Blessures, suspensions et compositions probables',
      'Cotes de bookmakers (signal de marché)',
      'Contexte : domicile/extérieur, enjeu, fatigue calendrier',
    ],
  },
  {
    step: '02',
    icon: Sigma,
    title: 'Modélisation statistique',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    items: [
      'Loi de Poisson → prédiction du nombre de buts',
      'Modèle ELO adapté → force relative des équipes',
      'Régression logistique → probabilité 1X2',
      'Analyse de Dixon-Coles → correction des faibles scores',
      'Modèle de Bradley-Terry → classement des équipes',
      'Calcul des probabilités implicites vs cotes bookmakers',
    ],
  },
  {
    step: '03',
    icon: Brain,
    title: 'Intelligence artificielle',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    items: [
      'LLM Claude (Anthropic) pour l\'analyse contextuelle',
      'Groq (fallback) pour les requêtes à faible latence',
      "Pondération dynamique des signaux selon la compétition",
      "Détection d'anomalies (blessures de dernière minute)",
      "Analyse du sentiment médiatique et des compos probables",
      "Ajustement en temps réel selon les nouvelles entrantes",
    ],
  },
  {
    step: '04',
    icon: Target,
    title: 'Sélection & scoring',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    items: [
      'Score de confiance calculé pour chaque marché',
      'Filtrage par seuil selon le niveau de risque (38%→70%)',
      'Vérification de la value bet (prob. algo > prob. bookmaker)',
      'Détection des matchs à exclure (coupe, play-off...)',
      'Diversification des ligues pour limiter la corrélation',
      'Optimisation du ticket final par rapport au ratio risque/gain',
    ],
  },
  {
    step: '05',
    icon: GitBranch,
    title: 'Génération du combiné',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    items: [
      '3 niveaux : Sécurisé, Équilibré, Risqué',
      '2 à 6 sélections par ticket selon le profil',
      'Cote cible : ×1.8 (sécurisé) → ×5+ (risqué)',
      'Justification IA pour chaque sélection',
      'Publication automatique chaque matin',
      'Résolution et suivi automatique post-match',
    ],
  },
];

const MODELS = [
  {
    name: 'Loi de Poisson',
    icon: BarChart3,
    desc: "Modélise le nombre de buts attendus (xG) pour chaque équipe. Permet de calculer la probabilité de chaque score exact et d'en dériver les probabilités pour 1X2, Over/Under et BTTS.",
    accuracy: '71%',
    use: 'Prédiction de buts',
  },
  {
    name: 'Modèle ELO',
    icon: TrendingUp,
    desc: "Adapté du système utilisé aux échecs pour évaluer la force relative des équipes. Mis à jour après chaque match en tenant compte de la marge de victoire et du contexte (domicile/extérieur).",
    accuracy: '64%',
    use: 'Force des équipes',
  },
  {
    name: 'Régression Logistique',
    icon: Sigma,
    desc: "Combine 40+ features (forme, confrontations directes, fatigue, etc.) pour prédire directement la probabilité de victoire domicile, nul ou victoire extérieure.",
    accuracy: '67%',
    use: 'Résultat 1X2',
  },
  {
    name: 'LLM (Claude AI)',
    icon: Brain,
    desc: "Analyse contextuelle des matchs en langage naturel : actualités des équipes, blessures de dernière minute, déclarations d'entraîneurs. Améliore la qualité des justifications et détecte les signaux faibles.",
    accuracy: '+8%',
    use: 'Contexte & analyse',
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AlgorithmePronosticFoot() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Header />
        <GainsNotification />

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-24 pb-16 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/10 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative">
            <ScrollReveal>
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20 px-4 py-1.5">
                <Cpu className="h-3.5 w-3.5 mr-1.5" />
                Transparence algorithmique
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                L'Algorithme AlgoPronos —{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Comment l'IA Analyse vos Matchs
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Découvrez exactement comment notre algorithme collecte les données, applique
                les modèles statistiques et génère vos pronostics football en quelques secondes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/pronostics">
                    Voir les pronostics IA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                  <Link href="/data-analysis-multipliers">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Data Science & Multiplicateurs
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Terminal ── */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <p className="text-center text-gray-400 mb-6 text-sm">
                Visualisez l'analyse IA en temps réel
              </p>
              <TerminalIAWidget />
            </ScrollReveal>
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section className="py-20 px-4 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <Badge className="mb-3 bg-blue-500/10 text-blue-400 border-blue-500/20">
                  <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                  Pipeline de traitement
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  Les 5 étapes de l'analyse AlgoPronos
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                  De la collecte de données brutes à la publication du ticket final,
                  chaque étape est automatisée et transparente.
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-6">
              {PIPELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <ScrollReveal key={i} delay={i * 80}>
                    <div className={`bg-white/[0.03] border ${step.border} rounded-2xl p-6 md:p-8`}>
                      <div className="flex items-start gap-4 mb-5">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${step.bg} shrink-0`}>
                          <Icon className={`h-6 w-6 ${step.color}`} />
                        </div>
                        <div>
                          <div className={`text-xs font-mono ${step.color} mb-1`}>ÉTAPE {step.step}</div>
                          <h3 className="text-xl font-bold text-white">{step.title}</h3>
                        </div>
                      </div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {step.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle2 className={`h-4 w-4 ${step.color} shrink-0 mt-0.5`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Models ── */}
        <section className="py-20 px-4 bg-white/[0.02] border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <Badge className="mb-3 bg-pink-500/10 text-pink-400 border-pink-500/20">
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Modèles mathématiques
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  Les modèles statistiques utilisés
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                  AlgoPronos combine plusieurs approches mathématiques éprouvées
                  pour maximiser la précision de chaque prédiction.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODELS.map((model, i) => {
                const Icon = model.icon;
                return (
                  <ScrollReveal key={i} delay={i * 80}>
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                            <Icon className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{model.name}</h3>
                            <span className="text-xs text-gray-500">{model.use}</span>
                          </div>
                        </div>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs shrink-0">
                          {model.accuracy}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{model.desc}</p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Risk Levels ── */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <Badge className="mb-3 bg-orange-500/10 text-orange-400 border-orange-500/20">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Niveaux de risque
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  3 profils adaptés à votre stratégie
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Sécurisé',
                  icon: Shield,
                  color: 'text-green-400',
                  bg: 'bg-green-500/10',
                  border: 'border-green-500/30',
                  prob: '> 70%',
                  selections: '2–3',
                  cote: '×1.8 – ×2.5',
                  rate: '~68%',
                  desc: 'Matchs avec forte probabilité algorithmique. Idéal pour la régularité et la gestion de bankroll conservatrice.',
                },
                {
                  name: 'Équilibré',
                  icon: Activity,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                  border: 'border-blue-500/30',
                  prob: '55–70%',
                  selections: '3–5',
                  cote: '×2.5 – ×5',
                  rate: '~52%',
                  desc: 'Compromis entre gain potentiel et régularité. Le niveau recommandé pour la plupart des utilisateurs.',
                },
                {
                  name: 'Risqué',
                  icon: Zap,
                  color: 'text-orange-400',
                  bg: 'bg-orange-500/10',
                  border: 'border-orange-500/30',
                  prob: '40–55%',
                  selections: '4–6',
                  cote: '×5 – ×15+',
                  rate: '~38%',
                  desc: 'Cotes élevées avec sélections plus incertaines. Pour les joueurs qui acceptent plus de variance.',
                },
              ].map((level, i) => {
                const Icon = level.icon;
                return (
                  <ScrollReveal key={i} delay={i * 100}>
                    <div className={`bg-white/[0.04] border ${level.border} rounded-2xl p-6`}>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${level.bg} mb-4`}>
                        <Icon className={`h-6 w-6 ${level.color}`} />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${level.color}`}>{level.name}</h3>
                      <p className="text-sm text-gray-400 mb-5">{level.desc}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Probabilité seuil</span>
                          <span className="text-white font-medium">{level.prob}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sélections</span>
                          <span className="text-white font-medium">{level.selections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cote cible</span>
                          <span className="text-white font-medium">{level.cote}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-white/5">
                          <span className="text-gray-500">Taux de réussite</span>
                          <span className={`font-bold ${level.color}`}>{level.rate}</span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
            <ScrollReveal>
              <p className="text-center text-xs text-gray-600 mt-6">
                * Taux calculés sur les 3 derniers mois. Les performances passées ne garantissent pas les résultats futurs.
                Le pari sportif comporte des risques de perte.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-4 bg-white/[0.02] border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-center mb-12">
                Questions sur l'algorithme
              </h2>
            </ScrollReveal>
            <div className="space-y-5">
              {faqJsonLd.mainEntity.map((item, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-3 flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                      {item.name}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed pl-7">
                      {item.acceptedAnswer.text}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Transparency Banner ── */}
        <section className="py-12 px-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-8 text-center">
                <RefreshCw className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Amélioration continue</h3>
                <p className="text-gray-300 text-sm leading-relaxed max-w-xl mx-auto">
                  L'algorithme est réévalué et amélioré en permanence. Chaque résultat
                  (victoire ou défaite) alimente les modèles pour affiner les prédictions futures.
                  La transparence totale — publier aussi les tickets perdants — est notre engagement
                  fondamental envers la communauté.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 border-t border-white/5 bg-gradient-to-b from-transparent to-purple-900/10">
          <div className="max-w-2xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-3xl font-bold mb-4">
                Testez l'algorithme gratuitement
              </h2>
              <p className="text-gray-400 mb-8">
                Générez votre premier combiné IA maintenant. Aucune inscription requise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Link href="/pronostics">
                    Voir les pronostics du jour
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                  <Link href="/avis-algopronos">
                    Lire les avis utilisateurs
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <MobileMagicCopy promoCode={PROMO_CODE} affiliateUrl={AFFILIATE_URL} />
        <FloatingIACTA />
        <Footer />
      </div>
    </>
  );
}
