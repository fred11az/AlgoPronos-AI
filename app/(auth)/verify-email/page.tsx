'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, Clock, AlertCircle, Inbox, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useRouter } from 'next/navigation';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const typeParam = searchParams.get('type') || 'signup';
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

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

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (code.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, type: typeParam }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Code invalide ou expiré');
        return;
      }

      setIsVerified(true);
      toast.success('Compte vérifié avec succès !');
      
      // Petit délai pour l'animation
      setTimeout(() => {
        if (typeParam === 'recovery') {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        } else {
          router.push('/login');
        }
      }, 1500);

    } catch (err) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) { toast.error('Email non trouvé.'); return; }
    if (resendCount >= 3) { toast.error('Trop de tentatives.'); return; }
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeParam === 'recovery' ? 'recovery' : 'resend', email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Erreur lors de l'envoi.");
        return;
      }
      toast.success('Nouveau code envoyé !');
      setResendCount(c => c + 1);
      setCountdown(60);
    } catch { toast.error('Une erreur est survenue'); }
    finally { setResendLoading(false); }
  }

  if (isVerified) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center border-2 border-success animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Vérification réussie !</h1>
          <p className="text-text-secondary">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 rotate-3">
            <Mail className="w-10 h-10 text-primary -rotate-3" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center animate-pulse">
            <Clock className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Vérifiez votre email</h1>
        <p className="text-text-secondary">
          Nous avons envoyé un code à 6 chiffres à <br/>
          <span className="text-white font-medium">{email || 'votre adresse email'}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full max-w-[200px] text-center text-4xl font-bold tracking-[0.5em] h-16 bg-surface border-2 border-border rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              autoFocus
            />
            <p className="text-xs text-text-muted">Saisissez le code reçu par email</p>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-primary hover:bg-primary-hover text-white h-12 text-base font-semibold shadow-lg shadow-primary/20" 
            disabled={loading || code.length !== 6}
          >
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Vérification...</> : 'Confirmer mon compte'}
          </Button>
        </div>
      </form>

      <div className="bg-surface-light border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Vous n&apos;avez rien reçu ?</span>
          <button 
            type="button"
            onClick={handleResend}
            disabled={resendLoading || countdown > 0 || resendCount >= 3}
            className="text-sm text-primary font-medium hover:text-primary-hover disabled:text-text-muted transition-colors"
          >
            {countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le code'}
          </button>
        </div>
        {resendCount > 0 && <p className="text-[10px] text-text-muted uppercase tracking-wider text-right">Essais restants : {3 - resendCount}</p>}
      </div>

      <div className="flex flex-col items-center gap-4 pt-4 border-t border-border/50">
        <Link href="/login" className="flex items-center gap-2 text-text-muted hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>
      </div>
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
