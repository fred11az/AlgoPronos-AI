'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield, ShieldCheck, ShieldX, ChevronDown,
  Loader2, CheckCircle2, XCircle, ArrowRight,
  Lock, Wifi, Server, Database, Zap, ExternalLink,
} from 'lucide-react';

// ─── Config bookmakers ─────────────────────────────────────────────────────

const BOOKMAKERS = [
  { id: '1xbet',      name: '1xBet',      logo: '⭐', color: '#10b981' },
  { id: 'betway',     name: 'Betway',      logo: '🟢', color: '#00b359' },
  { id: 'melbet',     name: 'Melbet',      logo: '🔴', color: '#d0021b' },
  { id: 'premierbet', name: 'PremierBet',  logo: '🔵', color: '#1a56db' },
  { id: 'paripesa',   name: 'Paripesa',    logo: '⚪', color: '#6b7280' },
  { id: 'afropari',   name: 'AfroPari',    logo: '🟠', color: '#FF6B00' },
  { id: 'other',      name: 'Autre',       logo: '🎯', color: '#7c3aed' },
];

// ─── Simulation steps ─────────────────────────────────────────────────────

const SIMULATION_STEPS = [
  { icon: Wifi,     label: 'Connexion au serveur sécurisé…',       duration: 900  },
  { icon: Lock,     label: 'Authentification des identifiants…',    duration: 1100 },
  { icon: Server,   label: 'Récupération du profil bookmaker…',     duration: 1300 },
  { icon: Database, label: 'Analyse des paramètres du compte…',     duration: 1400 },
  { icon: Zap,      label: "Vérification de l'optimisation IA…",    duration: 1000 },
  { icon: Shield,   label: 'Génération du rapport AlgoPronos…',     duration: 700  },
];

type Step = 'idle' | 'simulating' | 'result';

const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

// ─── Widget ───────────────────────────────────────────────────────────────
interface VerificateurWidgetProps {
  compact?: boolean;
}

