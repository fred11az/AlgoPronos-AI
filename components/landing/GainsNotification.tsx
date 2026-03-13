'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, X } from 'lucide-react';

// ─── Dataset de notifications réalistes ──────────────────────────────────────

interface Notification {
  city: string;
  country: string;
  flag: string;
  type: 'win' | 'validate' | 'cashback';
  game: string;
  amount: string;
}

const NOTIFICATIONS: Notification[] = [
  { city: 'Dakar',      country: 'SN', flag: '🇸🇳', type: 'win',      game: 'Coupon IA Football',    amount: '+45 000 F CFA' },
  { city: 'Abidjan',    country: 'CI', flag: '🇨🇮', type: 'validate', game: 'Ticket IA Triple',      amount: '+72 500 F CFA' },
  { city: 'Cotonou',    country: 'BJ', flag: '🇧🇯', type: 'win',      game: 'Crash x4.8',           amount: '+18 200 F CFA' },
  { city: 'Douala',     country: 'CM', flag: '🇨🇲', type: 'cashback', game: 'Cashback mensuel',      amount: '+9 800 F CFA'  },
  { city: 'Lomé',       country: 'TG', flag: '🇹🇬', type: 'win',      game: 'Apple of Fortune',     amount: '+31 000 F CFA' },
  { city: 'Bamako',     country: 'ML', flag: '🇲🇱', type: 'validate', game: 'Combiné IA x5.2',      amount: '+56 400 F CFA' },
  { city: 'Ouagadougou',country: 'BF', flag: '🇧🇫', type: 'win',      game: 'Crash x2.9',           amount: '+12 700 F CFA' },
  { city: 'Libreville', country: 'GA', flag: '🇬🇦', type: 'cashback', game: 'Cashback Pro niveau',   amount: '+14 500 F CFA' },
  { city: 'Niamey',     country: 'NE', flag: '🇳🇪', type: 'win',      game: 'Coupon IA Double',     amount: '+27 300 F CFA' },
  { city: 'Conakry',    country: 'GN', flag: '🇬🇳', type: 'validate', game: 'Ticket IA Équilibré',  amount: '+38 900 F CFA' },
  { city: 'Brazzaville',country: 'CG', flag: '🇨🇬', type: 'win',      game: 'Apple of Fortune x10', amount: '+65 000 F CFA' },
  { city: 'Antananarivo',country:'MG', flag: '🇲🇬', type: 'cashback', game: 'Cashback Elite niveau', amount: '+22 100 F CFA' },
  { city: 'Porto-Novo', country: 'BJ', flag: '🇧🇯', type: 'win',      game: 'Crash x7.4',           amount: '+49 600 F CFA' },
  { city: 'Abidjan',    country: 'CI', flag: '🇨🇮', type: 'validate', game: 'Coupon IA Premium',    amount: '+83 200 F CFA' },
  { city: 'Dakar',      country: 'SN', flag: '🇸🇳', type: 'cashback', game: 'Cashback mensuel',      amount: '+11 400 F CFA' },
  { city: 'Yaoundé',    country: 'CM', flag: '🇨🇲', type: 'win',      game: 'Apple of Fortune',     amount: '+34 700 F CFA' },
];

function buildMessage(n: Notification): string {
  switch (n.type) {
    case 'win':
      return `vient de gagner sur ${n.game}`;
    case 'validate':
      return `vient de valider un ${n.game}`;
    case 'cashback':
      return `a reçu son ${n.game}`;
  }
}

// Shuffle array (Fisher-Yates) for display variety
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const INTERVAL_MS   = 6000;  // new notification every 6s
const ANIMATION_MS  = 400;   // slide-out duration

export function GainsNotification() {
  const [queue]     = useState(() => shuffle(NOTIFICATIONS));
  const [cursor, setCursor]   = useState(0);
  const [current, setCurrent] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const showNext = useCallback(() => {
    setCurrent(queue[cursor % queue.length]);
    setCursor(c => c + 1);
    setVisible(true);

    // Auto-hide after 4.5s
    setTimeout(() => setVisible(false), 4500);
  }, [cursor, queue]);

  useEffect(() => {
    if (dismissed) return;

    // Initial delay: 3s
    const init = setTimeout(showNext, 3000);
    return () => clearTimeout(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;

    const interval = setInterval(showNext, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dismissed, showNext]);

  function dismiss() {
    setVisible(false);
    setTimeout(() => setDismissed(true), ANIMATION_MS);
  }

  if (dismissed || !current) return null;

  const amountColor =
    current.type === 'cashback'
      ? 'text-accent'
      : current.type === 'win'
      ? 'text-primary'
      : 'text-secondary';

  return (
    <div
      className={`fixed bottom-6 left-4 z-50 max-w-[280px] transition-all duration-${ANIMATION_MS} ${
        visible
          ? 'opacity-100 translate-y-0 translate-x-0'
          : 'opacity-0 translate-y-4 -translate-x-2 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Notification de gains récents"
    >
      <div className="bg-surface border border-surface-light rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Top accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-primary via-secondary to-accent" />

        <div className="flex items-start gap-3 p-3 pr-8 relative">
          {/* Flag avatar */}
          <div className="w-9 h-9 rounded-xl bg-background border border-surface-light flex items-center justify-center flex-shrink-0 text-lg">
            {current.flag}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="text-xs font-bold text-white truncate">
                Utilisateur de {current.city}
              </span>
            </div>
            <p className="text-xs text-text-muted leading-tight mb-1">
              {buildMessage(current)}
            </p>
            <div className={`text-sm font-black ${amountColor} tabular-nums`}>
              {current.amount}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 text-text-muted hover:text-white transition-colors p-0.5 rounded"
            aria-label="Fermer la notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-surface-light">
          <div
            className="h-full bg-primary/50 origin-left"
            style={{
              animation: visible ? `shrink 4.5s linear forwards` : 'none',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
