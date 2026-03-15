'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import {
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Mail,
  HelpCircle,
  Loader2
} from 'lucide-react';

// Error type configurations
const errorTypes: Record<string, {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
}> = {
  otp_expired: {
    icon: <Clock className="w-12 h-12 text-warning" />,
    title: 'Lien expiré',
    description: 'Le lien de vérification a expiré. Les liens sont valides pendant 24 heures. Veuillez demander un nouveau lien de vérification.',
    action: {
      label: 'Demander un nouveau lien',
      href: '/verify-email',
    },
  },
  invalid_request: {
    icon: <XCircle className="w-12 h-12 text-error" />,
    title: 'Lien invalide',
    description: 'Le lien de vérification est invalide ou a déjà été utilisé. Si vous avez déjà vérifié votre compte, essayez de vous connecter.',
    action: {
      label: 'Se connecter',
      href: '/login',
    },
  },
  access_denied: {
    icon: <AlertTriangle className="w-12 h-12 text-error" />,
    title: 'Accès refusé',
    description: 'L\'accès a été refusé. Le lien de vérification est peut-être expiré ou invalide.',
    action: {
      label: 'Demander un nouveau lien',
      href: '/verify-email',
    },
  },
  exchange_failed: {
    icon: <RefreshCw className="w-12 h-12 text-error" />,
    title: 'Erreur de vérification',
    description: 'Une erreur s\'est produite lors de la vérification. Veuillez réessayer ou demander un nouveau lien.',
    action: {
      label: 'Réessayer',
      href: '/verify-email',
    },
  },
  config_error: {
    icon: <AlertTriangle className="w-12 h-12 text-warning" />,
    title: 'Erreur de configuration',
    description: 'Le service d\'authentification n\'est pas correctement configuré. Veuillez contacter le support.',
    action: {
      label: 'Contacter le support',
      href: '/support',
    },
  },
  default: {
    icon: <XCircle className="w-12 h-12 text-error" />,
    title: 'Erreur d\'authentification',
    description: 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support si le problème persiste.',
    action: {
      label: 'Retour à l\'accueil',
      href: '/',
    },
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'default';
  const errorCode = searchParams.get('error_code') || error;
  const errorDescription = searchParams.get('error_description');

  // Get error config based on error code
  const errorConfig = errorTypes[errorCode] || errorTypes[error] || errorTypes.default;

  return (
    <div className="max-w-md w-full space-y-8 text-center">
      {/* Error Icon */}
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center">
          {errorConfig.icon}
        </div>
      </div>

      {/* Error Message */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">{errorConfig.title}</h1>
        <p className="text-text-secondary">
          {errorConfig.description}
        </p>
      </div>

      {/* Technical Details (collapsed) */}
      {errorDescription && (
        <details className="bg-surface/50 border border-border rounded-lg p-4 text-left">
          <summary className="text-sm text-text-muted cursor-pointer flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Détails techniques
          </summary>
          <p className="mt-3 text-xs text-text-muted font-mono break-all">
            {decodeURIComponent(errorDescription.replace(/\+/g, ' '))}
          </p>
        </details>
      )}

      {/* Actions */}
      <div className="space-y-4">
        <Button asChild size="lg" className="w-full">
          <Link href={errorConfig.action.href}>
            {errorConfig.action.label}
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="text-text-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Connexion
          </Link>
          <span className="hidden sm:inline text-text-muted">•</span>
          <Link
            href="/onboarding"
            className="text-text-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Créer un compte
          </Link>
        </div>
      </div>

      {/* Support */}
      <p className="text-sm text-text-muted">
        Besoin d&apos;aide ?{' '}
        <Link href="/support" className="text-primary hover:underline">
          Contactez notre support
        </Link>
      </p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md w-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/">
          <Logo size="md" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<LoadingFallback />}>
          <AuthErrorContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-text-muted text-sm" suppressHydrationWarning>
        &copy; {new Date().getFullYear()} AlgoPronos AI. Tous droits réservés.
      </footer>
    </div>
  );
}
