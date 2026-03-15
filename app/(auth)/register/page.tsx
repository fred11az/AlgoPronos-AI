'use client';

import { useState, Suspense } from 'react';
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
import { Loader2, Mail, Lock, User, Phone, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const countries = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', dial: '+229' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dial: '+228' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dial: '+225' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dial: '+221' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dial: '+223' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dial: '+226' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dial: '+227' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳', dial: '+224' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dial: '+237' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dial: '+241' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dial: '+242' },
  { code: 'CD', name: 'RDC', flag: '🇨🇩', dial: '+243' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩', dial: '+235' },
  { code: 'KM', name: 'Comores', flag: '🇰🇲', dial: '+269' },
];

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dialCode: '+229',
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
      toast.error("Veuillez accepter les conditions d'utilisation");
      return;
    }

    setLoading(true);

    try {
      const nextPath = intent === 'vip' || intent === 'activate' ? '/unlock-vip' : '/dashboard';
      const redirectTo = `${window.location.origin}/auth/callback?next=${nextPath}`;

      const fullPhone = `${formData.dialCode}${formData.phone.replace(/^\+/, '')}`;

      // Création du compte + envoi email via notre API (bypass SMTP Supabase)
      const res = await fetch('/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signup',
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: fullPhone,
          country: formData.country,
          redirectTo,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg = result?.error || '';
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('déjà')) {
          toast.error('Cet email est déjà utilisé. Veuillez vous connecter.');
          router.push('/login');
        } else {
          toast.error(msg || 'Une erreur est survenue lors de la création du compte');
        }
        return;
      }

      localStorage.setItem('pendingVerificationEmail', formData.email);
      toast.success('Compte créé ! Vérifiez votre email pour activer votre compte.');
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
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="flex gap-2">
              <Select 
                value={formData.dialCode} 
                onValueChange={(v) => {
                  const country = countries.find(c => c.dial === v);
                  setFormData({ 
                    ...formData, 
                    dialCode: v,
                    country: country?.code || formData.country
                  });
                }}
              >
                <SelectTrigger className="w-[110px] h-12 rounded-xl">
                  <SelectValue placeholder="+xxx" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.dial}>
                      {c.flag} {c.dial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="97 00 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays de résidence</Label>
            <Select 
              value={formData.country} 
              onValueChange={(v) => {
                const country = countries.find(c => c.code === v);
                setFormData({ 
                  ...formData, 
                  country: v,
                  dialCode: country?.dial || formData.dialCode
                });
              }}
            >
              <SelectTrigger id="country" className="h-12 rounded-xl">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            <Link href="/terms" className="text-primary hover:underline">conditions d&apos;utilisation</Link>{' '}
            et la{' '}
            <Link href="/privacy" className="text-primary hover:underline">politique de confidentialité</Link>
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Création du compte...</>
          ) : (
            <><CheckCircle2 className="mr-2 h-5 w-5" />Créer mon compte</>
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm text-text-secondary">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Se connecter <ArrowRight className="inline ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
