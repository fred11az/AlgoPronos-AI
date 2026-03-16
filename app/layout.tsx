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
  metadataBase: new URL('https://algopronos.com'),
  title: "AlgoPronos AI — N°1 en Afrique pour les pronostics football et création de compte bookmaker optimisé par IA",
  description:
    "AlgoPronos AI est la plateforme N°1 en Afrique pour les pronostics football et la création de compte bookmaker optimisé par IA. Analyse xG, Value Betting, statistiques avancées et bonus exclusifs.",
  keywords: [
    // ... same keywords
    'intelligence artificielle paris sportifs',
    'quelle IA pour les paris sportifs',
    'meilleur IA pronostics sportifs',
    'algorithme IA paris sportifs',
    'site IA pronostics football',
    'IA paris sportifs gratuit',
    'compte optimisé IA paris sportifs',
    'compte 1xbet optimisé IA',
    'seule plateforme compte optimisé IA',
    'partenariat officiel bookmaker IA',
    'pronostics football IA',
    'combinés IA football',
    'générateur combiné IA',
    'value betting IA Afrique',
    'pronostic algorithmique football',
    'paris sportifs IA Bénin',
    'paris sportifs IA Afrique',
    'pronostics IA Côte d\'Ivoire',
    'paris sportifs IA Sénégal',
    'algopronos',
    'algopronos AI',
    'algopronos paris sportifs',
  ],
  authors: [{ name: 'AlgoPronos AI', url: 'https://algopronos.com' }],
  creator: 'AlgoPronos AI',
  publisher: 'AlgoPronos AI',
  applicationName: 'AlgoPronos AI',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: 'AlgoPronos AI',
    title: "AlgoPronos AI — N°1 en Afrique : Pronostics & Compte Optimisé IA",
    description: "Plateforme N°1 en Afrique pour les pronostics football et la création de compte bookmaker optimisé par IA. 100% Gratuit.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'AlgoPronos AI - Plateforme N°1 Pronostics IA Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AlgoPronos AI — N°1 en Afrique : Pronostics & Compte Optimisé IA",
    description: "Plateforme N°1 en Afrique pour les pronostics football et la création de compte bookmaker optimisé par IA. Gratuit.",
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '192x192' },
      { url: '/logo-premium.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
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
  alternateName: 'AlgoPronos',
  url: 'https://algopronos.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://algopronos.com/logo-premium.png',
    width: 512,
    height: 512,
  },
  image: 'https://algopronos.com/logo-premium.png',
  slogan: 'N°1 Intelligence Artificielle Paris Sportifs en Afrique',
  brand: {
    '@type': 'Brand',
    name: 'AlgoPronos AI',
    logo: 'https://algopronos.com/logo-premium.png',
  },
  sameAs: [
    'https://algopronos.com',
    'https://algopronos.com/code-promo-1xbet',
    'https://algopronos.com/compte-optimise-ia',
  ],
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
  image: 'https://algopronos.com/logo-premium.png',
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

// Note : FAQPage JSON-LD supprimé du layout global pour éviter les doublons.
// Chaque page (/, /code-promo-1xbet, /verificateur-compte, /1xbet/[pays]...)
// injecte son propre FAQPage schema avec des questions spécifiques à son contenu.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
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
