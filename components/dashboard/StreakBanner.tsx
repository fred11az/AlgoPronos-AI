'use client';

import { useState, useEffect } from 'react';
import { Flame, TrendingUp } from 'lucide-react';

interface HistoryStats {
  current_streak: number;
  total_won: number;
  total_resolved: number;
  win_rate_pct: number | null;
}

export default function StreakBanner() {
  const [stats, setStats] = useState<HistoryStats | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.stats) setStats(data.stats); })
      .catch(() => null);
  }, []);

  if (!stats) return null;

  const { current_streak, win_rate_pct, total_resolved } = stats;

  // Only show if there's a meaningful streak or good win rate
  if (current_streak < 2 && (!win_rate_pct || total_resolved < 3)) return null;

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-yellow-500/10 to-transparent border border-orange-500/25 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
        <Flame className="h-5 w-5 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        {current_streak >= 2 ? (
          <>
            <p className="font-bold text-white text-sm">
              {current_streak} tickets gagnants consécutifs 🔥
            </p>
            <p className="text-xs text-text-muted">Série en cours — l&apos;IA est en feu !</p>
          </>
        ) : (
          <>
            <p className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              {win_rate_pct}% de réussite sur {total_resolved} tickets résolus
            </p>
            <p className="text-xs text-text-muted">Performance vérifiable en temps réel</p>
          </>
        )}
      </div>
      {current_streak >= 2 && (
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-orange-400">{current_streak}</p>
          <p className="text-xs text-text-muted">wins</p>
        </div>
      )}
    </div>
  );
}
