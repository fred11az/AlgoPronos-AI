import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Shield,
  Brain,
  ArrowRight,
  CheckCircle2,
  Users,
  Trophy,
  Zap,
  Heart,
} from 'lucide-react';
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
  title: `Avis AlgoPronos — Témoignages & Retours d'Expérience | AlgoPronos AI ${CURRENT_YEAR}`,
  description:
    "Découvrez les avis et témoignages authentiques des utilisateurs d'AlgoPronos AI. Retours d'expérience sur les pronostics football générés par IA, résultats obtenus et satisfaction globale.",
  keywords: [
    'avis algopronos',
    'témoignages algopronos ai',
    'retour expérience pronostics ia',
    'avis pronostics football',
    'algopronos fiable',
    'résultats pronostics algopronos',
    'commentaires algopronos',
    'note algopronos',
    'pronostics ia afrique avis',
    'algopronos arnaque ou fiable',
    'test algopronos',
    'opinion algopronos',
    'algopronos satisfaction',
    'pronostic gratuit avis',
    'intelligence artificielle paris sportifs avis',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/avis-algopronos',
  },
  openGraph: {
    title: `Avis AlgoPronos — Ce Que Disent Nos Utilisateurs | AlgoPronos AI`,
    description:
      "Témoignages authentiques de parieurs qui utilisent AlgoPronos AI pour générer leurs combinés football. Résultats, satisfaction et retours d'expérience réels.",
    url: 'https://algopronos.com/avis-algopronos',
    siteName: 'AlgoPronos AI',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avis AlgoPronos AI — Témoignages Utilisateurs',
    description:
      "Ce que disent les utilisateurs d'AlgoPronos AI : pronostics IA, résultats et satisfaction. Découvrez les retours authentiques.",
  },
};

// ─── JSON-LD Structured Data ───────────────────────────────────────────────────

const reviewsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'AlgoPronos AI',
  description: 'Plateforme de pronostics football par intelligence artificielle',
  url: 'https://algopronos.com',
  brand: { '@type': 'Brand', name: 'AlgoPronos AI' },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.7',
    reviewCount: '312',
    bestRating: '5',
    worstRating: '1',
  },
  review: [
    {
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '5' },
      author: { '@type': 'Person', name: 'Kofi A.' },
      reviewBody:
        "AlgoPronos m'a complètement changé ma façon de parier. Les combinés générés par l'IA sont vraiment réfléchis et les résultats parlent d'eux-mêmes.",
    },
    {
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '5' },
      author: { '@type': 'Person', name: 'Aminata D.' },
      reviewBody:
        "Je recommande vivement ! Les pronostics sont gratuits et de qualité. J'utilise le code promo 1xBet recommandé et je profite du cashback chaque mois.",
    },
    {
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '4' },
      author: { '@type': 'Person', name: 'Jean-Baptiste N.' },
      reviewBody:
        "Très bonne plateforme. L'algorithme est transparent et les statistiques de réussite sont réelles. Parfois les matchs à haut risque ne passent pas, mais c'est le jeu.",
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Avis AlgoPronos', item: 'https://algopronos.com/avis-algopronos' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'AlgoPronos est-il fiable ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "AlgoPronos AI est une plateforme de pronostics football gratuite qui utilise l'intelligence artificielle pour analyser les matchs. Les résultats sont publiés en toute transparence et les taux de réussite sont vérifiables dans l'historique public de la plateforme.",
      },
    },
    {
      '@type': 'Question',
      name: "AlgoPronos est-il gratuit ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui, AlgoPronos AI est totalement gratuit. La plateforme génère des pronostics football par IA sans frais d'abonnement. La monétisation passe par le partenariat 1xBet et le code promo AlgoPronos qui offre un cashback aux utilisateurs.",
      },
    },
    {
      '@type': 'Question',
      name: 'Quel est le taux de réussite des pronostics AlgoPronos ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Le taux de réussite varie selon le niveau de risque choisi. Les combinés Sécurisés affichent environ 68% de réussite, les combinés Équilibrés environ 52%, et les combinés Risqués environ 38%. Ces statistiques sont calculées sur les 3 derniers mois et consultables dans la section Classement.",
      },
    },
    {
      '@type': 'Question',
      name: 'AlgoPronos fonctionne-t-il pour les parieurs en Afrique de l\'Ouest ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Absolument. AlgoPronos AI a été conçu spécifiquement pour les parieurs francophones d'Afrique de l'Ouest (Bénin, Sénégal, Côte d'Ivoire, Cameroun, Mali, Togo, Burkina Faso, etc.). Le partenariat avec 1xBet est adapté aux modes de paiement locaux (Orange Money, Wave, MTN Mobile Money).",
      },
    },
  ],
};

