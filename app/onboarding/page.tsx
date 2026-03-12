'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChartNoAxesCombined,
  Lock,
  Loader2,
  Mail,
  MessageCircle,
  Shield,
  Star,
  User,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const PROFILES = [
  {
    value: 'beginner',
    label: 'Débutant',
    sub: 'Je débute, je veux apprendre en gagnant',
    icon: BookOpen,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    value: 'intermediate',
    label: 'Intermédiaire',
    sub: 'Je connais les bases, je veux progresser',
    icon: ChartNoAxesCombined,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    value: 'expert',
    label: 'Expert',
    sub: 'Données brutes xG, value betting, bankroll',
    icon: Brain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
];

// ─── Step Components ─────────────────────────────────────────────────────────

function StepProfile({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-xs text-primary font-medium mb-2">
          <Zap className="h-3.5 w-3.5" />
          Analyse personnalisée
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Pour une analyse sur mesure,
          <br />
          quel est votre profil ?
        </h2>
        <p className="text-text-secondary text-sm">
          L&apos;IA adaptera ses recommandations à votre niveau
        </p>
      </div>

      <div className="space-y-3">
        {PROFILES.map((p) => {
          const Icon = p.icon;
          const isSelected = selected === p.value;
          return (
            <button
              key={p.value}
              onClick={() => onSelect(p.value)}
              className={cn(
                'w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 group',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-surface-light bg-surface hover:border-primary/40 hover:bg-surface-light'
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-primary/20' : p.bgColor
                  )}
                >
                  <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : p.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{p.label}</p>
                  <p className="text-sm text-text-muted mt-0.5">{p.sub}</p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center',
                    isSelected ? 'border-primary bg-primary' : 'border-surface-light'
                  )}
                >
                  {isSelected && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepIdentity({
  firstName,
  lastName,
  onChangeFirst,
  onChangeLast,
}: {
  firstName: string;
  lastName: string;
  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Ravi de vous accueillir !
        </h2>
        <p className="text-text-secondary text-sm">
          Comment l&apos;IA doit-elle vous appeler ?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-text-secondary">
            Prénom
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input
              id="firstName"
              type="text"
              placeholder="Ex: Jean"
              value={firstName}
              onChange={(e) => onChangeFirst(e.target.value)}
              className="pl-10 h-12 rounded-xl text-base"
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-text-secondary">
            Nom
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input
              id="lastName"
              type="text"
              placeholder="Ex: Koffi"
              value={lastName}
              onChange={(e) => onChangeLast(e.target.value)}
              className="pl-10 h-12 rounded-xl text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepWhatsApp({
  phone,
  onChange,
}: {
  phone: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Où devons-nous envoyer vos
          <br />
          alertes de tickets gagnants ?
        </h2>
        <p className="text-text-secondary text-sm">
          Recevez vos pronostics directement sur WhatsApp
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="whatsapp" className="text-sm font-medium text-text-secondary">
          Numéro WhatsApp
        </label>
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <Input
            id="whatsapp"
            type="tel"
            placeholder="+229 97 00 00 00"
            value={phone}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 h-12 rounded-xl text-base"
            autoFocus
          />
        </div>
        <p className="text-xs text-text-muted">
          Nous ne partagerons jamais votre numéro. Utilisé uniquement pour les alertes.
        </p>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-green-400">Ce que vous recevrez :</p>
        {[
          'Ticket IA du jour avant 14h',
          'Alertes de combinés à forte cote',
          'Accès au groupe VIP WhatsApp',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            <span className="text-sm text-text-secondary">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepAccount({
  email,
  password,
  confirmPassword,
  onChangeEmail,
  onChangePassword,
  onChangeConfirm,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onChangeConfirm: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-secondary/15 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-secondary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Sécurisez votre accès
          <br />
          <span className="text-primary">100% gratuit</span>
        </h2>
        <p className="text-text-secondary text-sm">
          Dernière étape pour activer votre compte IA
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-text-secondary">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl text-base"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-text-secondary">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              className="pl-10 h-12 rounded-xl text-base"
              minLength={6}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-text-secondary">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChange={(e) => onChangeConfirm(e.target.value)}
              className="pl-10 h-12 rounded-xl text-base"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        En continuant, vous acceptez nos{' '}
        <a href="/terms" className="text-primary hover:underline">
          conditions d&apos;utilisation
        </a>{' '}
        et notre{' '}
        <a href="/privacy" className="text-primary hover:underline">
          politique de confidentialité
        </a>
        .
      </p>
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-light">
          <motion.div
            className="h-full rounded-full"
            initial={false}
            animate={{
              width: i < current ? '100%' : i === current ? '50%' : '0%',
              backgroundColor: i <= current ? '#10B981' : '#334155',
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [profile, setProfile] = useState<string | null>(null);
  // Step 2
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // Step 3
  const [phone, setPhone] = useState('');
  // Step 4
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canProceed = useCallback(() => {
    switch (step) {
      case 0:
        return !!profile;
      case 1:
        return firstName.trim().length >= 2;
      case 2:
        return phone.trim().length >= 8;
      case 3:
        return (
          email.includes('@') &&
          password.length >= 6 &&
          password === confirmPassword
        );
      default:
        return false;
    }
  }, [step, profile, firstName, phone, email, password, confirmPassword]);

  async function handleNext() {
    if (!canProceed()) return;

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step: submit registration
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

      const res = await fetch('/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signup',
          email,
          password,
          fullName,
          phone,
          country: 'BJ',
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

      localStorage.setItem('pendingVerificationEmail', email);
      localStorage.setItem(
        'algopronos_profile',
        JSON.stringify({ profile, firstName, phone })
      );
      toast.success('Compte créé ! Vérifiez votre email.');
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  const stepLabels = ['Profil', 'Identité', 'WhatsApp', 'Compte'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-surface-light/50 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>100% Gratuit</span>
          <span className="mx-1">·</span>
          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
          <span>4.9/5</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-muted">
                Étape {step + 1} / {TOTAL_STEPS}
                <span className="ml-2 text-text-secondary font-medium">{stepLabels[step]}</span>
              </span>
              <span className="text-sm text-primary font-medium">
                {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
              </span>
            </div>
            <ProgressBar current={step} total={TOTAL_STEPS} />
          </div>

          {/* Step Content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <StepProfile selected={profile} onSelect={setProfile} />
                )}
                {step === 1 && (
                  <StepIdentity
                    firstName={firstName}
                    lastName={lastName}
                    onChangeFirst={setFirstName}
                    onChangeLast={setLastName}
                  />
                )}
                {step === 2 && (
                  <StepWhatsApp phone={phone} onChange={setPhone} />
                )}
                {step === 3 && (
                  <StepAccount
                    email={email}
                    password={password}
                    confirmPassword={confirmPassword}
                    onChangeEmail={setEmail}
                    onChangePassword={setPassword}
                    onChangeConfirm={setConfirmPassword}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className={cn(
                'w-full py-4 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2',
                canProceed() && !loading
                  ? 'bg-gradient-to-r from-primary to-[#00D4FF] shadow-lg shadow-primary/30 hover:opacity-90'
                  : 'bg-surface-light text-text-muted cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création du compte...
                </>
              ) : step === TOTAL_STEPS - 1 ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Créer mon compte gratuit
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            {step > 0 && (
              <button
                onClick={handleBack}
                className="w-full py-3 text-sm text-text-muted hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            )}
          </div>

          {/* Footer hint */}
          {step === 0 && (
            <p className="text-center text-xs text-text-muted mt-6">
              Questionnaire rapide · 30 secondes · 100% gratuit
            </p>
          )}
          {step === 3 && (
            <p className="text-center text-xs text-text-muted mt-4">
              Déjà un compte ?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Se connecter
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
