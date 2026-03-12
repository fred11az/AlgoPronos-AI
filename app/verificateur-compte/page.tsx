import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { VerificateurWidget } from '@/components/landing/VerificateurWidget';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon compte de paris est-il Optimisé IA ? Vérifiez gratuitement | AlgoPronos',
  description:
    "Découvrez en 30 secondes si votre compte bookmaker est Optimisé IA pour recevoir les meilleures prédictions AlgoPronos. Diagnostic gratuit, instantané et sans inscription. Entrez votre bookmaker et votre ID pour savoir si votre compte est éligible à l'algorithme IA.",
  keywords: [
    'compte optimisé IA paris sportif',
    'vérifier compte bookmaker optimisé IA',
    'comment savoir si mon compte est optimisé IA',
    'compte 1xbet optimisé algorithme',
    'mon compte paris sportif est-il optimisé IA',
    'compte bookmaker analyse IA',
    'vérificateur compte paris IA',
    'optimisation compte parieur IA',
    'AlgoPronos vérificateur compte',
    'compte éligible algorithme pronostic IA',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/verificateur-compte',
  },
  openGraph: {
    title: 'Mon compte de paris est-il Optimisé IA ? — AlgoPronos',
    description:
      "Vérifiez en 30 secondes si votre compte bookmaker est configuré pour recevoir les prédictions de l'algorithme AlgoPronos AI. Gratuit et instantané.",
    url: 'https://algopronos.com/verificateur-compte',
    siteName: 'AlgoPronos AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mon compte de paris est-il Optimisé IA ?',
    description:
      "Diagnostic gratuit en 30 secondes. Vérifiez si votre compte bookmaker est éligible à l'algorithme AlgoPronos AI.",
  },
};

// FAQ structurée JSON-LD — permet à Google d'afficher les réponses directement dans les résultats
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment vérifier si mon compte de paris sportif est Optimisé IA ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Rendez-vous sur algopronos.com/verificateur-compte, entrez votre bookmaker et votre ID de compte. L'algorithme AlgoPronos AI effectue un diagnostic instantané et gratuit pour savoir si votre compte est configuré pour recevoir les meilleures prédictions IA.",
      },
    },
    {
      '@type': 'Question',
      name: "Qu'est-ce qu'un compte Optimisé IA pour les paris sportifs ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Un compte Optimisé IA est un compte bookmaker configuré pour être reconnu par l'algorithme AlgoPronos AI. Cela permet de recevoir des prédictions personnalisées, des cotes optimisées et un accès illimité aux combinés générés par l'IA.",
      },
    },
    {
      '@type': 'Question',
      name: 'Quels bookmakers sont compatibles avec AlgoPronos AI ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "AlgoPronos AI est compatible avec les principaux bookmakers africains et internationaux. Utilisez le vérificateur gratuit sur algopronos.com pour savoir si votre compte est éligible.",
      },
    },
    {
      '@type': 'Question',
      name: 'Le vérificateur de compte AlgoPronos est-il gratuit ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui, le vérificateur de compte AlgoPronos AI est entièrement gratuit et ne nécessite aucune inscription. Le diagnostic prend moins de 30 secondes.",
      },
    },
  ],
};

export default function VerificateurPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-start pb-20 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Breadcrumb */}
      <div className="w-full max-w-md pt-4 mb-2">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Accueil
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Vérificateur</span>
        </nav>
      </div>

      {/* Header */}
      <div className="text-center mb-10 max-w-xl">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-5">
          <span className="text-primary text-sm font-semibold">🛡️ Vérificateur AlgoPronos</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Mon compte est-il<br />
          <span className="bg-gradient-to-r from-primary to-[#00D4FF] bg-clip-text text-transparent">
            Optimisé IA ?
          </span>
        </h1>
        <p className="text-text-secondary leading-relaxed">
          Renseignez votre bookmaker et votre ID de compte pour savoir si votre compte est
          configuré pour recevoir les meilleures prédictions de l&apos;algorithme AlgoPronos AI.
        </p>
      </div>

      <VerificateurWidget />
    </main>
  );
}
