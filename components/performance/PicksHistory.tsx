'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, TrendingUp, Filter } from 'lucide-react';

interface Pick {
  id: string;
  created_at: string;
  home_team: string;
  away_team: string;
  market: string;
  bookmaker_odds: number;
  value_edge: number;
  result: 'WIN' | 'LOSS' | 'PENDING';
}

export function PicksHistory({ picks }: { picks: Pick[] }) {
  return (
    <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-light/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-primary" size={20} />
          Historique des Pronostics
        </h3>
        <div className="flex gap-2">
           <button className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-text-muted hover:text-white transition-colors flex items-center gap-2">
             <Filter size={14} /> Filtrer
           </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface">
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Événement</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Marché</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Cote</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Edge</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Résultat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {picks.map((pick, i) => (
              <motion.tr 
                key={pick.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                  {new Date(pick.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                      {pick.home_team} vs {pick.away_team}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="px-2 py-1 rounded bg-surface border border-white/10 text-[10px] font-bold text-text-muted uppercase">
                    {pick.market === 'home' ? '1' : pick.market === 'away' ? '2' : 'N'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-accent">
                  x{Number(pick.bookmaker_odds).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-green-400">
                  +{ (Number(pick.value_edge) * 100).toFixed(1) }%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {pick.result === 'WIN' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold">
                      <CheckCircle size={14} /> GAGNÉ
                    </span>
                  ) : pick.result === 'LOSS' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold">
                      <XCircle size={14} /> PERDU
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-light text-text-muted text-xs font-bold">
                      EN ATTENTE
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {picks.length === 0 && (
        <div className="p-20 text-center text-text-muted opacity-50 italic">
          Aucun historique disponible pour cette période...
        </div>
      )}
    </div>
  );
}
