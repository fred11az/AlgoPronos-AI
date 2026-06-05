'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function WorldCupCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Opening match: June 11, 2026 at 21:00 UTC (or local)
    const targetDate = new Date('2026-06-11T21:00:00');

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Set initial
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface border border-yellow-400/20 min-h-[64px] animate-pulse">
        <Clock className="h-5 w-5 text-yellow-400/50" />
        <div className="w-24 h-5 bg-surface-light rounded" />
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const isStarted = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  if (isStarted) {
    return (
      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 text-yellow-400 animate-pulse">
        <span className="font-black text-lg sm:text-xl uppercase tracking-wider">🔥 Le Tournoi a Commencé !</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface border border-yellow-400/30">
        <Clock className="h-5 w-5 text-yellow-400 shrink-0 animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-3xl font-black text-yellow-400 leading-none">{days}</span>
            <span className="text-[10px] text-text-muted block font-medium uppercase tracking-wider">jours</span>
          </div>
          <div className="text-xl font-bold text-yellow-400/40">:</div>
          <div className="text-center">
            <span className="text-3xl font-black text-yellow-400 leading-none">{String(hours).padStart(2, '0')}</span>
            <span className="text-[10px] text-text-muted block font-medium uppercase tracking-wider">heures</span>
          </div>
          <div className="text-xl font-bold text-yellow-400/40">:</div>
          <div className="text-center">
            <span className="text-3xl font-black text-yellow-400 leading-none">{String(minutes).padStart(2, '0')}</span>
            <span className="text-[10px] text-text-muted block font-medium uppercase tracking-wider">min</span>
          </div>
          <div className="text-xl font-bold text-yellow-400/40 hidden xs:inline">:</div>
          <div className="text-center hidden xs:block">
            <span className="text-3xl font-black text-yellow-400 leading-none">{String(seconds).padStart(2, '0')}</span>
            <span className="text-[10px] text-text-muted block font-medium uppercase tracking-wider">sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}
