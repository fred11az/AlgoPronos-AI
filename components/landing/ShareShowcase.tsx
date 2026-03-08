'use client';

import { motion } from 'framer-motion';
import { Share2, MessageCircle, Send, Facebook, Twitter } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const PLATFORMS = [
  { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500/20 text-green-400 border-green-500/30', delay: 0 },
  { icon: Send, label: 'Telegram', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', delay: 0.1 },
  { icon: Facebook, label: 'Facebook', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', delay: 0.2 },
  { icon: Twitter, label: 'Twitter/X', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', delay: 0.3 },
];

export function ShareShowcase() {
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute right-0 top-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text */}
          <div>
            <ScrollReveal direction="left">
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-6">
                <Share2 className="h-4 w-4 text-accent" />
                <span className="text-accent text-sm font-semibold">Partage viral</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Partage ton ticket,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  gagne en visibilité
                </span>
              </h2>
              <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                Génère une image de ton ticket et partage-la en un clic sur WhatsApp, Telegram,
                Facebook ou Twitter. Chaque partage est une pub gratuite pour toi et pour la communauté.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {PLATFORMS.map((p) => (
                  <motion.div
                    key={p.label}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${p.color} cursor-pointer`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: p.delay + 0.2 }}
                  >
                    <p.icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{p.label}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right - Ticket mockup */}
          <ScrollReveal direction="right">
            <div className="relative">
              <motion.div
                className="bg-surface border border-surface-light rounded-2xl overflow-hidden shadow-2xl"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {/* Ticket image mockup */}
                <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6">
                  <div className="text-center mb-4">
                    <div className="text-xs text-primary font-bold tracking-widest uppercase mb-1">AlgoPronos AI</div>
                    <div className="text-white font-bold text-lg">Mon Ticket du Jour 🔥</div>
                    <div className="text-text-muted text-xs mt-1">algoprono.ai/ticket/XYZ123</div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {[
                      { match: 'Arsenal vs Chelsea', pick: 'Arsenal Victoire', odds: '2.15' },
                      { match: 'Real Madrid vs Barcelona', pick: '+2.5 buts', odds: '1.88' },
                      { match: 'PSG vs Monaco', pick: 'PSG Victoire', odds: '1.62' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-xs text-text-muted">{item.match}</div>
                          <div className="text-sm font-semibold text-white">{item.pick}</div>
                        </div>
                        <div className="text-primary font-bold">{item.odds}</div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                    <div className="text-text-muted text-sm">Cote totale</div>
                    <div className="text-2xl font-bold text-white">x6.55</div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-text-muted text-sm">Confiance IA</div>
                    <div className="text-primary font-bold">77%</div>
                  </div>
                </div>

                {/* Share buttons strip */}
                <div className="p-4 border-t border-surface-light bg-surface/80 flex gap-2">
                  {PLATFORMS.map((p) => (
                    <motion.button
                      key={p.label}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-xs font-medium ${p.color}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <p.icon className="h-3.5 w-3.5" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Notification popup */}
              <motion.div
                className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg"
                animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                📤 Partagé 1,247 fois
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
