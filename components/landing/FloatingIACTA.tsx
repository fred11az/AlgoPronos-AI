'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, X, ArrowRight } from 'lucide-react';

interface Props {
  affiliateUrl: string;
  promoCode?: string;
}

export function FloatingIACTA({ affiliateUrl, promoCode = 'ALGOPRONOS' }: Props) {
  const [visible, setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pulse, setPulse]       = useState(false);

  // Show after 400 px of scroll
  useEffect(() => {
    if (sessionStorage.getItem('floating-cta-dismissed')) {
      setDismissed(true);
      return;
    }

    function onScroll() {
      if (window.scrollY > 400) setVisible(true);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Periodic pulse to draw attention
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 8000);
    return () => clearInterval(id);
  }, [visible]);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem('floating-cta-dismissed', '1');
  }

  if (dismissed || !visible) return null;

  return (
    <div
      className={`fixed right-4 bottom-24 z-50 flex flex-col items-end gap-2 transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
      }`}
      role="complementary"
      aria-label="Activer Compte Optimisé IA"
    >
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="w-6 h-6 rounded-full bg-surface border border-surface-light text-text-muted hover:text-white flex items-center justify-center transition-colors"
        aria-label="Fermer"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Main CTA button */}
      <Link
        href={`/redirect?url=${encodeURIComponent(affiliateUrl)}&bookmaker=Partenaire`}
        className={`group relative flex flex-col items-center gap-1.5 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-2xl px-4 py-3.5 shadow-2xl shadow-primary/30 border border-primary/40 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 max-w-[200px] text-center ${
          pulse ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : ''
        }`}
      >
        {/* Ping animation */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-background" />
        </span>
  
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs font-black tracking-wide leading-tight uppercase">
            Activer mon Compte
            <br />
            Optimisé IA
          </span>
        </div>
  
        <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1 w-full justify-center">
          <span className="text-[10px] text-white/80 font-mono">CODE :</span>
          <span className="text-[11px] font-black text-white tracking-widest">{promoCode}</span>
        </div>
  
        <div className="flex items-center gap-1 text-white/70 text-[10px]">
          <span>Cashback mensuel garanti</span>
          <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
