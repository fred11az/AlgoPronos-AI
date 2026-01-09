'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import {
  Loader2,
  Lock,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Check if we have a valid session (user clicked the reset link)
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionValid(!!session);
    }
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (error.message.includes('same password')) {
          toast.error('Le nouveau mot de passe doit être différent de l\'ancien');
        } else {
          toast.error('Erreur lors de la mise à jour. Veuillez réessayer.');
        }
        return;
      }

      setSuccess(true);
      toast.success('Mot de passe mis à jour avec succès !');

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  // Show loading while checking session
  if (sessionValid === null) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Show error if no valid session
  if (!sessionValid) {
    return (
      <div className="space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-error/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-error" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Lien invalide</h1>
          <p className="text-text-secondary max-w-sm mx-auto">
            Le lien de réinitialisation est invalide ou a expiré.
            Veuillez demander un nouveau lien.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/forgot-password">
              Demander un nouveau lien
            </Link>
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-text-secondary hover:text-white transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-success/20 to-primary/20 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">
            Mot de passe mis à jour !
          </h1>
          <p className="text-text-secondary max-w-sm mx-auto">
            Votre mot de passe a été modifié avec succès.
            Vous allez être redirigé vers votre tableau de bord.
          </p>
        </div>

        {/* Redirect Notice */}
        <div className="bg-surface/50 border border-success/30 rounded-xl p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-text-secondary">
              Redirection en cours...
            </span>
          </div>
        </div>

        {/* Manual Link */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Accéder au tableau de bord
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Show reset form
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">Nouveau mot de passe</h1>
        <p className="text-text-secondary">
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
            <p className="text-xs text-text-muted">
              Minimum 6 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Mettre à jour le mot de passe
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
