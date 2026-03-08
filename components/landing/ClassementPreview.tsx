'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from './ScrollReveal';

const TOP_TICKETS = [
  { rank: 1, odds: 8.42, conf: 82, picks: ['Arsenal Victoire', '+2.5 PSG', 'Inter Victoire'], emoji: '🥇' },
  { rank: 2, odds: 6.20, conf: 75, picks: ['Real Madrid Victoire', '+2.5 Bayern', 'Nul Barça'], emoji: '🥈' },
  { rank: 3, odds: 4.88, conf: 79, picks: ['Liverpool Victoire', 'PSG Victoire', '+1.5 Man City'], emoji: '🥉' },
];

const RANK_STYLE = [
  'border-yellow-400/40 bg-yellow-400/5 shadow-yellow-400/10',
  'border-slate-400/40 bg-slate-400/5 shadow-slate-400/10',
  'border-amber-700/40 bg-amber-700/5 shadow-amber-700/10',
];

export function ClassementPreview() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[500px] h-[200px] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-5">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="text-accent text-sm font-semibold">Classement viral</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              🏆 Meilleurs Tickets du Jour
            </h2>
            <p className="text-text-secondary text-lg">
              Les tickets les mieux notés par notre IA. Rejoue-les en un clic.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {TOP_TICKETS.map((ticket, i) => (
            <motion.div
              key={i}
              className={`border rounded-2xl shadow-lg overflow-hidden ${RANK_STYLE[i]}`}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="px-5 py-4 flex items-center gap-4">
                {/* Rank */}
                <div className="text-3xl flex-shrink-0">{ticket.emoji}</div>

                {/* Picks */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ticket.picks.map((pick, j) => (
                      <span
                        key={j}
                        className="text-xs bg-surface-light text-text-secondary px-2 py-0.5 rounded-md"
                      >
                        {pick}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      Confiance : <span className="text-primary font-semibold ml-0.5">{ticket.conf}%</span>
                    </div>
                  </div>
                </div>

                {/* Odds */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold text-white">x{ticket.odds.toFixed(2)}</div>
                  <div className="text-xs text-text-muted">cote totale</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" asChild>
              <Link href="/classement">
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir tout le classement
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
