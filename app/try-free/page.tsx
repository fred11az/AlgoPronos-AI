'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateAnonymousSession, useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle,
  Gift,
  Zap,
  Shield,
  Users,
} from 'lucide-react';

/**
 * Try Free Page
 *
 * This page serves as the entry point for anonymous users.
 * It creates an anonymous session and redirects to the dashboard.
 */
export default function TryFreePage() {
  const router = useRouter();
  const { type, isLoading: sessionLoading } = useSession();
  const { createSession, isCreating, error } = useCreateAnonymousSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!sessionLoading && type === 'authenticated') {
      router.push('/dashboard');
    }
  }, [sessionLoading, type, router]);

  // If user already has an anonymous session, redirect to dashboard
  useEffect(() => {
    if (!sessionLoading && type === 'anonymous') {
      router.push('/dashboard');
    }
  }, [sessionLoading, type, router]);

  const handleTryFree = async () => {
    setIsRedirecting(true);
    const session = await createSession({
      source: 'try-free-page',
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
    });

    if (session) {
      router.push('/dashboard');
    } else {
      setIsRedirecting(false);
    }
  };

  // Show loading while checking session
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Essai gratuit - Aucune inscription requise
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Testez AlgoPronos AI
              <br />
              <span className="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sans créer de compte
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
              Explorez notre dashboard, sélectionnez vos matchs et préparez vos coupons.
              Créez un compte uniquement quand vous êtes prêt à générer vos pronostics IA.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                variant="gradient"
                onClick={handleTryFree}
                disabled={isCreating || isRedirecting}
                className="min-w-[200px]"
              >
                {isCreating || isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Essayer Gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <Link href="/login">
                <Button variant="outline" size="lg">
                  J&apos;ai déjà un compte
                </Button>
              </Link>
            </div>

            {error && (
              <p className="mt-4 text-error text-sm">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-surface/50 border-surface-light">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Accès Immédiat
              </h3>
              <p className="text-text-secondary text-sm">
                Accédez au dashboard en un clic. Pas d&apos;email, pas de mot de passe, pas d&apos;attente.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface/50 border-surface-light">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Fonctionnalités Complètes
              </h3>
              <p className="text-text-secondary text-sm">
                Explorez tous les championnats, sélectionnez vos matchs et configurez vos coupons.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface/50 border-surface-light">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Sans Engagement
              </h3>
              <p className="text-text-secondary text-sm">
                Testez librement. Créez un compte uniquement si vous souhaitez générer des pronostics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-4 py-16 border-t border-surface-light">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Comment ça marche ?
        </h2>

        <div className="space-y-8">
          <div className="flex items-start gap-6">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">1</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Explorez le dashboard
              </h3>
              <p className="text-text-secondary">
                Naviguez dans l&apos;interface, découvrez les championnats disponibles et les matchs du jour.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">2</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Préparez vos coupons
              </h3>
              <p className="text-text-secondary">
                Sélectionnez vos matchs, choisissez le niveau de risque et le type de pari souhaité.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">3</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Activez pour générer
              </h3>
              <p className="text-text-secondary">
                Quand vous êtes prêt, créez un compte 1xBet avec notre code promo pour débloquer
                la génération de pronostics IA gratuite.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 py-16 border-t border-surface-light">
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
              <Users className="h-6 w-6 text-primary" />
              <span>5,000+</span>
            </div>
            <p className="text-text-muted text-sm">Utilisateurs actifs</p>
          </div>
          <div className="h-12 w-px bg-surface-light" />
          <div>
            <div className="text-2xl font-bold text-white">100%</div>
            <p className="text-text-muted text-sm">Gratuit</p>
          </div>
          <div className="h-12 w-px bg-surface-light" />
          <div>
            <div className="text-2xl font-bold text-white">2/jour</div>
            <p className="text-text-muted text-sm">Coupons IA</p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Button
          size="lg"
          variant="gradient"
          onClick={handleTryFree}
          disabled={isCreating || isRedirecting}
          className="min-w-[250px]"
        >
          {isCreating || isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Commencer l&apos;essai gratuit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
