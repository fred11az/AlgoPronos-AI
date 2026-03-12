'use client';

import { useState, useEffect } from 'react';
import { Users, Zap, Trophy } from 'lucide-react';

const MESSAGES = [
  { icon: Zap,    text: 'Un utilisateur au Bénin vient de générer un ticket Triple Risqué',  color: 'text-primary' },
  { icon: Users,  text: '+50 comptes optimisés activés aujourd\'hui',                         color: 'text-secondary' },
  { icon: Trophy, text: 'Un utilisateur à Abidjan vient de partager une victoire ×4.85',     color: 'text-[#F0C040]' },
  { icon: Zap,    text: 'Un utilisateur à Lomé vient de générer un ticket Équilibré',        color: 'text-primary' },
  { icon: Users,  text: '+15 000 utilisateurs actifs sur AlgoPronos AI',                     color: 'text-secondary' },
  { icon: Trophy, text: 'Un utilisateur au Sénégal vient de partager une victoire ×3.20',   color: 'text-[#F0C040]' },
  { icon: Zap,    text: 'Un utilisateur à Cotonou vient de générer un ticket Prudent',       color: 'text-primary' },
  { icon: Users,  text: '+120 tickets IA générés ces dernières 24h',                         color: 'text-secondary' },
];

export function SocialProofTicker() {
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed) return null;

  const msg = MESSAGES[index];
  const Icon = msg.icon;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-full border border-surface-light/80 bg-surface/90 backdrop-blur-md shadow-xl shadow-black/40 transition-all duration-400 max-w-[90vw] sm:max-w-md ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className={`h-3.5 w-3.5 ${msg.color}`} />
      </div>
      <p className="text-xs text-text-secondary truncate flex-1">{msg.text}</p>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-muted hover:text-white transition-colors text-base leading-none shrink-0 ml-1"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}
