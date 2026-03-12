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
  title: "AlgoPronos AI - Combinés Gagnants avec l'IA | 100% Gratuit",
  description:
    "+15 000 utilisateurs actifs. Découvrez l'IA qui analyse 6 signaux (xG, Value Betting) pour vos paris sportifs. Historique public et vérifiable. 100% Gratuit.",
  keywords: [
    'paris sportifs','combinés','pronostics','IA','intelligence artificielle',
    'football','1xBet','Afrique','Bénin','Togo','Côte d\'Ivoire','Sénégal','gratuit',
    'value betting','xG','expected goals','algorithme',
  ],
  authors: [{ name: 'AlgoPronos AI' }],
  creator: 'AlgoPronos AI',
  publisher: 'AlgoPronos AI',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://algopronos.ai',
    siteName: 'AlgoPronos AI',
    title: "AlgoPronos AI - Combinés Gagnants avec l'IA | 100% Gratuit",
    description: "+15 000 utilisateurs actifs. L'IA qui analyse 6 signaux (xG, Value Betting) pour vos paris sportifs. Historique public vérifiable.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AlgoPronos AI - Combinés IA pour paris sportifs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AlgoPronos AI - Combinés Gagnants avec l'IA | 100% Gratuit",
    description: "+15 000 utilisateurs actifs. L'IA qui analyse 6 signaux (xG, Value Betting) pour vos paris sportifs. Historique public vérifiable.",
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AlgoPronos AI',
  applicationCategory: 'SportsApplication',
  description:
    "+15 000 utilisateurs actifs. L'IA qui analyse 6 signaux (xG, Value Betting) pour vos paris sportifs. Historique public et vérifiable. 100% Gratuit.",
  url: 'https://algopronos.ai',
  image: 'https://algopronos.ai/og-image.png',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'XOF' },
  author: {
    '@type': 'Organization',
    name: 'AlgoPronos AI',
    url: 'https://algopronos.ai',
    email: 'contact@algopronos.ai',
    telephone: '+22997000000',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cotonou',
      addressCountry: 'BJ',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'French',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '15000',
    bestRating: '5',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
