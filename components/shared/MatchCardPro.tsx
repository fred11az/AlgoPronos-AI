'use client';

import Link from 'next/link';
import { ChevronRight, TrendingUp, Zap, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MatchRow } from '@/app/matchs/page';

interface MatchCardProProps {
  match: MatchRow;
}

export function MatchCardPro({ match }: MatchCardProProps) {
  function predLabel(type: string): string {
    if (type === 'home') return '1';
    if (type === 'draw') return 'N';
    if (type === 'away') return '2';
    if (type === 'btts') return 'BTTS';
    if (type === 'over25') return 'O2.5';
    if (type === 'under25') return 'U2.5';
    return type.toUpperCase();
  }

  function predColor(type: string): string {
    if (type === 'home') return 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400';
    if (type === 'draw') return 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 text-yellow-400';
    if (type === 'away') return 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400';
    if (type === 'btts' || type === 'over25') return 'from-green-500/20 to-green-600/5 border-green-500/30 text-green-400';
    if (type === 'under25') return 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400';
    return 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400';
  }

  return (
    <Link
      href={`/pronostic/${match.slug}`}
      className="group relative block w-full"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
      <div className="relative flex flex-col sm:flex-row items-center gap-4 bg-surface/80 backdrop-blur-md border border-white/5 group-hover:border-primary/40 rounded-2xl p-4 transition-all duration-300">
        
        {/* Match Info & Time */}
        <div className="flex flex-col items-center sm:items-start gap-1 w-full sm:w-24 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {match.match_time}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-green-500 uppercase tracking-tighter">Live Odds</span>
          </div>
        </div>

        {/* Teams Section */}
        <div className="flex-1 flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-light border border-white/5 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden shrink-0">
                {match.home_team.substring(0, 2)}
              </div>
              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                {match.home_team}
              </span>
            </div>
            {/* Score placeholder if we have it in the future */}
            <span className="text-sm font-black text-primary/80 mono">--</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-light border border-white/5 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden shrink-0">
                {match.away_team.substring(0, 2)}
              </div>
              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                {match.away_team}
              </span>
            </div>
            <span className="text-sm font-black text-primary/80 mono">--</span>
          </div>
        </div>

        {/* Stats & Prediction */}
        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:pl-4">
          
          {/* Market / Prediction */}
          <div className={`flex flex-col items-center justify-center min-w-[60px] h-12 rounded-xl border bg-gradient-to-br ${predColor(match.prediction_type)}`}>
            <span className="text-[10px] font-bold opacity-60 uppercase">Prono</span>
            <span className="text-sm font-black leading-none">{predLabel(match.prediction_type)}</span>
          </div>

          {/* AI Confidence */}
          <div className="flex flex-col gap-1 flex-1 sm:w-24">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted font-medium">Confiance</span>
              <span className="text-primary font-bold">{match.probability}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-light rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-[#00D4FF] rounded-full transition-all duration-1000 group-hover:brightness-125" 
                style={{ width: `${match.probability}%` }}
              />
            </div>
          </div>

          {/* Value edge Badge */}
          {match.value_edge > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-[10px] font-black text-green-400">+{match.value_edge}%</span>
            </div>
          )}

          <div className="hidden sm:block ml-2">
            <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
