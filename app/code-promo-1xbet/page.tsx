import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from './CopyButton';
import {
  CheckCircle2,
  Shield,
  Brain,
  Zap,
  TrendingUp,
  Star,
  ArrowRight,
  Gift,
  ChevronRight,
} from 'lucide-react';

// ─── Config ────────────────────────────────────────────────────────────────────

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL = process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

// ─── SEO ───────────────────────────────────────────────────────────────────────

// Années ciblées 2026–2035 (Google recrawle régulièrement, page toujours fraîche)
const YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i); // [2026, 2027, ..., 2035]
const CURRENT_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Code Promo 1xBet ${CURRENT_YEAR} : ${PROMO_CODE} — Seul Code pour Compte Optimisé IA | AlgoPronos`,
  description:
    `Code promo 1xBet officiel AlgoPronos ${CURRENT_YEAR} : ${PROMO_CODE}. Seul code permettant de créer un vrai Compte Optimisé IA. Bonus de bienvenue + accès gratuit au générateur IA. Valable ${YEARS.slice(0, 5).join(', ')} et au-delà.`,
  keywords: [
    // Années 2026–2035 (capture les recherches futures)
    ...YEARS.map(y => `code promo 1xbet ${y}`),
    ...YEARS.map(y => `bonus 1xbet ${y}`),
    ...YEARS.map(y => `1xbet code promo ${y}`),
    // Code promo général
    'code promo 1xbet',
    'code promotion 1xbet',
    '1xbet code bonus',
    'code promo 1xbet algopronos',
    'seul code promo compte optimisé IA 1xbet',
    'code officiel algopronos 1xbet',
    // Géographique
    'code promo 1xbet bénin',
    'code promo 1xbet afrique',
    'code promo 1xbet côte d\'ivoire',
    'code promo 1xbet sénégal',
    'code promo 1xbet cameroun',
    'code promo 1xbet togo',
    'code promo 1xbet mali',
    'promo code 1xbet',
    '1xbet code de parrainage',
    // Compte Optimisé IA — positionnement exclusif
    'compte 1xbet optimisé IA',
    'seule plateforme compte optimisé IA 1xbet',
    'comment créer vrai compte optimisé IA 1xbet',
    'compte 1xbet reconnu algorithme IA',
    'code pour activer compte optimisé IA',
    '1xbet IA pronostic algopronos',
    // Vérificateur
    'vérifier compte 1xbet optimisé IA',
    'mon compte 1xbet est-il optimisé IA',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/code-promo-1xbet',
  },
  openGraph: {
    title: `Code Promo 1xBet ${PROMO_CODE} — Compte Optimisé IA AlgoPronos`,
    description:
      `Créez votre compte 1xBet optimisé IA avec le code ${PROMO_CODE}. Accès gratuit au générateur de pronostics AlgoPronos. Bonus + algorithme IA inclus.`,
    url: 'https://algopronos.com/code-promo-1xbet',
    siteName: 'AlgoPronos AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Code Promo 1xBet ${PROMO_CODE} — Compte Optimisé IA`,
    description: `Utilisez ${PROMO_CODE} pour créer un compte 1xBet Optimisé IA et accéder au générateur de pronostics AlgoPronos gratuitement.`,
  },
};

