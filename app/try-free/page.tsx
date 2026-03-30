
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Essai Gratuit AlgoPronos AI — Testez l\'IA sans compte',
  description: 'Testez l\'algorithme AlgoPronos AI gratuitement et sans inscription. Accédez au dashboard et découvrez nos pronostics football IA immédiatement.',
  alternates: {
    canonical: 'https://algopronos.com/try-free',
  },
};

/**
 * Try Free Page
 *
 * Entry point for anonymous users.
 * The CTA links to /api/try-free which sets the session cookie and redirects to /dashboard.
 */
export default function TryFreePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-[#00D4FF] rounded-full mix-blend-multiply filter blur-[120px] opacity-15 animate-blob animation-delay-2000" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Essai gratuit — Aucune inscription requise
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Testez AlgoPronos AI
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Sans créer de compte
            </span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
            Accédez directement au dashboard, explorez les championnats et découvrez
            l&apos;interface IA en temps réel. Aucun email, aucun mot de passe.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="gradient" asChild>
              <a href="/api/try-free">
                <Zap className="mr-2 h-5 w-5" />
                Accéder au Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">
                J&apos;ai déjà un compte
              </Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-text-muted">
            Sans carte bancaire · Sans engagement · Accès immédiat
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="h-7 w-7 text-primary" />,
              bg: 'bg-primary/10',
              title: 'Accès Immédiat',
              desc: 'Un clic suffit. Pas d\'email, pas de mot de passe, pas d\'attente.',
            },
            {
              icon: <Brain className="h-7 w-7 text-[#00D4FF]" />,
              bg: 'bg-[#00D4FF]/10',
              title: 'IA en Action',
              desc: 'Explorez l\'interface IA, sélectionnez vos matchs et configurez vos combinés.',
            },
            {
              icon: <Shield className="h-7 w-7 text-success" />,
              bg: 'bg-success/10',
              title: 'Sans Engagement',
              desc: 'Testez librement. Activez votre compte quand vous êtes convaincu.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-surface rounded-2xl p-6 border border-surface-light text-center">
              <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mx-auto mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-text-secondary text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-3xl mx-auto px-4 py-16 border-t border-surface-light">
        <h2 className="text-2xl font-bold text-white text-center mb-12">Comment ça marche ?</h2>
        <div className="space-y-8">
          {[
            {
              n: '1',
              title: 'Explorez le dashboard',
              desc: 'Naviguez dans l\'interface, découvrez les championnats disponibles et les matchs du jour.',
            },
            {
              n: '2',
              title: 'Préparez vos combinés',
              desc: 'Sélectionnez vos matchs, choisissez le niveau de risque et le type de pari.',
            },
            {
              n: '3',
              title: 'Activez pour générer',
              desc: 'Créez un compte 1xBet depuis AlgoPronos pour débloquer les pronostics IA.',
            },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">{s.n}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                <p className="text-text-secondary">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 py-12 border-t border-surface-light">
        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { icon: <TrendingUp className="h-5 w-5 text-primary" />, value: '15 000+', label: 'Utilisateurs actifs' },
            { icon: <CheckCircle className="h-5 w-5 text-success" />, value: '100%', label: 'Gratuit' },
            { icon: <Sparkles className="h-5 w-5 text-[#00D4FF]" />, value: '78.5%', label: 'Taux de réussite' },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-1">
                {s.icon}
                <span>{s.value}</span>
              </div>
              <p className="text-text-muted text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Button size="lg" variant="gradient" asChild>
          <a href="/api/try-free">
            <Sparkles className="mr-2 h-5 w-5" />
            Commencer l&apos;essai gratuit
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
