'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Trophy, CheckCircle } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface HistoryStats {
  win_rate_pct: number | null;
  total_won: number;
  total_tickets: number;
  avg_odds: number | null;
}

// Valeurs d'affichage tant que l'API n'a pas répondu
const PLACEHOLDER = {
  winRate: 78.5,
  totalTickets: 48,
  avgOdds: 5.2,
  genTime: 12,
};

export function StatsBar() {
  const [stats, setStats] = useState<HistoryStats | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(() => {});
  }, []);

  const winRate = stats?.win_rate_pct ?? PLACEHOLDER.winRate;
  const totalTickets = stats?.total_tickets ?? PLACEHOLDER.totalTickets;
  const avgOdds = stats?.avg_odds ?? PLACEHOLDER.avgOdds;

  const ITEMS = [
    {
      icon: TrendingUp,
      color: 'text-primary',
      value: winRate,
      suffix: '%',
      decimals: 1,
      label: 'Taux de réussite',
      note: stats?.roi_pct ? `ROI: +${stats.roi_pct}%` : 'données réelles',
    },
    {
      icon: CheckCircle,
      color: 'text-secondary',
      value: totalTickets,
      suffix: '',
      decimals: 0,
      label: 'Tickets analysés',
      note: 'historique public',
    },
    {
      icon: Trophy,
      color: 'text-accent',
      value: avgOdds,
      suffix: '',
      prefix: 'x',
      decimals: 2,
      label: 'Cote moyenne',
      note: 'tickets résolus',
    },
    {
      icon: Zap,
      color: 'text-primary',
      value: PLACEHOLDER.genTime,
      suffix: 's',
      decimals: 0,
      label: 'Génération IA',
      note: 'en moyenne',
    },
  ];

  return (
    <section className="py-10 bg-surface border-y border-surface-light relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {ITEMS.map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter
                    value={item.value}
                    suffix={item.suffix}
                    prefix={item.prefix}
                    decimals={item.decimals}
                  />
                </div>
                <div className="text-sm text-text-muted">{item.label}</div>
                <div className="text-xs text-text-muted/60 italic">{item.note}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