// ─── Schémas JSON-LD ───────────────────────────────────────────────────────────

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: `Quel est le code promo 1xBet ${CURRENT_YEAR} pour un compte Optimisé IA ?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Le seul code promo 1xBet officiel AlgoPronos pour créer un vrai Compte Optimisé IA est ${PROMO_CODE}. C'est le code exclusif AlgoPronos, valable en ${YEARS.slice(0, 5).join(', ')} et au-delà. Il est le seul code qui active le statut Optimisé IA sur votre compte 1xBet, reconnu par l'algorithme AlgoPronos. Sans ce code, votre compte ne sera pas reconnu comme Optimisé IA.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Comment vérifier si mon compte 1xBet est Optimisé IA ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Rendez-vous sur algopronos.com/verificateur-compte, entrez "1xBet" comme bookmaker et votre ID de compte. L'algorithme AlgoPronos vérifie instantanément si votre compte est Optimisé IA. Si vous avez utilisé le code ${PROMO_CODE} à l'inscription, votre compte est automatiquement éligible.`,
      },
    },
    {
      '@type': 'Question',
      name: "Qu'est-ce qu'un compte 1xBet Optimisé IA ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Un compte 1xBet Optimisé IA est un compte créé via AlgoPronos qui est reconnu par notre algorithme d'analyse. Cela permet de recevoir des pronostics personnalisés, des combinés optimisés selon votre niveau de risque, et un accès illimité au générateur AlgoPronos AI.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment utiliser le code promo AlgoPronos sur 1xBet ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `1. Cliquez sur le lien d'inscription AlgoPronos sur cette page. 2. Lors de votre inscription sur 1xBet, entrez le code promo ${PROMO_CODE} dans le champ prévu. 3. Validez votre inscription. 4. Revenez sur AlgoPronos et vérifiez votre compte avec le vérificateur gratuit. Votre accès illimité au générateur IA est immédiatement activé.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Le code promo 1xBet AlgoPronos est-il valable en Afrique ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Oui, le code promo ${PROMO_CODE} est valable dans tous les pays africains où 1xBet est disponible : Bénin, Côte d'Ivoire, Sénégal, Cameroun, Mali, Togo, Niger, Burkina Faso, Congo, Gabon, et bien d'autres. AlgoPronos est spécialement conçu pour les parieurs africains.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Comment optimiser son compte 1xBet avec AlgoPronos ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Pour optimiser votre compte 1xBet avec AlgoPronos : 1. Créez votre compte via le lien AlgoPronos avec le code ${PROMO_CODE}. 2. Inscrivez-vous sur algopronos.com gratuitement. 3. Utilisez le générateur IA pour créer vos tickets avec analyse complète. 4. Vérifiez régulièrement votre statut sur algopronos.com/verificateur-compte.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Le code promo AlgoPronos est-il le seul pour créer un Compte Optimisé IA ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Oui. ${PROMO_CODE} est le seul code officiel AlgoPronos qui active le statut "Compte Optimisé IA" sur 1xBet. AlgoPronos.com est la seule plateforme officielle ayant ce partenariat exclusif avec les bookmakers. Aucun autre code, aucun autre site ne peut créer un vrai Compte Optimisé IA reconnu par l'algorithme AlgoPronos. Le code est valable en ${YEARS.join(', ')}.`,
      },
    },
    {
      '@type': 'Question',
      name: 'AlgoPronos fonctionne-t-il avec d\'autres bookmakers que 1xBet ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui, AlgoPronos est compatible avec plusieurs bookmakers africains et internationaux. Seuls les comptes créés via algopronos.com bénéficient du statut Compte Optimisé IA. Utilisez le vérificateur sur algopronos.com/verificateur-compte pour vérifier votre statut.",
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Code Promo 1xBet', item: 'https://algopronos.com/code-promo-1xbet' },
  ],
};

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Code Promo 1xBet AlgoPronos',
  description: `Code promo 1xBet ${PROMO_CODE} — Compte Optimisé IA + Accès générateur AlgoPronos gratuit`,
  brand: { '@type': 'Brand', name: 'AlgoPronos AI' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'XOF',
    price: '0',
    availability: 'https://schema.org/InStock',
    url: 'https://algopronos.com/code-promo-1xbet',
    seller: { '@type': 'Organization', name: 'AlgoPronos AI' },
  },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CodePromoPage() {
  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <Header />

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary rounded-full blur-[120px] animate-blob" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-secondary rounded-full blur-[120px] animate-blob animation-delay-2000" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-xs text-text-muted mb-8">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Code Promo 1xBet {CURRENT_YEAR}</span>
          </nav>

          {/* Badge exclusivité */}
          <div className="inline-flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-full px-4 py-2 mb-4">
            <span className="text-warning text-sm font-bold">⚠️ Code EXCLUSIF AlgoPronos — Seul code pour Compte Optimisé IA</span>
          </div>

          <Badge variant="outline" className="mb-5 text-primary border-primary/30">
            🎁 Code officiel actif · {CURRENT_YEAR}–{CURRENT_YEAR + 9}
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Code Promo 1xBet {CURRENT_YEAR} :<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Seul code pour Compte Optimisé IA
            </span>
          </h1>

          <p className="text-lg text-text-secondary mb-3 max-w-xl mx-auto">
            <strong className="text-white">{PROMO_CODE}</strong> est le seul code officiel AlgoPronos
            permettant de créer un vrai{' '}
            <strong className="text-primary">Compte Optimisé IA</strong> sur 1xBet.
            Algopronos.com est la seule plateforme avec ce partenariat exclusif.
          </p>
          <p className="text-sm text-text-muted mb-8 max-w-xl mx-auto">
            Valable en {YEARS.slice(0, 5).join(', ')} et au-delà · Sans ce code, votre compte ne sera pas reconnu par l&apos;algorithme.
          </p>

          {/* Code promo card */}
          <div className="bg-surface border border-primary/30 rounded-3xl p-8 mb-8 shadow-xl shadow-primary/5 max-w-md mx-auto">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-3 font-medium">
              Votre code promo exclusif
            </p>
            <CopyButton code={PROMO_CODE} />
            <p className="text-xs text-text-muted mt-4">
              Cliquez pour copier · À utiliser à l&apos;inscription 1xBet
            </p>

            <div className="mt-6 pt-5 border-t border-surface-light">
              <a
                href={AFFILIATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="gradient" size="lg" className="w-full">
                  <Gift className="mr-2 h-5 w-5" />
                  Créer mon compte 1xBet avec ce code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Avantages rapides */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-text-muted">
            {[
              { icon: CheckCircle2, text: 'Bonus 1xBet activé' },
              { icon: Brain, text: 'Compte Optimisé IA' },
              { icon: Zap, text: 'Générateur IA gratuit' },
              { icon: Shield, text: 'Vérificateur inclus' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CE QUE VOUS OBTENEZ ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ce que vous obtenez avec le code <span className="text-primary">{PROMO_CODE}</span>
            </h2>
            <p className="text-text-secondary">
              Plus qu&apos;un simple bonus — un accès complet à l&apos;écosystème AlgoPronos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: Gift,
                color: 'text-primary',
                bg: 'bg-primary/10',
                title: 'Bonus de bienvenue 1xBet',
                desc: "Le code active le bonus de bienvenue standard 1xBet. Montant variable selon votre pays et votre premier dépôt.",
              },
              {
                icon: Brain,
                color: 'text-secondary',
                bg: 'bg-secondary/10',
                title: 'Compte classé Optimisé IA',
                desc: "Votre compte 1xBet est reconnu par l'algorithme AlgoPronos. Toutes les analyses sont calibrées sur votre profil bookmaker.",
              },
              {
                icon: Zap,
                color: 'text-accent',
                bg: 'bg-accent/10',
                title: 'Accès illimité au générateur IA',
                desc: "Générez autant de tickets que vous voulez avec le générateur AlgoPronos AI — analyse statistique, value bets, combinés optimisés.",
              },
              {
                icon: TrendingUp,
                color: 'text-success',
                bg: 'bg-success/10',
                title: 'Ticket IA du Jour inclus',
                desc: "Accès au Ticket du Jour : 3 picks sélectionnés chaque matin par l'algorithme sur les meilleures affiches du jour.",
              },
              {
                icon: Shield,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                title: 'Vérificateur de compte gratuit',
                desc: "Vérifiez à tout moment que votre compte 1xBet est bien Optimisé IA — diagnostic instantané et gratuit.",
              },
              {
                icon: Star,
                color: 'text-warning',
                bg: 'bg-warning/10',
                title: 'Analyse de chaque pick',
                desc: "Pour chaque sélection générée : raisonnement IA, probabilités estimées, cote implicite et indicateur de value bet.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-background border border-surface-light rounded-2xl p-6 flex gap-4 hover:border-primary/30 transition-colors">
                <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT UTILISER ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Comment utiliser le code promo 1xBet ?
            </h2>
            <p className="text-text-secondary">4 étapes — moins de 3 minutes</p>
          </div>

          <ol className="space-y-4">
            {[
              {
                n: '1',
                title: `Copiez le code promo ${PROMO_CODE}`,
                desc: "Cliquez sur le code en haut de la page pour le copier automatiquement dans votre presse-papiers.",
              },
              {
                n: '2',
                title: "Cliquez sur « Créer mon compte 1xBet »",
                desc: "Utilisez le bouton sur cette page pour accéder à 1xBet avec le lien AlgoPronos.",
              },
              {
                n: '3',
                title: "Collez le code lors de votre inscription",
                desc: `À l'étape d'inscription 1xBet, cherchez le champ "Code promo" ou "Code bonus" et collez ${PROMO_CODE}. Validez.`,
              },
              {
                n: '4',
                title: "Vérifiez votre statut Optimisé IA",
                desc: "Revenez sur AlgoPronos et utilisez le vérificateur gratuit pour confirmer que votre compte est bien Optimisé IA.",
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-5 bg-surface border border-surface-light rounded-2xl p-5 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/50 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 text-center">
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gradient" size="lg">
                <Gift className="mr-2 h-5 w-5" />
                Créer mon compte avec {PROMO_CODE}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── VÉRIFICATEUR CTA ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-primary text-sm font-semibold">Vérificateur en ligne</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Votre compte 1xBet est-il déjà{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Optimisé IA ?
            </span>
          </h2>
          <p className="text-text-secondary mb-8">
            Vous avez déjà un compte 1xBet ? Vérifiez en 30 secondes s&apos;il est éligible
            à l&apos;algorithme AlgoPronos. Diagnostic gratuit, sans inscription.
          </p>
          <Link href="/verificateur-compte">
            <Button variant="gradient" size="lg">
              <Shield className="mr-2 h-5 w-5" />
              Vérifier mon compte maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FAQ VISIBLE ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqJsonLd.mainEntity.map((item, i) => (
              <details
                key={i}
                className="group bg-surface border border-surface-light rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="font-semibold text-white pr-4 text-left">{item.name}</h3>
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

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Prêt à parier avec l&apos;IA ?
          </h2>
          <p className="text-text-secondary mb-8">
            Créez votre compte 1xBet Optimisé IA avec le code <strong className="text-primary">{PROMO_CODE}</strong>{' '}
            et commencez à générer vos tickets IA gratuitement dès aujourd&apos;hui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gradient" size="lg">
                <Gift className="mr-2 h-5 w-5" />
                Créer mon compte 1xBet
              </Button>
            </a>
            <Link href="/dashboard/generate">
              <Button variant="outline" size="lg">
                Accéder au générateur IA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-text-muted mt-6">
            Jouez responsable · 18+ · AlgoPronos ne garantit pas les gains · Paris à risque
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
