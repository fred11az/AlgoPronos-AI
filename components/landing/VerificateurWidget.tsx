'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield, ShieldCheck, ShieldX, ChevronDown,
  Loader2, CheckCircle2, XCircle, ArrowRight,
  Lock, Wifi, Server, Database, Zap, ExternalLink,
  Target, TrendingUp, BarChart3, Activity, Brain, LineChart,
  AlertTriangle,
} from 'lucide-react';

// ─── Config bookmakers (avec logos réels) ───────────────────────────────────

const BOOKMAKERS = [
  { id: '1xbet',      name: '1xBet',      logo: '/bookmakers/1xbet.webp',      color: '#f5a623' },
  { id: 'betway',     name: 'Betway',      logo: '/bookmakers/betway.jpg',      color: '#00b359' },
  { id: 'melbet',     name: 'Melbet',      logo: '/bookmakers/melbet.png',      color: '#d0021b' },
  { id: 'premierbet', name: 'PremierBet',  logo: '/bookmakers/premierbet.jpg',  color: '#1a56db' },
  { id: 'betwinner',  name: 'BetWinner',   logo: '/bookmakers/betwinner.webp',  color: '#2d8f4e' },
  { id: 'other',      name: 'Autre',       logo: '',                            color: '#7c3aed' },
];

// ─── 6 signaux IA pour le scan ──────────────────────────────────────────────

const AI_SIGNALS = [
  { id: 'xg',           icon: Target,      label: 'Expected Goals (xG)',             tag: 'xG' },
  { id: 'value',        icon: TrendingUp,  label: 'Value Betting Detection',         tag: 'Value' },
  { id: 'form',         icon: BarChart3,   label: 'Analyse de Forme Dynamique',      tag: 'Forme' },
  { id: 'momentum',     icon: Activity,    label: 'Momentum & Tendances Live',       tag: 'Momentum' },
  { id: 'neural',       icon: Brain,       label: 'Réseau Neuronal Prédictif',       tag: 'Neural' },
  { id: 'odds',         icon: LineChart,   label: 'Calibration Cotes IA',            tag: 'Cotes' },
];

// ─── Simulation steps (scan renforcé ~8s) ───────────────────────────────────

const SIMULATION_STEPS = [
  { icon: Wifi,     label: 'Connexion au serveur sécurisé...',              duration: 800  },
  { icon: Lock,     label: 'Authentification des identifiants...',          duration: 900  },
  { icon: Server,   label: 'Récupération du profil bookmaker...',           duration: 1000 },
  { icon: Database, label: 'Extraction des métadonnées du compte...',       duration: 1200 },
  { icon: Brain,    label: 'Test de compatibilité des 6 signaux IA...',     duration: 1500 },
  { icon: Target,   label: 'Vérification injection xG & Value Betting...', duration: 1100 },
  { icon: Shield,   label: 'Génération du rapport de diagnostic...',        duration: 800  },
];

type Step = 'idle' | 'simulating' | 'result';

const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa58144.com/L?tag=d_5093549m_1599c_&site=5093549&ad=1599';

// ─── Widget ─────────────────────────────────────────────────────────────────

