'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error('Veuillez entrer votre email'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'recovery', email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Erreur lors de l'envoi. Veuillez réessayer.");
        return;
      }
      toast.success('Code de récupération envoyé !');
      localStorage.setItem('pendingVerificationEmail', email);
      router.push(`/verify-email?email=${encodeURIComponent(email)}&type=recovery`);
    } catch { toast.error('Une erreur est survenue'); }
    finally { setLoading(false); }
  }

  if (emailSent) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-success/20 to-primary/20 rounded-full flex items-center justify-center">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Email envoyé</h1>
          <p className="text-text-secondary max-w-sm mx-auto">
            Si un compte existe avec <span className="text-primary">{email}</span>,
            vous recevrez un lien pour réinitialiser votre mot de passe.
          </p>
        </div>
        <div className="bg-surface/50 border border-border rounded-xl p-6">
          <p className="text-text-secondary text-sm">Vérifiez votre boîte de réception et votre dossier spam. Le lien expire dans 1 heure.</p>
        </div>
        <div className="space-y-4">
          <Button variant="outline" size="lg" className="w-full" onClick={() => { setEmailSent(false); setEmail(''); }}>
            Essayer avec un autre email
          </Button>
          <Link href="/login" className="flex items-center justify-center gap-2 text-text-secondary hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">Mot de passe oublié ?</h1>
        <p className="text-text-secondary">Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
      </div>

      {/* Avertissement anti-doublon */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">
            Vous avez déjà un compte ?
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Utilisez uniquement cet email pour récupérer votre accès.
            Ne créez <strong className="text-white">pas un second compte</strong> — cela effacerait votre historique de tickets et fausserait vos statistiques d&apos;affiliation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Envoi en cours...</> : <><Mail className="mr-2 h-5 w-5"/>Envoyer le lien de réinitialisation</>}
        </Button>
      </form>
      <Link href="/login" className="flex items-center justify-center gap-2 text-text-secondary hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />Retour à la connexion
      </Link>
    </div>
  );
}
