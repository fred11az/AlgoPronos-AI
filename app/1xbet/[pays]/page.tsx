import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/app/code-promo-1xbet/CopyButton';
import {
  CheckCircle2, Shield, Brain, Zap, Gift, ArrowRight,
  ChevronRight, Star, TrendingUp, MapPin,
} from 'lucide-react';

// ─── Config ────────────────────────────────────────────────────────────────────

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL = process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://1xbet.com';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);

// ─── Countries data ────────────────────────────────────────────────────────────

interface CountryData {
  name: string;
  nameAccusatif: string;
  capital: string;
  currency: string;
  region: string;
  flag: string;
  leagues: string[];
  topTeams: string[];
  sportPopulaire: string;
}

const COUNTRIES: Record<string, CountryData> = {
  benin: {
    name: 'Bénin',
    nameAccusatif: 'au Bénin',
    capital: 'Cotonou',
    currency: 'FCFA',
    region: 'Afrique de l\'Ouest',
    flag: '🇧🇯',
    leagues: ['Ligue 1 (France)', 'Premier League (Angleterre)', 'Champions League', 'La Liga (Espagne)', 'Série A (Italie)', 'Ligue 1 Bénin'],
    topTeams: ['Paris Saint-Germain', 'Manchester City', 'Real Madrid', 'AS Monaco', 'Liverpool'],
    sportPopulaire: 'football',
  },
  'cote-divoire': {
    name: 'Côte d\'Ivoire',
    nameAccusatif: 'en Côte d\'Ivoire',
    capital: 'Abidjan',
    currency: 'FCFA',
    region: 'Afrique de l\'Ouest',
    flag: '🇨🇮',
    leagues: ['Ligue 1 (France)', 'Premier League (Angleterre)', 'Champions League', 'MTN Ligue 1 CI', 'La Liga', 'AFCON'],
    topTeams: ['ASEC Mimosas', 'Africa Sports', 'Paris Saint-Germain', 'Manchester United', 'Real Madrid'],
    sportPopulaire: 'football',
  },
  senegal: {
    name: 'Sénégal',
    nameAccusatif: 'au Sénégal',
    capital: 'Dakar',
    currency: 'FCFA',
    region: 'Afrique de l\'Ouest',
    flag: '🇸🇳',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Ligue Pro Sénégal', 'La Liga', 'CAN'],
    topTeams: ['Paris Saint-Germain', 'Liverpool', 'Chelsea', 'AS Pikine', 'Génération Foot'],
    sportPopulaire: 'football',
  },
  cameroun: {
    name: 'Cameroun',
    nameAccusatif: 'au Cameroun',
    capital: 'Yaoundé',
    currency: 'FCFA',
    region: 'Afrique Centrale',
    flag: '🇨🇲',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'MTN Elite One', 'La Liga', 'CAN'],
    topTeams: ['Canon Yaoundé', 'Coton Sport', 'Paris Saint-Germain', 'Inter Milan', 'Barcelona'],
    sportPopulaire: 'football',
  },
  mali: {
    name: 'Mali',
    nameAccusatif: 'au Mali',
    capital: 'Bamako',
    currency: 'FCFA',
    region: 'Afrique de l\'Ouest',
    flag: '🇲🇱',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Ligue Nationale Mali', 'La Liga'],
    topTeams: ['Stade Malien', 'Real Bamako', 'Manchester City', 'Real Madrid', 'Liverpool'],
    sportPopulaire: 'football',
  },
  togo: {
    name: 'Togo',
    nameAccusatif: 'au Togo',
    capital: 'Lomé',
    currency: 'FCFA',
    region: 'Afrique de l\'Ouest',
    flag: '🇹🇬',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Championnat Togo', 'La Liga'],
    topTeams: ['Maranatha FC', 'ASKO de Kara', 'Paris Saint-Germain', 'Barcelona', 'Manchester United'],
    sportPopulaire: 'football',
  },
  'burkina-faso': {
    name: 'Burkina Faso',
    nameAccusatif: 'au Burkina Faso',
    capital: 'Ouagadougou',
    currency: 'FCFA',
    region: 'Afrique de l\'Ouest',
    flag: '🇧🇫',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Championnat Burkina', 'La Liga'],
    topTeams: ['ASFA Yennenga', 'Racing Club Bobo', 'Paris Saint-Germain', 'Chelsea', 'Arsenal'],
    sportPopulaire: 'football',
  },
  niger: {
    name: 'Niger',
    nameAccusatif: 'au Niger',
    capital: 'Niamey',
    currency: 'FCFA',
    region: 'Afrique de l\'Ouest',
    flag: '🇳🇪',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Championnat Niger', 'La Liga'],
    topTeams: ['Sahel SC', 'Olympic FC', 'Paris Saint-Germain', 'Barcelona', 'Manchester City'],
    sportPopulaire: 'football',
  },
  congo: {
    name: 'Congo',
    nameAccusatif: 'au Congo',
    capital: 'Brazzaville',
    currency: 'FCFA',
    region: 'Afrique Centrale',
    flag: '🇨🇬',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Ligue 1 Congo', 'La Liga'],
    topTeams: ['CARA Brazzaville', 'Etoile du Congo', 'Paris Saint-Germain', 'Barcelona', 'Liverpool'],
    sportPopulaire: 'football',
  },
  gabon: {
    name: 'Gabon',
    nameAccusatif: 'au Gabon',
    capital: 'Libreville',
    currency: 'FCFA',
    region: 'Afrique Centrale',
    flag: '🇬🇦',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Championnat Gabon', 'La Liga'],
    topTeams: ['CF Mounana', 'Manchester City', 'Barcelona', 'Juventus', 'AC Milan'],
    sportPopulaire: 'football',
  },
  guinee: {
    name: 'Guinée',
    nameAccusatif: 'en Guinée',
    capital: 'Conakry',
    currency: 'GNF',
    region: 'Afrique de l\'Ouest',
    flag: '🇬🇳',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'Ligue Pro Guinée', 'La Liga'],
    topTeams: ['Hafia FC', 'Satellite FC', 'Paris Saint-Germain', 'Real Madrid', 'Manchester United'],
    sportPopulaire: 'football',
  },
  madagascar: {
    name: 'Madagascar',
    nameAccusatif: 'à Madagascar',
    capital: 'Antananarivo',
    currency: 'MGA',
    region: 'Afrique de l\'Est',
    flag: '🇲🇬',
    leagues: ['Ligue 1 (France)', 'Premier League', 'Champions League', 'TNT Kbox Liga', 'La Liga'],
    topTeams: ['CNaPS Sport', 'Elgeco Plus', 'Paris Saint-Germain', 'Barcelona', 'Arsenal'],
    sportPopulaire: 'football',
  },
};

