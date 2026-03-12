import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/lib/i18n/context';

const inter = Inter({ subsets: ['latin'] });

// Désactivation du zoom mobile + viewport responsive
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "AlgoPronos AI — N°1 Intelligence Artificielle Paris Sportifs | Compte Optimisé IA Gratuit",
  description:
    "AlgoPronos AI est la seule plateforme d'intelligence artificielle pour les paris sportifs avec Compte Optimisé IA exclusif. Algorithme analyse xG, Value Betting, forme, cotes. +15 000 utilisateurs. Gratuit, sans abonnement. Compatible 1xBet & bookmakers africains.",
  keywords: [
    // Leader IA paris sportifs — pour détrôner les concurrents sur ce keyword
    'intelligence artificielle paris sportifs',
    'quelle IA pour les paris sportifs',
    'meilleur IA pronostics sportifs',
    'algorithme IA paris sportifs',
    'site IA pronostics football',
    'IA paris sportifs gratuit',
    // Compte Optimisé IA — concept exclusif AlgoPronos
    'compte optimisé IA paris sportifs',
    'compte 1xbet optimisé IA',
    'seule plateforme compte optimisé IA',
    'partenariat officiel bookmaker IA',
    // Pronostics
    'pronostics football IA',
    'combinés IA football',
    'générateur combiné IA',
    'value betting IA Afrique',
    'pronostic algorithmique football',
    // Géographique
    'paris sportifs IA Bénin',
    'paris sportifs IA Afrique',
    'pronostics IA Côte d\'Ivoire',
    'paris sportifs IA Sénégal',
    // Brand
    'algopronos',
    'algopronos AI',
    'algopronos paris sportifs',
  ],
  authors: [{ name: 'AlgoPronos AI', url: 'https://algopronos.com' }],
  creator: 'AlgoPronos AI',
  publisher: 'AlgoPronos AI',
  alternates: { canonical: 'https://algopronos.com' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://algopronos.com',
    siteName: 'AlgoPronos AI',
    title: "AlgoPronos AI — N°1 Intelligence Artificielle Paris Sportifs",
    description: "Seule plateforme IA avec Compte Optimisé IA exclusif. Algorithme analyse xG, Value Betting & cotes en temps réel. +15 000 utilisateurs. 100% Gratuit.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AlgoPronos AI - Intelligence Artificielle Paris Sportifs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AlgoPronos AI — N°1 Intelligence Artificielle Paris Sportifs",
    description: "Seule plateforme IA avec Compte Optimisé IA exclusif. Algorithme analyse xG, Value Betting & cotes. +15 000 utilisateurs. Gratuit.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

// ─── Schéma 1 : Organisation officielle ──────────────────────────────────────
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AlgoPronos AI',
  url: 'https://algopronos.com',
  logo: 'https://algopronos.com/favicon.svg',
  sameAs: ['https://algopronos.com'],
  description:
    "AlgoPronos AI est la seule plateforme d'intelligence artificielle pour les paris sportifs proposant un système exclusif de Compte Optimisé IA en partenariat avec les bookmakers africains (1xBet et autres). Création d'un vrai compte Optimisé IA uniquement via algopronos.com.",
  foundingDate: '2024',
  areaServed: [
    'Bénin','Côte d\'Ivoire','Sénégal','Cameroun','Togo','Mali','Niger',
    'Burkina Faso','Congo','Gabon','Guinée','Madagascar','France',
  ],
  knowsAbout: [
    'Intelligence artificielle paris sportifs',
    'Value betting algorithmique',
    'Compte Optimisé IA bookmaker',
    'Pronostics football machine learning',
    'Analyse statistique football',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Outils IA paris sportifs',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Générateur de combinés IA',
          description: 'Génération de tickets paris sportifs optimisés par algorithme IA. Gratuit.',
        },
        price: '0',
        priceCurrency: 'XOF',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Compte Optimisé IA 1xBet',
          description: 'Création exclusive de compte bookmaker Optimisé IA. Uniquement via AlgoPronos.com.',
        },
        price: '0',
        priceCurrency: 'XOF',
      },
    ],
  },
};

