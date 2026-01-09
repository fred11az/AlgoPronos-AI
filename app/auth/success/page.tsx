'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { CheckCircle2, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next') || '/dashboard';

  const [countdown, setCountdown] = useState(3);

  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Clear the pending verification email from localStorage
      localStorage.removeItem('pendingVerificationEmail');
      router.push(next);
    }
  }, [countdown, next, router]);

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
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Success Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-br from-success/20 to-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle2 className="w-14 h-14 text-success" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-primary animate-bounce" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">
              Email vérifié avec succès !
            </h1>
            <p className="text-text-secondary">
              Votre compte est maintenant activé. Vous allez être redirigé automatiquement.
            </p>
          </div>

          {/* Countdown */}
          <div className="bg-surface/50 border border-success/30 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-text-secondary">
                Redirection dans <span className="text-white font-bold">{countdown}</span> seconde{countdown > 1 ? 's' : ''}...
              </span>
            </div>

            <Link
              href={next}
              className="inline-flex items-center justify-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Continuer maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* What's Next */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2">Et maintenant ?</h3>
            <p className="text-text-secondary text-sm">
              Activez votre accès <span className="text-primary font-medium">VIP gratuit</span> en créant un compte 1xBet pour débloquer 2 coupons IA par jour !
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-text-muted text-sm">
        &copy; {new Date().getFullYear()} AlgoPronos AI. Tous droits réservés.
      </footer>
    </div>
  );
}
