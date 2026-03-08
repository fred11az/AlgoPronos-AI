'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ExternalLink,
  Flame,
  Rocket,
  Shield,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa58144.com/L?tag=d_5093549m_1599c_&site=5093549&ad=1599';

// ─── Step data ────────────────────────────────────────────────────────────────

const steps = [
  {
    id: 'budget',
    question: 'Quel est ton budget mensuel pour les paris ?',
    emoji: '💰',
    options: [
      { value: 'xs', label: 'Moins de 5 000 FCFA', sub: 'Paris prudents, coups sûrs' },
      { value: 'sm', label: '5 000 – 20 000 FCFA', sub: 'Profil équilibré' },
      { value: 'md', label: '20 000 – 50 000 FCFA', sub: 'Profil actif' },
      { value: 'lg', label: '50 000 FCFA et +', sub: 'Profil expert – value betting' },
    ],
  },
  {
    id: 'level',
    question: 'Quel est ton niveau en paris sportifs ?',
    emoji: '🎯',
    options: [
      { value: 'beginner', label: 'Débutant', sub: "Je commence, j'ai besoin de guides" },
      { value: 'intermediate', label: 'Intermédiaire', sub: "Quelques mois d'expérience" },
      { value: 'advanced', label: 'Confirmé', sub: 'Je connais les marchés et les cotes' },
      { value: 'expert', label: 'Expert', sub: 'Value betting, bankroll management' },
    ],
  },
  {
    id: 'sport',
    question: 'Quel est ton sport préféré ?',
    emoji: '⚽',
    options: [
      { value: 'football', label: 'Football', sub: 'Ligue 1, Premier League, CAN…' },
      { value: 'basketball', label: 'Basketball', sub: 'NBA, EuroLeague, Pro A' },
      { value: 'tennis', label: 'Tennis', sub: 'ATP, WTA, Grand Chelem' },
      { value: 'multi', label: 'Multi-sports', sub: "J'aime tout analyser" },
    ],
  },
];

// ─── Profile generator ────────────────────────────────────────────────────────

function buildProfile(answers: Record<string, string>) {
  const levelMap: Record<string, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Confirmé',
    expert: 'Expert',
  };
  const stratMap: Record<string, string> = {
    xs: 'Coups sûrs (côtes 1.3 – 1.8)',
    sm: 'Équilibré (côtes 1.8 – 2.5)',
    md: 'Rendement (côtes 2.5 – 4.0)',
    lg: 'Value betting (côtes 2.0 – 10+)',
  };
  const sportMap: Record<string, string> = {
    football: '⚽ Football',
    basketball: '🏀 Basketball',
    tennis: '🎾 Tennis',
    multi: '🏆 Multi-sports',
  };
  const scoreMap: Record<string, number> = {
    beginner: 61,
    intermediate: 74,
    advanced: 85,
    expert: 92,
  };

  const level = answers.level || 'intermediate';
  return {
    score: scoreMap[level] ?? 74,
    niveau: levelMap[level] ?? 'Intermédiaire',
    strategie: stratMap[answers.budget ?? 'sm'],
    sport: sportMap[answers.sport ?? 'football'],
    miseReco:
      answers.budget === 'xs'
        ? '500 – 1 000 FCFA / mise'
        : answers.budget === 'sm'
        ? '1 000 – 3 000 FCFA / mise'
        : answers.budget === 'md'
        ? '3 000 – 8 000 FCFA / mise'
        : '10 000 FCFA+ / mise',
  };
}

// ─── Components ───────────────────────────────────────────────────────────────

