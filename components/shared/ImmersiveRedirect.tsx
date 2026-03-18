'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, Zap, BarChart3, Binary, Cpu, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  icon: any;
  duration: number;
}

const steps: Step[] = [
  { id: 1, label: 'Analyse automatisée des matchs', icon: BarChart3, duration: 1500 },
  { id: 2, label: 'Création des patchs de données', icon: Binary, duration: 1200 },
  { id: 3, label: 'Détection des Bet Values', icon: Zap, duration: 1000 },
  { id: 4, label: 'Gestion du risque personnalisé', icon: ShieldCheck, duration: 1200 },
  { id: 5, label: 'Génération rapide de combiné IA', icon: Cpu, duration: 1300 },
  { id: 6, label: 'Synchronisation avec le compte {bookmaker}', icon: Loader2, duration: 1500 },
];

interface ImmersiveRedirectProps {
  url: string;
  bookmaker?: string;
}

export function ImmersiveRedirect({ url, bookmaker = 'Partenaire' }: ImmersiveRedirectProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;

    const runSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        // Simulate progress within the step
        const stepDuration = steps[i].duration;
        const startTime = Date.now();
        
        while (Date.now() - startTime < stepDuration) {
          const elapsed = Date.now() - startTime;
          const stepProgress = (i / steps.length) * 100 + (elapsed / stepDuration) * (100 / steps.length);
          setProgress(Math.min(stepProgress, 99));
          await new Promise(r => setTimeout(r, 50));
        }
      }
      
      setProgress(100);
      setIsComplete(true);
      
      // Final delay before redirection
      timer = setTimeout(() => {
        window.location.href = url;
      }, 800);
    };

    runSteps();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0F1E] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Neural Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="max-w-md w-full relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
             <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center relative z-10 shadow-2xl shadow-primary/40 border border-white/10">
                <Cpu className="w-12 h-12 text-white animate-pulse" />
             </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-white tracking-tight">
             Connexion Algo-Optimisée
          </h2>
          <p className="text-blue-400 font-mono text-sm mt-2 opacity-80">
             INITIALIZING SECURE GATEWAY...
          </p>
        </motion.div>

        {/* Steps History */}
        <div className="space-y-4 mb-10 text-left">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isFinished = idx < currentStep;
            const Icon = step.icon;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: isActive || isFinished ? 1 : 0.3,
                  x: 0,
                  scale: isActive ? 1.05 : 1
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                  isActive 
                    ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' 
                    : isFinished 
                    ? 'bg-transparent border-transparent' 
                    : 'bg-transparent border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/50' : 
                  isFinished ? 'bg-green-500/20 text-green-500' : 'bg-surface-light text-text-muted'
                }`}>
                  {isFinished ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : isActive && isActive ? (
                    <Icon className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : isFinished ? 'text-green-500/80' : 'text-text-muted'
                  }`}>
                    {step.label.replace('{bookmaker}', bookmaker)}
                  </p>
                  {isActive && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: step.duration / 1000, ease: "linear" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {isFinished && (
                   <motion.div
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="text-green-500 text-xs font-mono"
                   >
                     OK
                   </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                {isComplete ? 'Synchronisation Terminée' : 'Optimisation en cours'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-semibold inline-block text-primary">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-white/5">
            <motion.div
              animate={{ width: `${progress}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                isComplete ? 'bg-green-500' : 'bg-primary'
              } transition-colors duration-500`}
            />
          </div>
        </div>

        <AnimatePresence>
          {isComplete && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white font-medium flex items-center justify-center gap-2 mt-4"
            >
              Redirection sécurisée vers {bookmaker}...
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-12 space-y-2 opacity-40">
           <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
             © ALGO-ENCRYPT SYSTEM 4.0 // SECURE BYPASS ENABLED
           </p>
        </div>
      </div>
    </div>
  );
}