// ─── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(COUNTRIES).map((pays) => ({ pays }));
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pays: string }>;
}): Promise<Metadata> {
  const { pays } = await params;
  const country = COUNTRIES[pays];
  if (!country) return {};

  const n = country.name;
  const nl = n.toLowerCase();

  return {
    title: `1xBet ${n} ${CURRENT_YEAR} : Code Promo ${PROMO_CODE} — Compte Optimisé IA | AlgoPronos`,
    description: `1xBet ${n} : Inscrivez-vous avec le code promo ${PROMO_CODE} pour créer votre Compte Optimisé IA. Bonus de bienvenue 1xBet + accès gratuit aux pronostics IA AlgoPronos. Valable ${YEARS.slice(0, 5).join(', ')} et au-delà.`,
    keywords: [
      `1xbet ${nl}`,
      `1xbet ${nl} ${CURRENT_YEAR}`,
      `code promo 1xbet ${nl}`,
      `bonus 1xbet ${nl}`,
      `inscription 1xbet ${nl}`,
      `1xbet ${nl} inscription`,
      `comment s'inscrire 1xbet ${nl}`,
      `1xbet ${nl} code bonus`,
      `paris sportifs ${nl}`,
      `meilleur site paris sportifs ${nl}`,
      `pronostics football ${nl}`,
      `paris sportifs IA ${nl}`,
      `compte optimisé IA ${nl}`,
      `1xbet ${country.region.toLowerCase()}`,
      `paris sportifs ${country.region.toLowerCase()}`,
      `algopronos ${nl}`,
      `code promo 1xbet algopronos`,
      ...YEARS.map(y => `1xbet ${nl} ${y}`),
      ...YEARS.map(y => `code promo 1xbet ${nl} ${y}`),
      '1xbet afrique',
      '1xbet afrique de l\'ouest',
      'paris sportifs afrique IA',
      'pronostics IA afrique',
      'compte 1xbet optimisé algorithme',
    ].join(', '),
    alternates: {
      canonical: `https://algopronos.com/1xbet/${pays}`,
    },
    openGraph: {
      title: `1xBet ${n} ${CURRENT_YEAR} — Code Promo ${PROMO_CODE} | Compte Optimisé IA`,
      description: `Créez votre compte 1xBet Optimisé IA ${country.nameAccusatif} avec le code ${PROMO_CODE}. Bonus + générateur IA AlgoPronos gratuit.`,
      url: `https://algopronos.com/1xbet/${pays}`,
      siteName: 'AlgoPronos AI',
      type: 'website',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `1xBet ${n} — Code Promo ${PROMO_CODE} | AlgoPronos`,
      description: `Inscrivez-vous sur 1xBet ${country.nameAccusatif} avec ${PROMO_CODE}. Compte Optimisé IA + générateur IA gratuit.`,
    },
  };
}

