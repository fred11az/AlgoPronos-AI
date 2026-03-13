import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { MobileMagicCopy } from '@/components/landing/MobileMagicCopy';
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
  X,
  MapPin,
  Calendar,
  RefreshCw,
} from 'lucide-react';

// ─── ISR — page re-générée toutes les heures (fraîcheur pour Google) ──────────
export const revalidate = 3600;

// ─── Config ────────────────────────────────────────────────────────────────────

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

// ─── SEO data ──────────────────────────────────────────────────────────────────

const YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);
const CURRENT_YEAR = new Date().getFullYear();

// Pays africains ciblés (pour le SEO géographique)
const PAYS_AFRIQUE = [
  'Bénin', 'Côte d\'Ivoire', 'Sénégal', 'Cameroun', 'Mali',
  'Togo', 'Burkina Faso', 'Niger', 'Congo', 'Gabon', 'Guinée', 'Madagascar',
];

const PAYS_SLUGS: Record<string, string> = {
  'Bénin': 'benin', 'Côte d\'Ivoire': 'cote-divoire', 'Sénégal': 'senegal',
  'Cameroun': 'cameroun', 'Mali': 'mali', 'Togo': 'togo',
  'Burkina Faso': 'burkina-faso', 'Niger': 'niger', 'Congo': 'congo',
  'Gabon': 'gabon', 'Guinée': 'guinee', 'Madagascar': 'madagascar',
};

// ─── Metadata dynamique ────────────────────────────────────────────────────────