function OptionCard({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200',
        selected
          ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
          : 'border-surface-light bg-surface hover:border-primary/40 hover:bg-surface-light'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{label}</p>
          <p className="text-sm text-text-muted mt-0.5">{sub}</p>
        </div>
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all',
            selected ? 'border-primary bg-primary' : 'border-surface-light'
          )}
        >
          {selected && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
        </div>
      </div>
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-[#00D4FF] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${((current) / total) * 100}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);

  const currentStep = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function handleSelect(value: string) {
    setSelected(value);
  }

  function handleNext() {
    if (!selected) return;
    const newAnswers = { ...answers, [currentStep.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (isLast) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setDone(true);
      }, 2800);
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  const profile = buildProfile(answers);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-5 px-6 border-b border-surface-light/50 flex items-center justify-center">
        <Logo size="sm" />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ── Analyzing screen ──────────────────────────────────────── */}
            {analyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <Brain className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Analyse de ton profil en cours…
                </h2>
                <p className="text-text-secondary mb-8">
                  L&apos;IA calcule ta stratégie optimale
                </p>
                <div className="space-y-3 text-left max-w-xs mx-auto">
                  {[
                    'Calibrage du niveau de risque',
                    'Sélection des marchés optimaux',
                    'Génération du profil IA',
                  ].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.7 }}
                      className="flex items-center gap-3 text-sm text-text-secondary"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      {step}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Result screen ──────────────────────────────────────────── */}
            {done && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Score badge */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 px-4 py-2 rounded-full mb-4">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-success text-sm font-medium">Profil IA créé avec succès</span>
                  </div>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1e2535" strokeWidth="8" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="url(#scoreGrad)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{
                          strokeDashoffset: 2 * Math.PI * 42 * (1 - profile.score / 100),
                        }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7C3AED" />
                          <stop offset="100%" stopColor="#00D4FF" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">{profile.score}</span>
                      <span className="text-xs text-text-muted">/100</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Score AlgoPronos AI</h2>
                </div>

                {/* Profile details */}
                <div className="bg-surface rounded-2xl border border-surface-light p-5 mb-6 space-y-3">
                  <ProfileRow icon={<Star className="h-4 w-4 text-yellow-400" />} label="Niveau" value={profile.niveau} />
                  <ProfileRow icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Stratégie IA" value={profile.strategie} />
                  <ProfileRow icon={<Flame className="h-4 w-4 text-orange-400" />} label="Sport principal" value={profile.sport} />
                  <ProfileRow icon={<Zap className="h-4 w-4 text-[#00D4FF]" />} label="Mise recommandée" value={profile.miseReco} />
                </div>

                {/* Benefits */}
                <div className="bg-gradient-to-br from-primary/10 to-[#00D4FF]/10 border border-primary/30 rounded-2xl p-5 mb-6">
                  <p className="text-sm font-semibold text-white mb-3">
                    🎁 Ce que tu débloques avec ton compte optimisé :
                  </p>
                  {[
                    'Analyses IA illimitées chaque semaine',
                    'Pronostics calibrés pour ton profil',
                    'Bonus jusqu\'à 250 000 FCFA sur ton compte',
                    'Accès à tous les championnats',
                  ].map((b) => (
                    <div key={b} className="flex items-center gap-2 py-1">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-text-secondary">{b}</span>
                    </div>
                  ))}
                </div>

                {/* CTA principal */}
                <a
                  href={AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-primary to-[#00D4FF] text-white font-bold py-5 rounded-2xl hover:opacity-90 transition-opacity text-center text-lg shadow-xl shadow-primary/30"
                >
                  <Rocket className="inline-block mr-2 h-5 w-5" />
                  Activer Mon Compte Gratuit
                  <ExternalLink className="inline-block ml-2 h-4 w-4" />
                </a>

                {/* Trust */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-primary" /> 100% Sécurisé
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /> 4.9/5
                  </span>
                  <span>Sans carte bancaire · Sans engagement</span>
                </div>
              </motion.div>
            )}

            {/* ── Question steps ─────────────────────────────────────────── */}
            {!analyzing && !done && (
              <motion.div
                key={`step-${stepIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2 text-sm text-text-muted">
                    <span>Étape {stepIndex + 1} / {steps.length}</span>
                    <span>{Math.round(((stepIndex) / steps.length) * 100)}%</span>
                  </div>
                  <ProgressBar current={stepIndex} total={steps.length} />
                </div>

                {/* Question */}
                <div className="text-center mb-8">
                  <span className="text-4xl mb-4 block">{currentStep.emoji}</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {currentStep.question}
                  </h2>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-8">
                  {currentStep.options.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      label={opt.label}
                      sub={opt.sub}
                      selected={selected === opt.value}
                      onClick={() => handleSelect(opt.value)}
                    />
                  ))}
                </div>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  disabled={!selected}
                  className={cn(
                    'w-full py-4 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2',
                    selected
                      ? 'bg-gradient-to-r from-primary to-[#00D4FF] shadow-lg shadow-primary/30 hover:opacity-90'
                      : 'bg-surface-light text-text-muted cursor-not-allowed'
                  )}
                >
                  {isLast ? 'Générer mon profil IA' : 'Continuer'}
                  <ArrowRight className="h-5 w-5" />
                </button>

                {stepIndex === 0 && (
                  <p className="text-center text-xs text-text-muted mt-4">
                    Questionnaire rapide · 30 secondes · 100% gratuit
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-text-muted text-sm">
        {icon}
        {label}
      </div>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}
