'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Percent, Target, BarChart2 } from 'lucide-react';

interface Stats {
  winRate: number;
  roi: number;
  avgOdds: number;
  totalPicks: number;
}

export function StatsKPIs({ stats }: { stats: Stats | null }) {
  const items = [
    {
      label: 'Taux de réussite',
      value: stats?.winRate ?? 0,
      suffix: '%',
      icon: Target,
      color: 'text-secondary',
      sublabel: 'picks vérifiés',
    },
    {
      label: 'ROI cumulé',
      value: stats?.roi ?? 0,
      suffix: '%',
      prefix: stats?.roi && stats.roi > 0 ? '+' : '',
      icon: TrendingUp,
      color: stats?.roi && stats.roi > 0 ? 'text-green-400' : 'text-primary',
      sublabel: 'depuis 6 mois',
    },
    {
      label: 'Cote moyenne',
      value: stats?.avgOdds ?? 0,
      prefix: 'x',
      icon: BarChart2,
      color: 'text-accent',
      sublabel: 'par ticket',
    },
    {
      label: 'Total Pronos',
      value: stats?.totalPicks ?? 0,
      icon: Percent,
      color: 'text-primary',
      sublabel: 'validés par IA',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-surface-light border border-white/5 p-6 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <item.icon size={48} />
          </div>
          <div className="text-sm text-text-muted mb-2">{item.label}</div>
          <div className={`text-3xl font-bold ${item.color}`}>
            {item.prefix}{item.value}{item.suffix}
          </div>
          <div className="text-xs text-text-muted/60 mt-1">{item.sublabel}</div>
        </motion.div>
      ))}
    </div>
  );
}
