'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, X } from 'lucide-react';

/**
 * Sticky bottom bar that lets users copy the "ALGOPRONOS" promo code.
 * Visible on mobile (and desktop), appears after 3s or first scroll.
 * Dismissible per session.
 */
export function StickyCodeCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Don't show if dismissed in this session
    if (sessionStorage.getItem('sticky-cta-dismissed')) {
      setDismissed(true);
      return;
    }

    const show = () => setVisible(true);

    // Show after 3 seconds or on first scroll
    const timer = setTimeout(show, 3000);
    window.addEventListener('scroll', show, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', show);
    };
  }, []);

  function copy() {
    navigator.clipboard.writeText('ALGOPRONOS').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function dismiss() {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem('sticky-cta-dismissed', '1');
  }

  if (dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3 bg-surface border-t border-primary/30 shadow-2xl shadow-primary/20 animate-in slide-in-from-bottom-4 duration-300"
      role="complementary"
      aria-label="Code promo AlgoPronos"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted leading-tight">Code Compte Optimisé IA :</p>
        <p className="font-black text-white tracking-widest text-base leading-tight">ALGOPRONOS</p>
      </div>

      <button
        onClick={copy}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 ${
          copied
            ? 'bg-green-500/20 border border-green-500/40 text-green-400'
            : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
        }`}
        aria-label="Copier le code ALGOPRONOS"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copié !
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            COPIER LE CODE
          </>
        )}
      </button>

      <button
        onClick={dismiss}
        className="p-1.5 rounded-lg text-text-muted hover:text-white transition-colors shrink-0"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
