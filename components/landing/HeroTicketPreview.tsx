'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp, Shield, Zap } from 'lucide-react';

const SAMPLE_PICKS = [
  { home: 'Arsenal', away: 'Chelsea', pick: 'Arsenal Victoire', odds: 2.15, conf: 74, league: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League' },
  { home: 'Real Madrid', away: 'Barcelona', pick: 'Plus de 2.5 buts', odds: 1.88, conf: 81, league: '🇪🇸 La Liga' },
  { home: 'PSG', away: 'Marseille', pick: 'PSG Victoire', odds: 1.62, conf: 78, league: '🇫🇷 Ligue 1' },
];

export function HeroTicketPreview() {
  const totalOdds = SAMPLE_PICKS.reduce((acc, p) => acc * p.odds, 1);

  return (
    <motion.div
      className="relative w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 rounded-3xl blur-2xl opacity-60 animate-pulse" />

      {/* Card */}
      <div className="relative bg-surface border border-primary/30 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-white" />
            <span className="font-bold text-white text-sm">AlgoPronos AI</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
            <Zap className="h-3 w-3 text-white" />
            <span className="text-xs text-white font-medium">IA Pick</span>
          </div>
        </div>

        {/* Picks */}
        <div className="divide-y divide-surface-light">
          {SAMPLE_PICKS.map((pick, i) => (
            <motion.div
              key={i}
              className="px-5 py-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
            >
              <div className="text-xs text-text-muted mb-1">{pick.league}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-text-secondary">
                    {pick.home} vs {pick.away}
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5">{pick.pick}</div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className="text-lg font-bold text-primary">{pick.odds.toFixed(2)}</div>
                  <div className="flex items-center gap-1 justify-end">
                    <Shield className="h-3 w-3 text-secondary" />
                    <span className="text-xs text-secondary">{pick.conf}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          className="px-5 py-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-surface-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-text-secondary">Cote totale</span>
            </div>
            <div className="text-2xl font-bold text-white">
              x{totalOdds.toFixed(2)}
            </div>
          </div>
          <div className="mt-2 w-full bg-surface-light rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '77%' }}
              transition={{ duration: 1.2, delay: 1.3, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Confiance IA</span>
            <span className="text-primary font-semibold">77%</span>
          </div>
        </motion.div>
      </div>

      {/* Floating badges */}
      <motion.div
        className="absolute -top-3 -right-3 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        🔥 Ticket du Jour
      </motion.div>
      <motion.div
        className="absolute -bottom-3 -left-3 bg-success/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        ✅ Généré en 12s
      </motion.div>
    </motion.div>
  );
}
