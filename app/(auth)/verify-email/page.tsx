'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, Clock, AlertCircle, Inbox, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('pendingVerificationEmail');
    if (emailParam) setEmail(emailParam);
    else if (stored) setEmail(stored);
  }, [emailParam]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  async function handleResend() {
    if (!email) { toast.error('Email non trouvé. Veuillez vous réinscrire.'); return; }
    if (resendCount >= 3) { toast.error('Trop de tentatives. Veuillez réessayer plus tard.'); return; }
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'resend', email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Erreur lors de l'envoi.");
        setCountdown(60);
        return;
      }
      toast.success('Lien de connexion renvoyé !');
      setResendCount(c => c + 1);
      setCountdown(60);
    } catch { toast.error('Une erreur est survenue'); }
    finally { setResendLoading(false); }
  }

  return (
    <div className="space-y-8">
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
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-white">Vérifiez votre email</h1>
        <p className="text-text-secondary max-w-sm mx-auto">Nous avons envoyé un lien de connexion à votre adresse email</p>
        {email && <p className="text-primary font-medium">{email}</p>}
      </div>
      <div className="bg-surface/50 border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2"><Inbox className="w-5 h-5 text-primary" />Prochaines étapes</h2>
        <ol className="space-y-3 text-text-secondary text-sm">
          {["Ouvrez votre boîte de réception email","Cherchez l'email d'AlgoPronos AI (vérifiez aussi les spams)","Cliquez sur le bouton « Confirmer mon email »","Vous serez automatiquement connecté à votre compte"].map((s,i)=>(
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-warning font-medium">Email non reçu ?</p>
          <p className="text-text-secondary mt-1">Le lien expire après 24 heures. Vérifiez vos spams ou renvoyez ci-dessous.</p>
        </div>
      </div>
      <div className="space-y-3">
        <Button onClick={handleResend} variant="outline" size="lg" className="w-full" disabled={resendLoading || countdown > 0}>
          {resendLoading ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin"/>Envoi en cours...</>
          : countdown > 0 ? <><Clock className="mr-2 h-5 w-5"/>Renvoyer dans {countdown}s</>
          : <><RefreshCw className="mr-2 h-5 w-5"/>Renvoyer le lien de connexion</>}
        </Button>
        {resendCount > 0 && <p className="text-text-muted text-xs text-center">{3 - resendCount} tentative(s) restante(s)</p>}
      </div>
      <div className="pt-4 border-t border-border">
        <Link href="/login" className="flex items-center justify-center gap-2 text-text-secondary hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />Retour à la connexion
        </Link>
      </div>
      <p className="text-center text-text-muted text-sm">Besoin d&apos;aide ? <Link href="/support" className="text-primary hover:underline">Contactez le support</Link></p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
