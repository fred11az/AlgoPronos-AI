'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Rocket, Shield, Target, Flame, Brain, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mockup statique du générateur — illustre l'interface réelle
export function HeroTicketPreview() {
  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Ambient glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 rounded-3xl blur-2xl opacity-70 animate-pulse" />

      <div className="relative bg-surface border border-surface-light rounded-2xl overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-surface-light px-5 py-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-white">Générateur de Tickets IA</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Type de pari */}
          <div>
            <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Type de pari</p>
            <div className="grid grid-cols-4 gap-2">
              {['Simple', 'Double', 'Triple', 'Combiné'].map((t, i) => (
                <motion.div
                  key={t}
                  className={`py-2 rounded-lg text-center text-xs font-medium border ${i === 2 ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-light border-surface-light text-text-muted'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                >
                  {t}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Niveau de risque */}
          <div>
            <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Niveau de risque</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Prudent', icon: Shield, active: false, color: 'text-success' },
                { label: 'Équilibré', icon: Target, active: true, color: 'text-primary' },
                { label: 'Risqué', icon: Flame, active: false, color: 'text-warning' },
              ].map(({ label, icon: Icon, active, color }, i) => (
                <motion.div
                  key={label}
                  className={`p-3 rounded-xl border text-center ${active ? 'bg-primary/10 border-primary' : 'bg-surface-light border-surface-light'}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                  <span className={`text-xs font-medium ${active ? 'text-white' : 'text-text-muted'}`}>{label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Matchs sélectionnés */}
          <div>
            <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Matchs sélectionnés — 3/3</p>
            <div className="space-y-2">
              {[
                { home: 'Arsenal', away: 'Chelsea', league: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 PL', time: '18:30' },
                { home: 'Real Madrid', away: 'Atlético', league: '🇪🇸 La Liga', time: '21:00' },
                { home: 'PSG', away: 'Nice', league: '🇫🇷 L1', time: '20:45' },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between bg-surface-light/60 rounded-lg px-3 py-2"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs text-white font-medium">{m.home} – {m.away}</span>
                  </div>
                  <span className="text-xs text-text-muted">{m.league} · {m.time}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <Button size="sm" variant="gradient" className="w-full" asChild>
              <Link href="/dashboard/generate">
                <Rocket className="mr-2 h-4 w-4" />
                Générer mon ticket IA
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        className="absolute -top-3 -right-3 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        ⚡ Analyse en &lt;15s
      </motion.div>
    </motion.div>
  );
}
