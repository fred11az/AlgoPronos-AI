'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Clock,
  AlertCircle,
  Inbox
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Get email from localStorage or URL param
  useEffect(() => {
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    if (emailParam) {
      setEmail(emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [emailParam]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleResendEmail() {
    if (!email) {
      toast.error('Email non trouvé. Veuillez vous réinscrire.');
      return;
    }

    if (resendCount >= 3) {
      toast.error('Trop de tentatives. Veuillez réessayer plus tard ou contacter le support.');
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          toast.error('Trop de demandes. Veuillez patienter quelques minutes.');
          setCountdown(120);
        } else {
          toast.error('Erreur lors de l\'envoi. Veuillez réessayer.');
        }
        return;
      }

      toast.success('Email de vérification renvoyé !');
      setResendCount(resendCount + 1);
      setCountdown(60); // 60 seconds cooldown
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
            <Mail className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-white">Vérifiez votre email</h1>
        <p className="text-text-secondary max-w-sm mx-auto">
          Nous avons envoyé un lien de confirmation à votre adresse email
        </p>
        {email && (
          <p className="text-primary font-medium">{email}</p>
        )}
      </div>

      {/* Instructions Card */}
      <div className="bg-surface/50 border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          Prochaines étapes
        </h2>
        <ol className="space-y-3 text-text-secondary text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Ouvrez votre boîte de réception email</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Cherchez l&apos;email d&apos;AlgoPronos AI (vérifiez aussi les spams)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Cliquez sur le lien <strong className="text-white">&quot;Confirmer mon email&quot;</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Vous serez automatiquement connecté à votre compte</span>
          </li>
        </ol>
      </div>

      {/* Warning Message */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-warning font-medium">Email non reçu ?</p>
          <p className="text-text-secondary mt-1">
            Le lien de vérification expire après 24 heures. Pensez à vérifier votre dossier spam ou courrier indésirable.
          </p>
        </div>
      </div>

      {/* Resend Button */}
      <div className="space-y-3">
        <Button
          onClick={handleResendEmail}
          variant="outline"
          size="lg"
          className="w-full"
          disabled={resendLoading || countdown > 0}
        >
          {resendLoading ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Envoi en cours...
            </>
          ) : countdown > 0 ? (
            <>
              <Clock className="mr-2 h-5 w-5" />
              Renvoyer dans {countdown}s
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              Renvoyer l&apos;email de vérification
            </>
          )}
        </Button>

        {resendCount > 0 && (
          <p className="text-text-muted text-xs text-center">
            {3 - resendCount} tentative(s) restante(s)
          </p>
        )}
      </div>

      {/* Back to Login */}
      <div className="pt-4 border-t border-border">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>

      {/* Support Link */}
      <p className="text-center text-text-muted text-sm">
        Besoin d&apos;aide ?{' '}
        <Link href="/support" className="text-primary hover:underline">
          Contactez le support
        </Link>
      </p>
    </div>
  );
}