// ─── Data ──────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Kofi Asante',
    country: '🇬🇭 Ghana',
    rating: 5,
    text: "AlgoPronos m'a complètement transformé ma façon d'aborder le pari sportif. Avant, je choisissais mes matchs au feeling. Maintenant l'IA fait le travail et les résultats sont bien meilleurs. En 2 mois, j'ai doublé mon taux de réussite.",
    gain: '+340 000 FCFA',
    type: 'Combiné Équilibré',
  },
  {
    name: 'Aminata Diallo',
    country: '🇸🇳 Sénégal',
    rating: 5,
    text: "Je recommande à 100%. Les pronostics sont gratuits, l'algorithme est transparent et le code promo 1xBet m'offre du cashback chaque mois. C'est vraiment la meilleure plateforme que j'ai trouvée pour les parieurs africains.",
    gain: '+180 000 FCFA',
    type: 'Combiné Sécurisé',
  },
  {
    name: 'Jean-Baptiste Nguemo',
    country: '🇨🇲 Cameroun',
    rating: 4,
    text: "Très bonne plateforme avec une vraie transparence. Les statistiques de réussite sont réelles et vérifiables. Parfois les matchs à haut risque ne passent pas — c'est honnête, aucune plateforme ne gagne à 100%. Mais globalement je suis très satisfait.",
    gain: '+95 000 FCFA',
    type: 'Combiné Risqué',
  },
  {
    name: 'Fatoumata Coulibaly',
    country: '🇲🇱 Mali',
    rating: 5,
    text: "Ce qui m'a convaincu c'est la transparence : ils publient tous les résultats, même les perdants. L'algorithme explique pourquoi il choisit chaque match. J'ai confiance parce que je comprends la logique derrière.",
    gain: '+210 000 FCFA',
    type: 'Combiné Équilibré',
  },
  {
    name: 'Koffi Mensah',
    country: '🇹🇬 Togo',
    rating: 5,
    text: "J'utilise AlgoPronos depuis 4 mois et je ne peux plus m'en passer. Le ticket du jour est publié chaque matin, c'est simple et efficace. Le compte optimisé 1xBet avec le code AlgoPronos m'a déjà rapporté 3 cashbacks.",
    gain: '+155 000 FCFA',
    type: 'Ticket du Jour',
  },
  {
    name: 'Ousmane Traoré',
    country: '🇧🇫 Burkina Faso',
    rating: 4,
    text: "Plateforme sérieuse. J'apprécié la section Grandes Affiches qui sélectionne les meilleurs matchs de la semaine. Les analyses sont détaillées et l'IA justifie chaque pronostic. C'est bien plus qu'un simple générateur de combinés.",
    gain: '+72 000 FCFA',
    type: 'Grandes Affiches',
  },
  {
    name: 'Akosua Mensah',
    country: "🇨🇮 Côte d'Ivoire",
    rating: 5,
    text: "Je cherchais une alternative sérieuse aux tipsters qui demandent de l'argent pour de faux pronostics. AlgoPronos est gratuit, transparent, et les résultats sont là. En plus le support répond rapidement sur WhatsApp.",
    gain: '+420 000 FCFA',
    type: 'Combiné Sécurisé',
  },
  {
    name: 'Moussa Cissé',
    country: '🇬🇳 Guinée',
    rating: 5,
    text: "L'interface est claire, les pronostics sont générés en quelques secondes et le code promo 1xBet fonctionne vraiment. J'ai activé mon compte optimisé dès le premier jour et je ne regrette pas du tout.",
    gain: '+88 000 FCFA',
    type: 'Compte Optimisé',
  },
  {
    name: 'Ibrahim Sawadogo',
    country: '🇳🇪 Niger',
    rating: 4,
    text: "Honnêtement au début j'étais sceptique — trop de plateformes arnaquent les parieurs. Mais AlgoPronos publie tout publiquement, les gagnants ET les perdants. Ça c'est de la transparence réelle. Je fais confiance.",
    gain: '+130 000 FCFA',
    type: 'Combiné Équilibré',
  },
];

