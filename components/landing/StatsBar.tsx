'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Trophy } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

const STATS = [
  { icon: TrendingUp, value: 78.5, suffix: '%', decimals: 1, label: 'Taux de réussite', color: 'text-primary' },
  { icon: Users, value: 15234, suffix: '', decimals: 0, label: 'Utilisateurs actifs', color: 'text-secondary' },
  { icon: Zap, value: 12, suffix: 's', decimals: 0, label: 'Génération IA', color: 'text-accent' },
  { icon: Trophy, value: 48700, suffix: '', decimals: 0, label: 'Tickets générés', color: 'text-primary' },
];

export function StatsBar() {
  return (
    <section className="py-10 bg-surface border-y border-surface-light relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <div className={`text-2xl font-bold text-white`}>
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </div>
                <div className="text-sm text-text-muted">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