export function generateMetadata(): Metadata {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    title: `Code Promo 1xBet ${CURRENT_YEAR} Afrique : ${PROMO_CODE} — Bonus 200% + Compte Optimisé IA`,
    description:
      `Code promo 1xBet officiel AlgoPronos pour l'Afrique ${CURRENT_YEAR} : ${PROMO_CODE}. Bonus 200% sur 1er dépôt + seul code créant un Compte Optimisé IA. Valable au Bénin, Côte d'Ivoire, Sénégal, Cameroun et toute l'Afrique. Mis à jour le ${today}.`,
    keywords: [
      // Mots-clés ciblant directement BASKETUSA et concurrents
      `code promo 1xbet afrique`,
      `code promo 1xbet ${CURRENT_YEAR} afrique`,
      `quel est le code promo 1xbet pour l'afrique`,
      `meilleur code promo 1xbet afrique`,
      `code promo 1xbet afrique de l'ouest`,
      // Années 2026–2035
      ...YEARS.map(y => `code promo 1xbet ${y}`),
      ...YEARS.map(y => `code promo 1xbet ${y} afrique`),
      ...YEARS.map(y => `bonus 1xbet ${y} afrique`),
      // Pays
      ...PAYS_AFRIQUE.map(p => `code promo 1xbet ${p.toLowerCase()}`),
      ...PAYS_AFRIQUE.map(p => `1xbet bonus ${p.toLowerCase()}`),
      // Bonus
      `code promo 1xbet bonus 200%`,
      `1xbet 200 euros afrique`,
      `1xbet bonus bienvenue afrique`,
      `code promo 1xbet 200 euros`,
      // Compte Optimisé IA
      `seul code promo compte optimisé IA 1xbet`,
      `code promo 1xbet algopronos`,
      `code officiel algopronos 1xbet`,
      `1xbet compte IA afrique`,
      // Général
      `code parrainage 1xbet`,
      `1xbet code inscription`,
      `1xbet promo code`,
    ].join(', '),
    alternates: { canonical: 'https://algopronos.com/code-promo-1xbet' },
    openGraph: {
      title: `Code Promo 1xBet ${CURRENT_YEAR} Afrique : ${PROMO_CODE} | Bonus 200% + Compte Optimisé IA`,
      description: `Le seul code promo 1xBet Afrique qui crée un vrai Compte Optimisé IA : ${PROMO_CODE}. Bonus 200% + accès générateur IA AlgoPronos gratuit.`,
      url: 'https://algopronos.com/code-promo-1xbet',
      siteName: 'AlgoPronos AI',
      type: 'website',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Code Promo 1xBet ${CURRENT_YEAR} Afrique : ${PROMO_CODE} | Bonus 200%`,
      description: `Utilisez ${PROMO_CODE} sur 1xBet en Afrique — Bonus 200% + Compte Optimisé IA AlgoPronos gratuit.`,
    },
  };
}

// ─── Schémas JSON-LD ───────────────────────────────────────────────────────────

function buildJsonLd() {
  const today = new Date().toISOString().split('T')[0];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Quel est le code promo 1xBet pour l'Afrique en ${CURRENT_YEAR} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Le code promo 1xBet officiel pour l'Afrique en ${CURRENT_YEAR} est ${PROMO_CODE} (AlgoPronos). C'est le seul code officiel AlgoPronos, valable dans toute l'Afrique : Bénin, Côte d'Ivoire, Sénégal, Cameroun, Mali, Togo, Burkina Faso, Niger, Congo, Gabon, Guinée, Madagascar et bien d'autres pays. Il active le bonus de bienvenue 1xBet et le statut exclusif Compte Optimisé IA. Valable en ${YEARS.slice(0, 5).join(', ')} et au-delà. Sans ce code, votre compte ne sera pas reconnu par l'algorithme AlgoPronos.`,
        },
      },
      {
        '@type': 'Question',
        name: `Quel bonus 1xBet en Afrique avec le code promo ${CURRENT_YEAR} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Avec le code promo ${PROMO_CODE} sur 1xBet en Afrique, vous recevez : 1. Un bonus de bienvenue sur votre premier dépôt (montant variable selon votre pays). 2. Le statut Compte Optimisé IA exclusif AlgoPronos. 3. L'accès illimité et gratuit au générateur de pronostics AlgoPronos AI. C'est la seule offre qui combine bonus 1xBet + intelligence artificielle pour les paris sportifs en Afrique.`,
        },
      },
      {
        '@type': 'Question',
        name: `Quelle est la différence entre le code AlgoPronos et les autres codes promo 1xBet ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Le code ${PROMO_CODE} (AlgoPronos) est le seul code promo 1xBet qui active le statut Compte Optimisé IA en plus du bonus standard. Contrairement aux autres codes (BASKETUSA et similaires) qui offrent uniquement un bonus financier, ${PROMO_CODE} donne accès à l'algorithme AlgoPronos AI : analyse xG, value bets, combinés optimisés et pronostics personnalisés. C'est pourquoi AlgoPronos.com est la seule plateforme officielle recommandée pour les parieurs africains.`,
        },
      },
      {
        '@type': 'Question',
        name: `Le code promo 1xBet fonctionne-t-il en Côte d'Ivoire, au Sénégal et au Bénin ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Oui, le code promo ${PROMO_CODE} fonctionne dans tous ces pays : Côte d'Ivoire, Sénégal, Bénin, Cameroun, Mali, Togo, Burkina Faso, Niger, Congo, Gabon, Guinée et Madagascar. C'est le code promo 1xBet Afrique de l'Ouest par excellence, spécialement recommandé par AlgoPronos AI pour les parieurs francophones d'Afrique.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Comment activer le code promo 1xBet en Afrique ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Pour activer le code promo 1xBet en Afrique : 1. Copiez le code ${PROMO_CODE} depuis algopronos.com/code-promo-1xbet. 2. Cliquez sur le bouton d'inscription AlgoPronos. 3. Remplissez le formulaire 1xBet et collez ${PROMO_CODE} dans le champ "Code promo". 4. Validez votre inscription. Votre bonus est immédiatement activé et votre compte est classé Optimisé IA.`,
        },
      },
      {
        '@type': 'Question',
        name: `Y a-t-il un code promo 1xBet valable en ${CURRENT_YEAR + 1} et après ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Oui. Le code promo ${PROMO_CODE} (AlgoPronos) est valable en ${YEARS.join(', ')}. Contrairement à d'autres codes qui expirent ou changent chaque année, le code AlgoPronos est permanent car il est lié au partenariat exclusif entre AlgoPronos.com et 1xBet. Il restera actif pour toutes les futures années.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Quel code promo 1xBet donne le meilleur bonus en Afrique francophone ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `En Afrique francophone, le code promo ${PROMO_CODE} (AlgoPronos) offre la meilleure combinaison : bonus de bienvenue 1xBet standard + accès exclusif au Compte Optimisé IA + générateur de pronostics IA gratuit. C'est plus qu'un simple code promo — c'est un accès complet à l'écosystème AlgoPronos, la seule plateforme IA de paris sportifs dédiée à l'Afrique. Disponible dans +12 pays africains.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Comment vérifier si le code promo 1xBet a bien été activé ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Pour vérifier que votre code promo ${PROMO_CODE} a bien été activé sur 1xBet : rendez-vous sur algopronos.com/verificateur-compte. Entrez votre bookmaker (1xBet) et votre ID de compte. L'algorithme AlgoPronos vérifie instantanément le statut Optimisé IA de votre compte. Gratuit, sans inscription, résultat en moins de 30 secondes.`,
        },
      },
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
      { '@type': 'ListItem', position: 2, name: `Code Promo 1xBet ${CURRENT_YEAR} Afrique`, item: 'https://algopronos.com/code-promo-1xbet' },
    ],
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Code Promo 1xBet Afrique ${CURRENT_YEAR} — AlgoPronos`,
    description: `Code promo 1xBet ${PROMO_CODE} valable dans toute l'Afrique — active le bonus de bienvenue + statut Compte Optimisé IA AlgoPronos`,
    brand: { '@type': 'Brand', name: 'AlgoPronos AI' },
    dateModified: today,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      url: 'https://algopronos.com/code-promo-1xbet',
      validThrough: `${CURRENT_YEAR + 9}-12-31`,
      seller: { '@type': 'Organization', name: 'AlgoPronos AI' },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '15000',
      bestRating: '5',
    },
  };

  return { faqJsonLd, breadcrumbJsonLd, productJsonLd };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CodePromoPage() {
  const { faqJsonLd, breadcrumbJsonLd, productJsonLd } = buildJsonLd();

  // Fraîcheur quotidienne visible par Google
  const dateAujourdHui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const heureMAJ = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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
          <nav className="flex items-center justify-center gap-2 text-xs text-text-muted mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Code Promo 1xBet {CURRENT_YEAR} Afrique</span>
          </nav>

          {/* Fraîcheur visible */}
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-4">
            <RefreshCw className="h-3 w-3 text-green-400" />
            <span className="text-green-400 text-xs font-medium capitalize">Mis à jour · {dateAujourdHui} à {heureMAJ}</span>
          </div>

          {/* Badge exclusivité */}
          <div className="inline-flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-full px-4 py-2 mb-4">
            <MapPin className="h-4 w-4 text-warning" />
            <span className="text-warning text-sm font-bold">🌍 Code OFFICIEL AlgoPronos · Afrique · {CURRENT_YEAR}</span>
          </div>

          <Badge variant="outline" className="mb-5 text-primary border-primary/30">
            🎁 Bonus 200% activé · Valable {YEARS.slice(0, 5).join(', ')}…
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Code Promo 1xBet {CURRENT_YEAR} Afrique :<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              {PROMO_CODE} — Bonus 200% + Compte Optimisé IA
            </span>
          </h1>

          <p className="text-lg text-text-secondary mb-2 max-w-2xl mx-auto">
            <strong className="text-primary">{PROMO_CODE}</strong> est le seul code promo 1xBet officiel AlgoPronos
            valable dans toute l&apos;Afrique — le seul qui crée un{' '}
            <strong className="text-white">Compte Optimisé IA</strong> en plus du bonus standard.
          </p>
          <p className="text-sm text-text-muted mb-3 max-w-xl mx-auto">
            Bénin · Côte d&apos;Ivoire · Sénégal · Cameroun · Mali · Togo · Burkina Faso · et +7 pays
          </p>
          <p className="text-sm text-text-muted mb-8 max-w-xl mx-auto">
            Valable en {YEARS.slice(0, 5).join(', ')} et au-delà · Actif {dateAujourdHui}
          </p>

          {/* Code promo card */}
          <div className="bg-surface border border-primary/30 rounded-3xl p-8 mb-8 shadow-xl shadow-primary/5 max-w-md mx-auto">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-3 font-medium">
              Votre code promo 1xBet Afrique {CURRENT_YEAR}
            </p>
            <CopyButton code={PROMO_CODE} />
            <p className="text-xs text-text-muted mt-4">
              Cliquez pour copier · À saisir lors de votre inscription 1xBet
            </p>
            <div className="mt-6 pt-5 border-t border-surface-light">
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="gradient" size="lg" className="w-full">
                  <Gift className="mr-2 h-5 w-5" />
                  Créer mon compte 1xBet Afrique
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Avantages rapides */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-text-muted">
            {[
              { icon: Gift, text: 'Bonus 200% activé' },
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

      {/* ── TABLEAU COMPARATIF vs BASKETUSA ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4 text-warning border-warning/30">
              ⚡ Comparaison des codes promo 1xBet Afrique {CURRENT_YEAR}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Pourquoi <span className="text-primary">{PROMO_CODE}</span> est le meilleur code promo 1xBet en Afrique ?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Tous les codes promo ne se valent pas. Voici pourquoi le code AlgoPronos est dans une catégorie à part.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 text-text-muted text-sm font-medium border-b border-surface-light">Critère</th>
                  <th className="p-4 text-center border-b border-surface-light">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-primary font-bold text-lg">{PROMO_CODE}</span>
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30">AlgoPronos · Recommandé</Badge>
                    </div>
                  </th>
                  <th className="p-4 text-center border-b border-surface-light">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-text-muted font-medium text-lg">Autres codes</span>
                      <Badge className="text-xs bg-surface-light text-text-muted border-surface-light">(BASKETUSA, etc.)</Badge>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { critere: 'Bonus de bienvenue 1xBet', algopronos: '✅ Activé', other: '✅ Activé' },
                  { critere: 'Compte Optimisé IA (exclusif)', algopronos: '✅ Inclus', other: '❌ Non disponible' },
                  { critere: 'Générateur de pronostics IA', algopronos: '✅ Gratuit & illimité', other: '❌ Non disponible' },
                  { critere: 'Analyse xG + Value Bets', algopronos: '✅ Inclus', other: '❌ Non disponible' },
                  { critere: 'Vérificateur de compte', algopronos: '✅ Gratuit', other: '❌ Non disponible' },
                  { critere: 'Conçu pour l\'Afrique', algopronos: '✅ FCFA + 12 pays', other: '⚠️ Usage générique' },
                  { critere: 'Validité 2026–2035', algopronos: '✅ Permanent', other: '⚠️ Variable' },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-surface-light ${i === 0 ? '' : ''}`}>
                    <td className="p-4 text-text-secondary text-sm">{row.critere}</td>
                    <td className="p-4 text-center text-sm font-medium text-white bg-primary/5">{row.algopronos}</td>
                    <td className="p-4 text-center text-sm text-text-muted">{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gradient" size="lg">
                <Gift className="mr-2 h-5 w-5" />
                Utiliser le code {PROMO_CODE} maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── PAYS D'AFRIQUE ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Code promo 1xBet valable dans toute l&apos;Afrique
            </h2>
            <p className="text-text-secondary">
              Le code <strong className="text-primary">{PROMO_CODE}</strong> est actif dans +12 pays africains.
              Cliquez sur votre pays pour un guide d&apos;inscription spécifique.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PAYS_AFRIQUE.map((pays) => (
              <Link
                key={pays}
                href={`/1xbet/${PAYS_SLUGS[pays]}`}
                className="bg-surface border border-surface-light hover:border-primary/40 rounded-xl p-3 text-center hover:bg-primary/5 transition-all group"
              >
                <div className="text-sm font-medium text-text-secondary group-hover:text-white transition-colors">
                  1xBet {pays}
                </div>
                <div className="text-xs text-text-muted mt-1 group-hover:text-primary transition-colors">
                  Code {PROMO_CODE}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CE QUE VOUS OBTENEZ ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ce que vous obtenez avec le code <span className="text-primary">{PROMO_CODE}</span> en Afrique
            </h2>
            <p className="text-text-secondary">
              Plus qu&apos;un simple bonus — le code AlgoPronos est le seul à donner accès à l&apos;écosystème IA complet.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: Gift, color: 'text-primary', bg: 'bg-primary/10',
                title: 'Bonus de bienvenue 1xBet activé',
                desc: 'Le code active le bonus de bienvenue standard 1xBet dès votre premier dépôt. Montant variable selon votre pays (en FCFA pour l\'Afrique francophone).',
              },
              {
                icon: Brain, color: 'text-secondary', bg: 'bg-secondary/10',
                title: 'Compte classé Optimisé IA (exclusif)',
                desc: 'Votre compte 1xBet est reconnu par l\'algorithme AlgoPronos. Toutes les analyses sont calibrées sur votre profil. Aucun autre code ne propose ça.',
              },
              {
                icon: Zap, color: 'text-accent', bg: 'bg-accent/10',
                title: 'Accès illimité au générateur IA',
                desc: 'Générez autant de tickets que vous voulez avec le générateur AlgoPronos AI — analyse xG, value bets, combinés optimisés pour +50 championnats.',
              },
              {
                icon: TrendingUp, color: 'text-success', bg: 'bg-success/10',
                title: 'Ticket IA du Jour inclus',
                desc: 'Accès au Ticket du Jour : 3 picks sélectionnés chaque matin par l\'algorithme sur les meilleures affiches — les championnats africains inclus.',
              },
              {
                icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10',
                title: 'Vérificateur de compte Afrique',
                desc: 'Vérifiez instantanément et gratuitement que votre compte 1xBet est Optimisé IA — disponible pour tous les pays africains où 1xBet opère.',
              },
              {
                icon: Star, color: 'text-warning', bg: 'bg-warning/10',
                title: 'Analyse de chaque pick',
                desc: 'Pour chaque sélection : raisonnement IA, probabilités, cote implicite et indicateur de value bet. Transparent, vérifiable, en temps réel.',
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
              Comment activer le code promo 1xBet en Afrique ?
            </h2>
            <p className="text-text-secondary">4 étapes · moins de 3 minutes</p>
          </div>

          <ol className="space-y-4">
            {[
              {
                n: '1',
                title: `Copiez le code ${PROMO_CODE}`,
                desc: 'Cliquez sur le code en haut de la page pour le copier automatiquement dans votre presse-papiers.',
              },
              {
                n: '2',
                title: 'Cliquez sur « Créer mon compte 1xBet »',
                desc: 'Utilisez le bouton AlgoPronos sur cette page pour accéder à 1xBet avec notre lien partenaire officiel.',
              },
              {
                n: '3',
                title: `Collez ${PROMO_CODE} lors de l'inscription`,
                desc: `À l'étape d'inscription 1xBet, cherchez le champ "Code promo" ou "Code bonus" et collez ${PROMO_CODE}. Validez votre inscription.`,
              },
              {
                n: '4',
                title: 'Vérifiez votre statut Optimisé IA',
                desc: 'Revenez sur AlgoPronos et utilisez le vérificateur gratuit pour confirmer que votre compte 1xBet Afrique est bien Optimisé IA.',
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
            <span className="text-primary text-sm font-semibold">Vérificateur en ligne — Gratuit</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Votre compte 1xBet Afrique est-il{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Optimisé IA ?
            </span>
          </h2>
          <p className="text-text-secondary mb-8">
            Vous avez déjà un compte 1xBet en Afrique ? Vérifiez en 30 secondes s&apos;il est éligible
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

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Questions fréquentes — Code promo 1xBet Afrique {CURRENT_YEAR}
            </h2>
            <p className="text-text-secondary">
              Toutes les réponses sur le code promo 1xBet pour l&apos;Afrique — mis à jour {dateAujourdHui}.
            </p>
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

      {/* ── AUTRES ANNÉES (contenu SEO longue traîne) ── */}
      <section className="py-12 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Code promo 1xBet Afrique — valable toutes les années
          </h2>
          <p className="text-text-muted text-center text-sm mb-6">
            Le code <strong className="text-primary">{PROMO_CODE}</strong> est permanent et actif pour toutes les années à venir.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {YEARS.map((y) => (
              <span key={y} className="bg-background border border-surface-light rounded-xl px-4 py-2 text-sm text-text-secondary">
                Code promo 1xBet {y} Afrique : <strong className="text-primary">{PROMO_CODE}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-text-muted mb-4">
            <Calendar className="h-3 w-3" />
            <span>Actif · Mis à jour le {dateAujourdHui}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Prêt à parier avec l&apos;IA en Afrique ?
          </h2>
          <p className="text-text-secondary mb-8">
            Créez votre compte 1xBet avec le code{' '}
            <strong className="text-primary">{PROMO_CODE}</strong>{' '}
            et commencez à générer vos tickets IA gratuitement — valable dans toute l&apos;Afrique en {CURRENT_YEAR}.
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
      {/* ─── MOBILE MAGIC COPY ──────────────────────────────────────────────── */}
      <MobileMagicCopy affiliateUrl={AFFILIATE_URL} promoCode={PROMO_CODE} />
    </main>
  );
}