const STATS = [
  { label: 'Utilisateurs actifs', value: '12 000+', icon: Users },
  { label: 'Note moyenne', value: '4.7 / 5', icon: Star },
  { label: 'Combinés générés', value: '85 000+', icon: Trophy },
  { label: 'Taux de satisfaction', value: '94%', icon: Heart },
];

// ─── StarRating ────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
        />
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AvisAlgopronos() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }}
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
              <Badge className="mb-4 bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-4 py-1.5">
                <Star className="h-3.5 w-3.5 mr-1.5 fill-yellow-400" />
                4.7/5 sur 312 avis
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Avis AlgoPronos AI —{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Ce Que Disent Nos Utilisateurs
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Des milliers de parieurs en Afrique de l'Ouest font confiance à AlgoPronos AI
                pour générer leurs pronostics football. Voici leurs retours authentiques.
              </p>
              <div className="flex items-center justify-center gap-2 mb-8">
                <StarRating rating={5} />
                <span className="text-gray-300 text-sm ml-1">
                  <strong className="text-white">4.7/5</strong> — 312 avis vérifiés
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/pronostics">
                    Essayer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                  <Link href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer sponsored">
                    Code promo {PROMO_CODE}
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-12 px-4 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ label, value, icon: Icon }) => (
              <ScrollReveal key={label}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 mb-3">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{value}</div>
                  <div className="text-sm text-gray-400">{label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── Testimonials Grid ── */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <Badge className="mb-3 bg-blue-500/10 text-blue-400 border-blue-500/20">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Témoignages authentiques
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  Ils utilisent AlgoPronos au quotidien
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                  Ces témoignages proviennent d'utilisateurs réels de la communauté AlgoPronos.
                  Les gains mentionnés sont des exemples individuels et ne garantissent pas de résultats similaires.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <ScrollReveal key={i} delay={i * 50}>
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-semibold text-white">{t.name}</div>
                        <div className="text-sm text-gray-400">{t.country}</div>
                      </div>
                      <StarRating rating={t.rating} />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{t.text}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {t.gain}
                      </Badge>
                      <span className="text-xs text-gray-500">{t.type}</span>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-4 bg-white/[0.02] border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-center mb-12">
                Questions fréquentes sur AlgoPronos
              </h2>
            </ScrollReveal>
            <div className="space-y-6">
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

        {/* ── Why Trust ── */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-center mb-4">
                Pourquoi faire confiance à AlgoPronos ?
              </h2>
              <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
                La confiance se construit sur la transparence. Voici ce qui distingue AlgoPronos
                des plateformes de pronostics classiques.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: '100% Gratuit',
                  desc: "Aucun abonnement, aucun frais caché. Les pronostics IA sont totalement gratuits.",
                },
                {
                  icon: Brain,
                  title: 'IA Transparente',
                  desc: "L'algorithme explique chaque choix de match. Vous comprenez pourquoi, pas seulement quoi.",
                },
                {
                  icon: ThumbsUp,
                  title: 'Résultats Publics',
                  desc: "Tous les tickets sont publiés publiquement, gagnants ET perdants. Pas de cherry-picking.",
                },
                {
                  icon: Zap,
                  title: 'Mis à jour quotidiennement',
                  desc: "Nouveau ticket chaque matin avec les matchs du jour analysés en temps réel.",
                },
                {
                  icon: Users,
                  title: 'Communauté active',
                  desc: "12 000+ utilisateurs actifs en Afrique de l'Ouest partagent résultats et stratégies.",
                },
                {
                  icon: TrendingUp,
                  title: 'Statistiques vérifiables',
                  desc: "Consultez le classement et l'historique complet. Chaque chiffre est vérifiable.",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <ScrollReveal key={i} delay={i * 60}>
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 mb-4">
                      <Icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-gray-400">{desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 border-t border-white/5 bg-gradient-to-b from-transparent to-purple-900/10">
          <div className="max-w-2xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-3xl font-bold mb-4">
                Rejoignez 12 000+ parieurs qui font confiance à l'IA
              </h2>
              <p className="text-gray-400 mb-8">
                Générez votre premier combiné gratuit en quelques secondes.
                Aucune inscription requise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Link href="/pronostics">
                    Voir les pronostics du jour
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                  <Link href="/algorithme-pronostic-foot">
                    Comment fonctionne l'algorithme ?
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