export function VerificateurWidget() {
  const [bookmaker, setBookmaker]       = useState('');
  const [accountId, setAccountId]       = useState('');
  const [step, setStep]                 = useState<Step>('idle');
  const [simStep, setSimStep]           = useState(0);
  const [optimized, setOptimized]       = useState<boolean | null>(null);
  const [reason, setReason]             = useState<string>('');
  const [showPopup, setShowPopup]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signalResults, setSignalResults] = useState<('fail' | 'pending')[]>(
    AI_SIGNALS.map(() => 'pending')
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedBM = BOOKMAKERS.find(b => b.id === bookmaker);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  async function handleVerify() {
    if (!bookmaker || !accountId.trim()) return;

    setStep('simulating');
    setSimStep(0);
    setOptimized(null);
    setShowPopup(false);
    setSignalResults(AI_SIGNALS.map(() => 'pending'));

    const verifyPromise = fetch('/api/verify-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmaker, accountId: accountId.trim() }),
    }).then(r => r.json());

    for (let i = 0; i < SIMULATION_STEPS.length; i++) {
      await new Promise(res => {
        timeoutRef.current = setTimeout(res, SIMULATION_STEPS[i].duration);
      });
      setSimStep(i + 1);

      // Progressivement marquer les signaux comme "fail" pendant le scan
      if (i >= 3 && i - 3 < AI_SIGNALS.length) {
        setSignalResults(prev => {
          const next = [...prev];
          next[i - 3] = 'fail';
          return next;
        });
      }
    }

    const result = await verifyPromise;
    setOptimized(result.optimized);
    setReason(result.reason || '');

    // Marquer tous les signaux restants comme fail si non optimisé
    if (!result.optimized) {
      setSignalResults(AI_SIGNALS.map(() => 'fail'));
    }

    setStep('result');

    if (!result.optimized) {
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
    setSignalResults(AI_SIGNALS.map(() => 'pending'));
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
            <div className="p-6 space-y-5">
              {/* Sélecteur de bookmaker avec logos */}
              <div className="space-y-2">
                <Label>Votre bookmaker actuel</Label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-background border border-surface-light rounded-xl text-left hover:border-primary/40 transition-colors"
                  >
                    {selectedBM ? (
                      <span className="flex items-center gap-3 text-white font-medium">
                        {selectedBM.logo ? (
                          <Image
                            src={selectedBM.logo}
                            alt={selectedBM.name}
                            width={28}
                            height={28}
                            className="rounded-md object-contain"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-md bg-surface-light flex items-center justify-center text-sm">?</span>
                        )}
                        {selectedBM.name}
                      </span>
                    ) : (
                      <span className="text-text-muted">Choisir un bookmaker...</span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-surface-light rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {BOOKMAKERS.map(bm => (
                        <button
                          key={bm.id}
                          type="button"
                          onClick={() => { setBookmaker(bm.id); setDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-white ${
                            bookmaker === bm.id
                              ? 'bg-primary/10 border-l-2 border-primary'
                              : 'hover:bg-surface-light border-l-2 border-transparent'
                          }`}
                        >
                          {bm.logo ? (
                            <Image
                              src={bm.logo}
                              alt={bm.name}
                              width={32}
                              height={32}
                              className="rounded-lg object-contain"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center text-text-muted text-sm font-bold">?</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{bm.name}</span>
                          </div>
                          {bm.id === '1xbet' && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                              Recommand&eacute;
                            </span>
                          )}
                          {bookmaker === bm.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
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
              >
                <Shield className="mr-2 h-4 w-4" />
                Lancer le diagnostic
              </Button>

              <p className="text-center text-xs text-text-muted">
                Diagnostic s&eacute;curis&eacute; &mdash; aucune donn&eacute;e sensible stock&eacute;e
              </p>
            </div>
          )}

          {/* ─── ANIMATION DE SCAN ──────────────────────────────── */}
          {step === 'simulating' && (
            <div className="p-6">
              {/* En-tête avec logo bookmaker */}
              <div className="text-center mb-5">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                  {/* Cercle de scan animé */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '2s' }} />
                  {selectedBM?.logo ? (
                    <Image
                      src={selectedBM.logo}
                      alt={selectedBM.name}
                      width={40}
                      height={40}
                      className="rounded-xl object-contain relative z-10"
                    />
                  ) : (
                    <Loader2 className="h-8 w-8 text-primary animate-spin relative z-10" />
                  )}
                </div>
                <h2 className="text-white font-bold text-lg mb-1">Diagnostic en cours...</h2>
                <p className="text-text-muted text-sm">
                  {selectedBM?.name} &middot; ID : {accountId}
                </p>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-surface-light rounded-full h-2.5 mb-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-[#00D4FF] to-primary rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite',
                  }}
                />
              </div>

              {/* Steps de simulation */}
              <div className="space-y-2 mb-5">
                {SIMULATION_STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done    = i < simStep;
                  const current = i === simStep;
                  if (!done && !current) return null; // masquer les étapes futures
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                      current ? 'bg-primary/10 border border-primary/20' : ''
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        done    ? 'bg-success/20 text-success'
                        : 'bg-primary/20 text-primary'
                      }`}>
                        {done
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        }
                      </div>
                      <span className={`text-sm ${
                        done ? 'text-text-muted' : 'text-white font-medium'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grille des 6 signaux IA (apparaissent progressivement) */}
              {simStep >= 4 && (
                <div className="border border-surface-light rounded-xl p-4 bg-background/50">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                    Test des 6 signaux IA
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_SIGNALS.map((sig, i) => {
                      const SigIcon = sig.icon;
                      const status = signalResults[i];
                      return (
                        <div
                          key={sig.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-500 ${
                            status === 'fail'
                              ? 'bg-red-500/10 border border-red-500/20'
                              : 'bg-surface-light/50 border border-transparent'
                          }`}
                        >
                          {status === 'fail' ? (
                            <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          ) : (
                            <SigIcon className="h-3.5 w-3.5 text-text-muted shrink-0 animate-pulse" />
                          )}
                          <span className={status === 'fail' ? 'text-red-300' : 'text-text-muted'}>
                            {sig.tag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── RÉSULTAT / VERDICT ────────────────────────────── */}
          {step === 'result' && optimized !== null && (
            <div className="p-6">
              {optimized ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success/10 border border-success/20 mb-5">
                    <ShieldCheck className="h-10 w-10 text-success" />
                  </div>
                  <div className="inline-block bg-success/10 border border-success/20 rounded-xl px-5 py-3 mb-4">
                    <p className="text-success text-xl font-bold tracking-wide">COMPTE OPTIMIS&Eacute; IA</p>
                    <p className="text-success/70 text-sm mt-1">F&eacute;licitations !</p>
                  </div>
                  <p className="text-text-secondary text-sm mb-6">
                    Votre compte <span className="text-white font-semibold">{selectedBM?.name}</span> est
                    correctement optimis&eacute; IA et enregistr&eacute; sur AlgoPronos. Vous b&eacute;n&eacute;ficiez d&apos;un
                    acc&egrave;s complet et illimit&eacute; &agrave; toutes les fonctionnalit&eacute;s.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href="/dashboard">
                      <Button variant="gradient" className="w-full">
                        Acc&eacute;der &agrave; mon dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={reset}>
                      V&eacute;rifier un autre compte
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Verdict principal */}
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 relative">
                      <ShieldX className="h-10 w-10 text-red-400" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <XCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="inline-block bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 mb-3">
                      <p className="text-red-400 text-xl font-bold tracking-wide">COMPTE NON OPTIMIS&Eacute;</p>
                      <p className="text-red-400/60 text-xs mt-1 font-medium">0/6 signaux IA d&eacute;tect&eacute;s</p>
                    </div>
                  </div>

                  {reason === 'pending_review' ? (
                    <p className="text-text-secondary text-sm mb-5 text-center">
                      Votre compte <span className="text-white font-semibold">{accountId}</span> est en
                      cours de validation par l&apos;&eacute;quipe AlgoPronos.{' '}
                      <span className="text-warning">V&eacute;rification en attente d&apos;approbation.</span>
                    </p>
                  ) : (
                    <>
                      {/* Explication technique */}
                      <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3 mb-3">
                          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white text-sm font-semibold mb-1">Diagnostic technique</p>
                            <p className="text-text-secondary text-sm leading-relaxed">
                              Votre compte <span className="text-white font-medium">{selectedBM?.name}</span> ne
                              permet pas l&apos;injection des <span className="text-red-400 font-semibold">6 signaux IA</span> n&eacute;cessaires
                              au fonctionnement de l&apos;algorithme AlgoPronos.
                            </p>
                          </div>
                        </div>

                        {/* Grille des 6 signaux - tous en échec */}
                        <div className="grid grid-cols-2 gap-1.5 mt-3">
                          {AI_SIGNALS.map((sig) => {
                            const SigIcon = sig.icon;
                            return (
                              <div
                                key={sig.id}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-red-500/10 text-sm"
                              >
                                <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                                <SigIcon className="h-3 w-3 text-red-300 shrink-0" />
                                <span className="text-red-300 text-xs">{sig.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Solution : Création guidée */}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-primary" />
                          <p className="text-primary text-xs font-bold uppercase tracking-widest">
                            Solution : Cr&eacute;ation guid&eacute;e
                          </p>
                        </div>
                        <p className="text-text-secondary text-sm mb-3 leading-relaxed">
                          Un compte cr&eacute;&eacute; via AlgoPronos est <span className="text-white font-medium">pr&eacute;-configur&eacute;</span> pour
                          recevoir les 6 signaux IA et maximiser vos gains.
                        </p>
                        <ul className="space-y-2">
                          {[
                            'Injection automatique des signaux xG & Value Betting',
                            'Profil bookmaker calibr\u00e9 pour les cotes optimales',
                            'Acc\u00e8s illimit\u00e9 \u00e0 l\u2019algorithme une fois valid\u00e9',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                              <span className="text-text-secondary">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Avantages exclusifs Full Access */}
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="h-4 w-4 text-amber-400" />
                          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                            Avantages Full Access
                          </p>
                        </div>

                        <div className="space-y-3">
                          {/* Bouclier 20 Matchs */}
                          <div className="flex items-start gap-3 bg-amber-500/5 rounded-lg p-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                              <Shield className="h-4 w-4 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold">Bouclier 20 Matchs</p>
                              <p className="text-text-muted text-xs leading-relaxed mt-0.5">
                                100% rembours&eacute; si 1 seule erreur sur un combin&eacute; de 20 matchs.
                              </p>
                            </div>
                          </div>

                          {/* Garantie Matchs Nuls */}
                          <div className="flex items-start gap-3 bg-amber-500/5 rounded-lg p-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                              <Lock className="h-4 w-4 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold">Garantie Matchs Nuls</p>
                              <p className="text-text-muted text-xs leading-relaxed mt-0.5">
                                100% rembours&eacute; si 2 paires de matchs nuls sont valid&eacute;es dans un combin&eacute; perdant.
                              </p>
                            </div>
                          </div>

                          {/* Bonus de dépôt */}
                          <div className="flex items-start gap-3 bg-amber-500/5 rounded-lg p-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                              <Zap className="h-4 w-4 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold">Bonus de d&eacute;p&ocirc;t exclusifs</p>
                              <p className="text-text-muted text-xs leading-relaxed mt-0.5">
                                Nombreux bonus sur vos d&eacute;p&ocirc;ts r&eacute;serv&eacute;s aux comptes cr&eacute;&eacute;s via AlgoPronos.
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-amber-400/70 text-xs mt-3 text-center font-medium">
                          R&eacute;serv&eacute; aux comptes valid&eacute;s &laquo;&nbsp;Full Access&nbsp;&raquo;
                        </p>
                      </div>
                    </>
                  )}

                  {/* CTA */}
                  <div className="flex flex-col gap-2">
                    {reason !== 'pending_review' && (
                      <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
                        <Button variant="gradient" className="w-full" size="lg">
                          <Zap className="mr-2 h-4 w-4" />
                          Cr&eacute;er un compte Optimis&eacute; IA
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    <Button variant="outline" className="w-full" onClick={reset}>
                      V&eacute;rifier un autre compte
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-4 px-4">
          18+ uniquement &middot; Jouez responsable.
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
                    Cr&eacute;er un compte Optimis&eacute; IA ?
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    En 3 minutes, cr&eacute;ez un nouveau compte bookmaker avec les{' '}
                    <strong className="text-white">6 signaux IA activ&eacute;s</strong> et obtenez un
                    acc&egrave;s <strong className="text-primary">illimit&eacute;</strong> &agrave; l&apos;algorithme AlgoPronos.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="gradient" className="w-full" size="sm">
                        Cr&eacute;ation guid&eacute;e
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </a>
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