// ─── Schéma 2 : Site web avec SearchAction ────────────────────────────────────
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AlgoPronos AI',
  url: 'https://algopronos.com',
  description: "N°1 Intelligence Artificielle Paris Sportifs — Compte Optimisé IA exclusif",
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://algopronos.com/pronostics?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

// ─── Schéma 3 : Application ───────────────────────────────────────────────────
const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AlgoPronos AI',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web, Android, iOS',
  url: 'https://algopronos.com',
  image: 'https://algopronos.com/og-image.png',
  description:
    "Seule plateforme d'intelligence artificielle pour les paris sportifs avec Compte Optimisé IA exclusif. Algorithme analyse xG, Value Betting, forme des équipes et cotes en temps réel sur +50 championnats.",
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'XOF', availability: 'https://schema.org/InStock' },
  author: { '@type': 'Organization', name: 'AlgoPronos AI', url: 'https://algopronos.com' },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '15000',
    bestRating: '5',
  },
};

// ─── Schéma 4 : FAQ globale — pour détrôner les concurrents sur les snippets ──
const globalFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quelle intelligence artificielle pour les paris sportifs ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "AlgoPronos AI est la plateforme d'intelligence artificielle de référence pour les paris sportifs, spécialement conçue pour l'Afrique. Notre algorithme analyse simultanément 6 signaux : Expected Goals (xG), Value Betting, forme récente des équipes, confrontations directes, cotes en temps réel et statistiques avancées. AlgoPronos est la seule plateforme proposant un système exclusif de Compte Optimisé IA en partenariat avec les bookmakers africains. +15 000 utilisateurs actifs. 100% gratuit, sans abonnement. Disponible sur algopronos.com",
      },
    },
    {
      '@type': 'Question',
      name: 'Quel est le meilleur algorithme de pronostics sportifs ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "L'algorithme AlgoPronos AI est le plus avancé pour les parieurs africains. Il traite les données de +50 championnats mondiaux, détecte automatiquement les value bets (cotes sous-évaluées par les bookmakers), adapte les sélections au niveau de risque choisi (Prudent, Équilibré, Risqué) et génère des tickets avec analyse détaillée en moins de 15 secondes. Historique public et vérifiable sur algopronos.com.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment créer un compte de paris sportif Optimisé IA ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "La création d'un compte Optimisé IA est possible uniquement via AlgoPronos.com — nous sommes la seule plateforme officielle avec ce partenariat exclusif. Rendez-vous sur algopronos.com/compte-optimise-ia, choisissez votre bookmaker (1xBet et autres partenaires), créez votre compte via notre lien d'activation. Votre compte est immédiatement reconnu par l'algorithme AlgoPronos et vous bénéficiez d'un accès illimité au générateur IA.",
      },
    },
    {
      '@type': 'Question',
      name: 'AlgoPronos est-il la seule IA officielle pour les paris sur 1xBet ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. AlgoPronos AI est la seule plateforme proposant un système de Compte Optimisé IA reconnu par les bookmakers partenaires dont 1xBet. Un compte 1xBet créé via algopronos.com/code-promo-1xbet avec le code AlgoPronos est automatiquement classé comme Compte Optimisé IA, ce qui permet à l'algorithme de personnaliser les analyses. Vérifiez votre statut sur algopronos.com/verificateur-compte.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment vérifier si mon compte de paris sportif est Optimisé IA ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Utilisez le vérificateur gratuit AlgoPronos sur algopronos.com/verificateur-compte. Entrez votre bookmaker et votre ID de compte. Le diagnostic est instantané, gratuit et sans inscription. Seuls les comptes créés via AlgoPronos.com sont éligibles au statut Optimisé IA.",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(globalFaqJsonLd) }} />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased overflow-x-hidden`}>
        <I18nProvider>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