// ─── JSON-LD per country ───────────────────────────────────────────────────────

function buildJsonLd(pays: string, country: CountryData) {
  const n = country.name;
  const nl = n.toLowerCase();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Quel est le code promo 1xBet ${n} ${CURRENT_YEAR} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Le code promo 1xBet officiel AlgoPronos pour les utilisateurs ${country.nameAccusatif} est ${PROMO_CODE}. C'est le seul code permettant de créer un vrai Compte Optimisé IA sur 1xBet. Il est valable en ${YEARS.slice(0, 5).join(', ')} et au-delà. Sans ce code, votre compte ne sera pas reconnu par l'algorithme AlgoPronos.`,
        },
      },
      {
        '@type': 'Question',
        name: `Comment s'inscrire sur 1xBet ${country.nameAccusatif} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Pour s'inscrire sur 1xBet ${country.nameAccusatif} : 1. Copiez le code promo ${PROMO_CODE} depuis algopronos.com/1xbet/${pays}. 2. Cliquez sur le bouton "Créer mon compte 1xBet". 3. Remplissez le formulaire d'inscription. 4. Collez ${PROMO_CODE} dans le champ "Code promo". 5. Validez. Votre compte est automatiquement classé Compte Optimisé IA.`,
        },
      },
      {
        '@type': 'Question',
        name: `Est-ce que 1xBet est disponible ${country.nameAccusatif} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Oui, 1xBet est disponible ${country.nameAccusatif}. Le bookmaker accepte les parieurs en ${country.currency} et propose des dizaines de championnats de football populaires ${country.nameAccusatif} comme ${country.leagues.slice(0, 3).join(', ')}. AlgoPronos est le partenaire officiel IA de 1xBet pour la région ${country.region}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Quel est le meilleur site de pronostics IA ${country.nameAccusatif} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `AlgoPronos AI est le meilleur site de pronostics par intelligence artificielle pour les parieurs ${country.nameAccusatif}. Notre algorithme analyse les matchs de ${country.leagues.slice(0, 3).join(', ')} et bien d'autres. Seul AlgoPronos propose le système exclusif de Compte Optimisé IA en partenariat avec 1xBet. 100% gratuit, disponible sur algopronos.com.`,
        },
      },
      {
        '@type': 'Question',
        name: `Comment avoir le bonus 1xBet ${country.nameAccusatif} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Pour activer le bonus 1xBet ${country.nameAccusatif}, inscrivez-vous via algopronos.com avec le code promo ${PROMO_CODE}. Ce code active : 1. Le bonus de bienvenue 1xBet standard. 2. Le statut Compte Optimisé IA AlgoPronos. 3. L'accès illimité au générateur de pronostics IA. Tout cela est gratuit.`,
        },
      },
      {
        '@type': 'Question',
        name: `Quels championnats peut-on parier sur 1xBet ${country.nameAccusatif} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Avec 1xBet ${country.nameAccusatif}, vous pouvez parier sur +50 championnats dont : ${country.leagues.join(', ')}. AlgoPronos AI analyse automatiquement tous ces championnats et génère des pronostics optimisés par algorithme pour chaque match.`,
        },
      },
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
      { '@type': 'ListItem', position: 2, name: `1xBet ${n}`, item: `https://algopronos.com/1xbet/${pays}` },
    ],
  };

  const landingPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `1xBet ${n} ${CURRENT_YEAR} — Code Promo ${PROMO_CODE}`,
    description: `Guide complet 1xBet ${country.nameAccusatif} : code promo exclusif AlgoPronos, inscription Compte Optimisé IA, bonus.`,
    url: `https://algopronos.com/1xbet/${pays}`,
    breadcrumb: breadcrumbJsonLd,
    mainEntity: {
      '@type': 'Product',
      name: `Code Promo 1xBet ${n} ${CURRENT_YEAR}`,
      description: `Code promo 1xBet ${PROMO_CODE} valable ${country.nameAccusatif} — active le statut Compte Optimisé IA`,
      brand: { '@type': 'Brand', name: 'AlgoPronos AI' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: country.currency,
        availability: 'https://schema.org/InStock',
        url: `https://algopronos.com/1xbet/${pays}`,
      },
    },
  };

  return { faqJsonLd, breadcrumbJsonLd, landingPageJsonLd };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function Pays1xBetPage({
  params,
}: {
  params: Promise<{ pays: string }>;
}) {
  const { pays } = await params;
  const country = COUNTRIES[pays];
  if (!country) notFound();

  const { faqJsonLd, breadcrumbJsonLd, landingPageJsonLd } = buildJsonLd(pays, country);

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(landingPageJsonLd) }} />

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
            <Link href="/code-promo-1xbet" className="hover:text-white transition-colors">Code Promo 1xBet</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{country.flag} {country.name}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-full px-4 py-2 mb-4">
            <MapPin className="h-4 w-4 text-warning" />
            <span className="text-warning text-sm font-bold">{country.flag} {country.name} · {country.region}</span>
          </div>

          <Badge variant="outline" className="mb-5 text-primary border-primary/30">
            🎁 Code officiel actif · {CURRENT_YEAR}–{CURRENT_YEAR + 9}
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            1xBet {country.name} {CURRENT_YEAR} :<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Code Promo Compte Optimisé IA
            </span>
          </h1>

          <p className="text-lg text-text-secondary mb-3 max-w-xl mx-auto">
            Créez votre compte 1xBet {country.nameAccusatif} avec le code{' '}
            <strong className="text-primary">{PROMO_CODE}</strong> — le seul code officiel AlgoPronos
            activant votre <strong className="text-white">Compte Optimisé IA</strong>.
          </p>
          <p className="text-sm text-text-muted mb-8 max-w-xl mx-auto">
            Valable {YEARS.slice(0, 5).join(', ')} et au-delà · {country.currency} accepté · Sans ce code, votre compte ne sera pas reconnu par l&apos;algorithme.
          </p>

          {/* Code card */}
          <div className="bg-surface border border-primary/30 rounded-3xl p-8 mb-8 shadow-xl shadow-primary/5 max-w-md mx-auto">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-3 font-medium">
              Votre code promo exclusif {country.flag} {country.name}
            </p>
            <CopyButton code={PROMO_CODE} />
            <p className="text-xs text-text-muted mt-4">
              Cliquez pour copier · À saisir lors de votre inscription 1xBet
            </p>
            <div className="mt-6 pt-5 border-t border-surface-light">
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="gradient" size="lg" className="w-full">
                  <Gift className="mr-2 h-5 w-5" />
                  Créer mon compte 1xBet {country.nameAccusatif}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick wins */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-text-muted">
            {[
              { icon: CheckCircle2, text: `Bonus 1xBet ${country.name}` },
              { icon: Brain, text: 'Compte Optimisé IA' },
              { icon: Zap, text: 'Générateur IA gratuit' },
              { icon: Shield, text: `Vérificateur inclus` },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POURQUOI 1XBET + ALGOPRONOS ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Pourquoi 1xBet + AlgoPronos {country.nameAccusatif} ?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              La combinaison {country.flag} {country.name} la plus puissante pour les paris sportifs — bookmaker international + algorithme IA local.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: TrendingUp,
                color: 'text-primary',
                bg: 'bg-primary/10',
                title: `+50 championnats disponibles ${country.nameAccusatif}`,
                desc: `Pariez sur ${country.leagues.slice(0, 3).join(', ')} et bien plus encore. 1xBet couvre la quasi-totalité des championnats du monde, accessibles ${country.nameAccusatif}.`,
              },
              {
                icon: Brain,
                color: 'text-secondary',
                bg: 'bg-secondary/10',
                title: 'Compte Optimisé IA — exclusif AlgoPronos',
                desc: `Seule AlgoPronos peut activer le statut Compte Optimisé IA sur votre compte 1xBet. Ce statut est reconnu par notre algorithme pour personnaliser vos analyses.`,
              },
              {
                icon: Zap,
                color: 'text-accent',
                bg: 'bg-accent/10',
                title: 'Pronostics générés en 15 secondes',
                desc: "L'algorithme AlgoPronos analyse xG, forme, confrontations et value bets en temps réel. Générez un ticket IA optimisé en moins de 15 secondes.",
              },
              {
                icon: CheckCircle2,
                color: 'text-success',
                bg: 'bg-success/10',
                title: `Paiements en ${country.currency} acceptés`,
                desc: `1xBet accepte les dépôts et retraits en ${country.currency} via Mobile Money, virement, et autres méthodes locales disponibles ${country.nameAccusatif}.`,
              },
              {
                icon: Star,
                color: 'text-warning',
                bg: 'bg-warning/10',
                title: `Ligues populaires ${country.nameAccusatif}`,
                desc: `Nos algorithmes analysent toutes les ligues populaires en ${country.name} : ${country.leagues.join(', ')}.`,
              },
              {
                icon: Shield,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                title: 'Vérificateur de compte gratuit',
                desc: `Vérifiez en 30 secondes si votre compte 1xBet créé ${country.nameAccusatif} est bien Optimisé IA. Diagnostic instantané sur algopronos.com/verificateur-compte.`,
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

      {/* ── ÉTAPES ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Comment s&apos;inscrire sur 1xBet {country.nameAccusatif} ?
            </h2>
            <p className="text-text-secondary">4 étapes · moins de 3 minutes</p>
          </div>

          <ol className="space-y-4">
            {[
              {
                n: '1',
                title: `Copiez le code promo ${PROMO_CODE}`,
                desc: `Cliquez sur le code ${PROMO_CODE} en haut de cette page pour le copier automatiquement.`,
              },
              {
                n: '2',
                title: `Accédez à 1xBet ${country.nameAccusatif}`,
                desc: `Cliquez sur le bouton AlgoPronos pour accéder à 1xBet avec notre lien partenaire officiel.`,
              },
              {
                n: '3',
                title: `Entrez ${PROMO_CODE} lors de l'inscription`,
                desc: `Dans le formulaire d'inscription 1xBet, cherchez le champ "Code promo" ou "Code bonus" et collez ${PROMO_CODE}. Validez.`,
              },
              {
                n: '4',
                title: 'Vérifiez votre statut Optimisé IA',
                desc: `Revenez sur AlgoPronos et utilisez le vérificateur gratuit pour confirmer que votre compte 1xBet ${country.nameAccusatif} est bien Optimisé IA.`,
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
                Créer mon compte 1xBet {country.nameAccusatif}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── LIGUES POPULAIRES ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Pronostics IA pour les ligues populaires {country.nameAccusatif}
            </h2>
            <p className="text-text-secondary">
              L&apos;algorithme AlgoPronos analyse en temps réel tous les championnats disponibles sur 1xBet {country.nameAccusatif}.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {country.leagues.map((league, i) => (
              <div
                key={i}
                className="bg-background border border-surface-light rounded-xl px-4 py-3 text-center hover:border-primary/40 transition-colors"
              >
                <span className="text-sm font-medium text-text-secondary">{league}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/pronostics">
              <Button variant="outline" size="lg">
                Voir tous les pronostics IA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── VÉRIFICATEUR CTA ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Votre compte 1xBet {country.nameAccusatif} est-il{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Optimisé IA ?
            </span>
          </h2>
          <p className="text-text-secondary mb-8">
            Vous avez déjà un compte 1xBet {country.nameAccusatif} ? Vérifiez en 30 secondes s&apos;il est reconnu
            par l&apos;algorithme AlgoPronos. Gratuit, sans inscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/verificateur-compte">
              <Button variant="gradient" size="lg">
                <Shield className="mr-2 h-5 w-5" />
                Vérifier mon compte
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard/generate">
              <Button variant="outline" size="lg">
                Générateur IA gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Questions fréquentes — 1xBet {country.name}
            </h2>
          </div>
          <div className="space-y-4">
            {faqJsonLd.mainEntity.map((item, i) => (
              <details
                key={i}
                className="group bg-background border border-surface-light rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
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

      {/* ── AUTRES PAYS ── */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            1xBet dans les autres pays d&apos;Afrique
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(COUNTRIES)
              .filter(([slug]) => slug !== pays)
              .map(([slug, c]) => (
                <Link
                  key={slug}
                  href={`/1xbet/${slug}`}
                  className="inline-flex items-center gap-2 bg-surface border border-surface-light hover:border-primary/40 rounded-xl px-4 py-2 text-sm text-text-secondary hover:text-white transition-all"
                >
                  <span>{c.flag}</span>
                  <span>1xBet {c.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Prêt à parier avec l&apos;IA {country.nameAccusatif} ?
          </h2>
          <p className="text-text-secondary mb-8">
            Créez votre compte 1xBet {country.name} avec le code{' '}
            <strong className="text-primary">{PROMO_CODE}</strong>{' '}
            et commencez à générer vos tickets IA gratuitement.
          </p>
          <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="gradient" size="lg">
              <Gift className="mr-2 h-5 w-5" />
              Créer mon compte 1xBet {country.name}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="text-xs text-text-muted mt-6">
            Jouez responsable · 18+ · AlgoPronos ne garantit pas les gains · Paris à risque
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
