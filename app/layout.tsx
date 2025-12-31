import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/lib/i18n/context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlgoPronos AI - Combinés Gagnants avec l\'IA | 100% Gratuit',
  description:
    'Plateforme gratuite de génération automatique de combinés de paris sportifs pour l\'Afrique de l\'Ouest. Analyses professionnelles propulsées par l\'IA. 2 coupons gratuits par jour.',
  keywords: [
    'paris sportifs',
    'combinés',
    'pronostics',
    'IA',
    'intelligence artificielle',
    'football',
    '1xBet',
    'Afrique',
    'Bénin',
    'Togo',
    'Côte d\'Ivoire',
    'Sénégal',
    'gratuit',
  ],
  authors: [{ name: 'AlgoPronos AI' }],
  creator: 'AlgoPronos AI',
  publisher: 'AlgoPronos AI',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://algopronos.ai',
    siteName: 'AlgoPronos AI',
    title: 'AlgoPronos AI - Combinés Gagnants avec l\'IA | 100% Gratuit',
    description:
      'Plateforme gratuite de génération automatique de combinés de paris sportifs. 2 coupons IA par jour.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AlgoPronos AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlgoPronos AI - Combinés Gagnants avec l\'IA | 100% Gratuit',
    description:
      'Plateforme gratuite de génération automatique de combinés de paris sportifs. 2 coupons IA par jour.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <I18nProvider>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
