'use client';

import { motion } from 'framer-motion';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const BOOKMAKERS = [
  {
    name: '1xBet',
    description: 'N°1 Afrique de l\'Ouest',
    bonus: 'Bonus 200%',
    color: 'from-blue-600/20 to-blue-700/10 border-blue-600/30 hover:border-blue-500/60',
    textColor: 'text-blue-400',
    url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://1xbet.com',
    badge: 'Partenaire officiel',
    badgeColor: 'bg-blue-500/20 text-blue-300',
  },
  {
    name: 'Bet365',
    description: 'Leader mondial',
    bonus: 'Bonus 100%',
    color: 'from-green-700/20 to-green-800/10 border-green-700/30 hover:border-green-600/60',
    textColor: 'text-green-400',
    url: 'https://www.bet365.com',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Melbet',
    description: 'Top cotes Afrique',
    bonus: 'Bonus 130%',
    color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400/60',
    textColor: 'text-orange-400',
    url: 'https://melbet.com',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Betwinner',
    description: 'Large marché',
    bonus: 'Bonus 200%',
    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-400/60',
    textColor: 'text-yellow-400',
    url: 'https://betwinner.com',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'PremierBet',
    description: 'Spécialiste Afrique',
    bonus: 'Bonus local',
    color: 'from-purple-600/20 to-purple-700/10 border-purple-600/30 hover:border-purple-500/60',
    textColor: 'text-purple-400',
    url: 'https://premierbet.com',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Betway',
    description: 'Fiable & sécurisé',
    bonus: 'Bonus 50%',
    color: 'from-teal-600/20 to-teal-700/10 border-teal-600/30 hover:border-teal-500/60',
    textColor: 'text-teal-400',
    url: 'https://betway.com',
    badge: null,
    badgeColor: '',
  },
];

export function BookmakersSection() {
  return (
    <section id="bookmakers" className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-semibold">Bookmakers partenaires</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Placez vos tickets sur les meilleures plateformes
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Nos analyses sont compatibles avec tous les bookmakers majeurs disponibles
              en Afrique de l&apos;Ouest et dans le monde.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BOOKMAKERS.map((bm, i) => (
            <ScrollReveal key={bm.name} delay={i * 0.08}>
              <motion.a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block bg-gradient-to-br ${bm.color} border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`text-xl font-bold ${bm.textColor}`}>{bm.name}</div>
                    <div className="text-sm text-text-secondary mt-0.5">{bm.description}</div>
                  </div>
                  <ExternalLink className={`h-4 w-4 ${bm.textColor} opacity-0 group-hover:opacity-100 transition-opacity mt-1`} />
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold px-2 py-1 rounded-lg bg-white/5 ${bm.textColor}`}>
                    {bm.bonus}
                  </span>
                  {bm.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bm.badgeColor}`}>
                      {bm.badge}
                    </span>
                  )}
                </div>
              </motion.a>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.5}>
          <p className="text-center text-xs text-text-muted mt-10 max-w-xl mx-auto">
            AlgoPronos AI n&apos;est pas responsable des pertes liées aux paris. Jouez de manière responsable.
            Les paris comportent des risques. Réservé aux personnes majeures.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
