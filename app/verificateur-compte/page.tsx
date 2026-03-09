import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { VerificateurWidget } from '@/components/landing/VerificateurWidget';

export const metadata = {
  title: 'Vérificateur de Compte Optimisé IA | AlgoPronos',
  description:
    "Vérifiez si votre compte bookmaker est optimisé pour l'algorithme AlgoPronos AI. Diagnostic instantané et gratuit.",
};

export default function VerificateurPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-start pb-20 px-4">
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
