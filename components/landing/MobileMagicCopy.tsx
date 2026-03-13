'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, Check, ExternalLink, Copy } from 'lucide-react';

interface Props {
  affiliateUrl: string;
  promoCode?: string;
}

type Phase = 'idle' | 'copying' | 'copied' | 'redirecting';

const REDIRECT_DELAY_MS = 1500;

export function MobileMagicCopy({
  affiliateUrl,
  promoCode = 'ALGOPRONOS',
}: Props) {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [progress, setProgress]   = useState(0);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef                    = useRef<number | null>(null);
  const startRef                  = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current)  clearTimeout(timerRef.current);
      if (rafRef.current)    cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function handleClick() {
    if (phase !== 'idle') return;

    // 1. Copy to clipboard
    setPhase('copying');
    try {
      await navigator.clipboard.writeText(promoCode);
    } catch {
      // Fallback for older browsers / HTTP
      const el = document.createElement('textarea');
      el.value = promoCode;
      el.style.position = 'fixed';
      el.style.opacity  = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    // 2. Show "Copié !" state + animate progress bar
    setPhase('copied');
    setProgress(0);
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const pct     = Math.min((elapsed / REDIRECT_DELAY_MS) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    // 3. Redirect after delay
    timerRef.current = setTimeout(() => {
      setPhase('redirecting');
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      // Reset after short pause so user sees the redirecting state
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 2000);
    }, REDIRECT_DELAY_MS);
  }

  return (
    // md:hidden → mobile only
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      role="complementary"
      aria-label="Activer compte IA — mobile"
    >
      {/* Progress bar — fills during countdown */}
      <div className="h-0.5 bg-surface-light">
        <div
          className="h-full bg-gradient-to-r from-primary to-[#00D4FF] transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        onClick={handleClick}
        disabled={phase === 'redirecting'}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 transition-all duration-300 active:scale-[0.99] select-none
          ${phase === 'idle'
            ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90'
            : phase === 'copied' || phase === 'copying'
            ? 'bg-gradient-to-r from-green-600 to-green-500'
            : 'bg-gradient-to-r from-secondary to-secondary/80'
          }`}
        aria-label={
          phase === 'idle'
            ? `Activer compte IA — code ${promoCode}`
            : phase === 'copied'
            ? 'Code copié, redirection en cours'
            : 'Redirection vers 1xBet'
        }
      >
        {/* Left — Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
          ${phase === 'idle' ? 'bg-white/15' : 'bg-white/20'}`}
        >
          {phase === 'idle' || phase === 'copying' ? (
            <Copy className="h-4 w-4 text-white" />
          ) : phase === 'copied' ? (
            <Check className="h-4 w-4 text-white" />
          ) : (
            <ExternalLink className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Center — Text */}
        <div className="flex-1 text-left">
          {phase === 'idle' && (
            <>
              <div className="text-white font-black text-sm uppercase tracking-wide leading-tight">
                Activer mon Compte IA
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-white/70 text-xs">CODE :</span>
                <span className="text-white font-black text-xs tracking-widest bg-white/10 rounded px-1.5 py-0.5">
                  {promoCode}
                </span>
              </div>
            </>
          )}

          {(phase === 'copying' || phase === 'copied') && (
            <>
              <div className="text-white font-black text-sm leading-tight flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Code copié !
              </div>
              <div className="text-white/80 text-xs mt-0.5">
                Redirection 1xBet dans 1.5 s…
              </div>
            </>
          )}

          {phase === 'redirecting' && (
            <>
              <div className="text-white font-black text-sm leading-tight">
                Ouverture 1xBet…
              </div>
              <div className="text-white/80 text-xs mt-0.5">
                Collez le code <strong>{promoCode}</strong> lors de l&apos;inscription
              </div>
            </>
          )}
        </div>

        {/* Right — Icon */}
        <div className="flex-shrink-0">
          {phase === 'idle' && (
            <Zap className="h-5 w-5 text-white/80" />
          )}
          {(phase === 'copied' || phase === 'copying') && (
            <span className="text-white text-xs font-bold">
              {Math.round(progress)}%
            </span>
          )}
          {phase === 'redirecting' && (
            <ExternalLink className="h-5 w-5 text-white/80" />
          )}
        </div>
      </button>

      {/* Safe area for iOS home indicator */}
      <div className={`h-safe-area-inset-bottom
        ${phase === 'idle'
          ? 'bg-primary/80'
          : phase === 'copied' || phase === 'copying'
          ? 'bg-green-600/80'
          : 'bg-secondary/80'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      />
    </div>
  );
}
