'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Mail, Lock, User, Phone, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const countries = [
  { code: 'BJ', name: 'Bénin' },
  { code: 'TG', name: 'Togo' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'NE', name: 'Niger' },
  { code: 'GN', name: 'Guinée' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'GA', name: 'Gabon' },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  const plan = searchParams.get('plan');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'BJ',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);

    try {
      // Determine the redirect URL after email verification
      const baseUrl = window.location.origin;
      const nextPath = intent === 'vip' || intent === 'activate' ? '/unlock-vip' : '/dashboard';

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback?next=${nextPath}`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            country: formData.country,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Cet email est déjà utilisé');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Check if email confirmation is required
      // If user.identities is empty, the email is already registered
      if (data?.user?.identities?.length === 0) {
        toast.error('Cet email est déjà utilisé. Veuillez vous connecter.');
        router.push('/login');
        return;
      }

      // Store email for verify-email page to use
      localStorage.setItem('pendingVerificationEmail', formData.email);

      // Show success message
      toast.success('Compte créé ! Vérifiez votre email pour activer votre compte.');

      // Redirect to verify-email page
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
        <p className="text-text-secondary">
          {intent === 'vip'
            ? 'Inscrivez-vous pour débloquer votre accès VIP gratuit'
            : 'Rejoignez AlgoPronos AI et commencez à gagner'}
        </p>
      </div>

      {/* Activation Banner */}
      {(intent === 'vip' || intent === 'activate') && (
        <div className="bg-gradient-to-r from-success/20 to-primary/20 rounded-xl p-4 border border-success/30">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-white">100% Gratuit - 2 coupons/jour</p>
              <p className="text-sm text-text-secondary">
                Après inscription, activez avec votre compte 1xBet
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                id="phone"
                type="tel"
                placeholder="+229 97 00 00 00"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Select
              value={formData.country}
              onValueChange={(value) =>
                setFormData({ ...formData, country: value })
              }
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-text-secondary cursor-pointer">
            J&apos;accepte les{' '}
            <Link href="/terms" className="text-primary hover:underline">
              conditions d&apos;utilisation
            </Link>{' '}
            et la{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              politique de confidentialité
            </Link>
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Création du compte...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Créer mon compte
            </>
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm text-text-secondary">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Se connecter
          <ArrowRight className="inline ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