export function VerificateurWidget({ compact }: VerificateurWidgetProps) {
  const [bookmaker, setBookmaker]     = useState('');
  const [accountId, setAccountId]     = useState('');
  const [step, setStep]               = useState<Step>('idle');
  const [simStep, setSimStep]         = useState(0);
  const [optimized, setOptimized]     = useState<boolean | null>(null);
  const [reason, setReason]           = useState<string>('');
  const [showPopup, setShowPopup]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedBM = BOOKMAKERS.find(b => b.id === bookmaker);

  async function handleVerify() {
    if (!bookmaker || !accountId.trim()) return;

    setStep('simulating');
    setSimStep(0);
    setOptimized(null);
    setShowPopup(false);

    const verifyPromise = fetch('/api/verify-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmaker, accountId: accountId.trim() }),
    }).then(r => r.json());

    let elapsed = 0;
    for (let i = 0; i < SIMULATION_STEPS.length; i++) {
      await new Promise(res => {
        timeoutRef.current = setTimeout(res, SIMULATION_STEPS[i].duration);
      });
      elapsed += SIMULATION_STEPS[i].duration;
      setSimStep(i + 1);
    }

    const result = await verifyPromise;
    setOptimized(result.optimized);
    setReason(result.reason || '');
    setStep('result');

    if (!result.optimized) {
      // Délai augmenté : 2500ms pour laisser l'utilisateur lire le résultat
      setTimeout(() => setShowPopup(true), 2500);
    }
  }

  function reset() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStep('idle');
    setSimStep(0);
    setOptimized(null);
    setShowPopup(false);
    setAccountId('');
  }

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const progress = step === 'simulating'
    ? Math.round((simStep / SIMULATION_STEPS.length) * 100)
    : step === 'result' ? 100 : 0;

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <div className="bg-surface border border-surface-light rounded-2xl overflow-hidden shadow-xl">

          {/* ─── FORMULAIRE ─────────────────────────────────── */}
          {step === 'idle' && (
            <div className={compact ? "p-4 space-y-3" : "p-6 space-y-5"}>
              {/* Bookmaker */}
              <div className="space-y-2">
                <Label>Votre bookmaker actuel</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-background border border-surface-light rounded-xl text-left hover:border-primary/40 transition-colors"
                  >
                    {selectedBM ? (
                      <span className="flex items-center gap-2 text-white font-medium">
                        <span>{selectedBM.logo}</span> {selectedBM.name}
                      </span>
                    ) : (
                      <span className="text-text-muted">Choisir un bookmaker…</span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-surface-light rounded-xl shadow-lg overflow-hidden">
                      {BOOKMAKERS.map(bm => (
                        <button
                          key={bm.id}
                          type="button"
                          onClick={() => { setBookmaker(bm.id); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-light transition-colors text-white relative"
                        >
                          <span className="text-lg">{bm.logo}</span>
                          <span className="font-medium">{bm.name}</span>
                          {bm.id === '1xbet' && (
                            <div className="absolute -top-3 -right-3 bg-primary text-secondary-dark text-[10px] font-black px-2 py-1 rounded-lg shadow-lg rotate-12">
                              SAUCE PRO
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ID */}
              <div className="space-y-2">
                <Label htmlFor="accountId">Votre ID de compte</Label>
                <Input
                  id="accountId"
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  placeholder="Ex: 123456789"
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                />
                <p className="text-xs text-text-muted">
                  Retrouvez votre ID dans votre profil du site ou de l&apos;application bookmaker.
                </p>
              </div>

              <Button
                variant="gradient"
                className="w-full"
                onClick={handleVerify}
                disabled={!bookmaker || !accountId.trim()}
                size={compact ? "sm" : "lg"}
              >
                <Shield className="mr-2 h-4 w-4" />
                Vérifier mon compte
              </Button>

              <p className="text-center text-xs text-text-muted">
                🔒 Vérification sécurisée — aucune donnée sensible stockée
              </p>
            </div>
          )}

          {/* ─── SIMULATION ──────────────────────────────────── */}
          {step === 'simulating' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h2 className="text-white font-bold text-lg mb-1">Analyse en cours…</h2>
                <p className="text-text-muted text-sm">
                  {selectedBM?.name} · ID : {accountId}
                </p>
              </div>

              <div className="w-full bg-surface-light rounded-full h-2 mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[#00D4FF] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-3">
                {SIMULATION_STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done    = i < simStep;
                  const current = i === simStep;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      current ? 'bg-primary/10 border border-primary/20' : ''
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        done    ? 'bg-success/20 text-success'
                        : current ? 'bg-primary/20 text-primary'
                        : 'bg-surface-light text-text-muted'
                      }`}>
                        {done
                          ? <CheckCircle2 className="h-4 w-4" />
                          : current
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Icon className="h-4 w-4" />
                        }
                      </div>
                      <span className={`text-sm ${
                        done    ? 'text-text-secondary line-through opacity-60'
                        : current ? 'text-white font-medium'
                        : 'text-text-muted'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── RÉSULTAT ────────────────────────────────────── */}
          {step === 'result' && optimized !== null && (
            <div className="p-6">
              {optimized ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success/10 border border-success/20 mb-5">
                    <ShieldCheck className="h-10 w-10 text-success" />
                  </div>
                  <div className="inline-block bg-success/10 border border-success/20 rounded-xl px-5 py-3 mb-4">
                    <p className="text-success text-xl font-bold tracking-wide">COMPTE OPTIMISÉ IA ✅</p>
                    <p className="text-success/70 text-sm mt-1">Félicitations !</p>
                  </div>
                  <p className="text-text-secondary text-sm mb-6">
                    Votre compte <span className="text-white font-semibold">{selectedBM?.name}</span> est
                    correctement optimisé IA et enregistré sur AlgoPronos. Vous bénéficiez d&apos;un
                    accès complet et illimité à toutes les fonctionnalités.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href="/dashboard">
                      <Button variant="gradient" className="w-full">
                        Accéder à mon dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={reset}>
                      Vérifier un autre compte
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
                    <ShieldX className="h-10 w-10 text-red-400" />
                  </div>
                  <div className="inline-block bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 mb-4">
                    <p className="text-red-400 text-xl font-bold tracking-wide">COMPTE NON OPTIMISÉ IA ❌</p>
                  </div>
                  {reason === 'pending_review' ? (
                    <p className="text-text-secondary text-sm mb-6">
                      Votre compte <span className="text-white font-semibold">{accountId}</span> est en
                      cours de validation par l&apos;équipe AlgoPronos.{' '}
                      <span className="text-warning">Vérification en attente d&apos;approbation.</span>
                    </p>
                  ) : (
                    <p className="text-text-secondary text-sm mb-6">
                      Votre compte actuel <span className="text-white font-semibold">{selectedBM?.name}</span> n&apos;est
                      pas enregistré comme optimisé IA sur AlgoPronos. Les comptes existants sont
                      généralement <span className="text-white">non éligibles</span> — il faut en créer
                      un nouveau en suivant les étapes AlgoPronos.
                    </p>
                  )}
                  {reason !== 'pending_review' && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 text-left">
                      <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">
                        Pourquoi créer un nouveau compte ?
                      </p>
                      <ul className="text-text-secondary text-sm space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">→</span>
                          Les paramètres de profil bookmaker impactent les cotes proposées
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">→</span>
                          Un compte créé via AlgoPronos est configuré pour maximiser les gains
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">→</span>
                          Accès illimité à l&apos;algorithme IA une fois validé
                        </li>
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {reason !== 'pending_review' && (
                      <Link href={`/redirect?url=${encodeURIComponent(AFFILIATE_URL)}&bookmaker=1xBet`} className="w-full">
                        <Button variant="gradient" className="w-full">
                          <Zap className="mr-2 h-4 w-4" />
                          Créer un compte Optimisé IA
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" className="w-full" onClick={reset}>
                      Vérifier un autre compte
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-4 px-4">
          18+ uniquement · Jouez responsable.
        </p>
      </div>

      {/* ─── POPUP "Créer un compte Optimisé IA" ─────────────────────────────── */}
      {showPopup && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />
          <div className="fixed z-50 inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 sm:w-full sm:max-w-md">
            <div className="bg-surface border border-primary/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg mb-1">
                    Créer un compte Optimisé IA ?
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    En 3 minutes, créez un nouveau compte bookmaker optimisé IA via AlgoPronos
                    et obtenez un accès <strong className="text-white">illimité</strong> à l&apos;algorithme.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/redirect?url=${encodeURIComponent(AFFILIATE_URL)}&bookmaker=1xBet`} className="flex-1">
                      <Button variant="gradient" className="w-full" size="sm">
                        Créer mon compte
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setShowPopup(false)}>
                      Plus tard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
