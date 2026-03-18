'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

// ─── Config bookmakers ────────────────────────────────────────────────────────

const BOOKMAKERS = [
  {
    name: '1xBet',
    logo: '/bookmakers/1xbet.webp',
    description: 'N°1 Afrique de l\'Ouest',
    bonus: 'Bonus 200%',
    bgColor: 'bg-[#003087]',
    borderColor: 'border-blue-700/40 hover:border-blue-500/70',
    shadowColor: 'hover:shadow-blue-900/30',
    url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    badge: 'Partenaire officiel',
    badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  },
  {
    name: 'Melbet',
    logo: '/bookmakers/melbet.png',
    description: 'Top cotes Afrique',
    bonus: 'Bonus 130%',
    bgColor: 'bg-[#1a1a1a]',
    borderColor: 'border-yellow-500/30 hover:border-yellow-400/60',
    shadowColor: 'hover:shadow-yellow-900/20',
    url: 'https://melbet.com',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Betwinner',
    logo: '/bookmakers/betwinner.webp',
    description: 'Large marché',
    bonus: 'Bonus 200%',
    bgColor: 'bg-[#1a2a1a]',
    borderColor: 'border-yellow-600/30 hover:border-yellow-500/60',
    shadowColor: 'hover:shadow-yellow-900/20',
    url: 'https://betwinner.com',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'PremierBet',
    logo: '/bookmakers/premierbet.jpg',
    description: 'Spécialiste Afrique',
    bonus: 'Bonus local',
    bgColor: 'bg-white',
    borderColor: 'border-green-600/30 hover:border-green-500/60',
    shadowColor: 'hover:shadow-green-900/20',
    url: 'https://premierbet.com',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Betway',
    logo: '/bookmakers/betway.jpg',
    description: 'Fiable & sécurisé',
    bonus: 'Bonus 50%',
    bgColor: 'bg-[#1a1a1a]',
    borderColor: 'border-green-600/30 hover:border-green-500/60',
    shadowColor: 'hover:shadow-green-900/20',
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

        {/* Logo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {BOOKMAKERS.map((bm, i) => (
              <Link
                key={bm.name}
                href={`/redirect?url=${encodeURIComponent(bm.url)}&bookmaker=${encodeURIComponent(bm.name)}`}
                className={`group relative flex flex-col items-center rounded-2xl border ${bm.borderColor} transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${bm.shadowColor} overflow-hidden`}
              >
                <ScrollReveal delay={i * 0.08}>
                  {/* Logo area */}
                  <div className={`w-full ${bm.bgColor} flex items-center justify-center p-5 h-28 relative`}>
                    {bm.logo.startsWith('/') || bm.logo.startsWith('http') ? (
                      <Image
                        src={bm.logo}
                        alt={bm.name}
                        width={140}
                        height={60}
                        className="object-contain max-h-16 w-auto"
                        unoptimized
                      />
                    ) : (
                      <span className="text-4xl">{bm.logo}</span>
                    )}
                    {/* Visit arrow */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-3.5 w-3.5 text-white/60" />
                    </div>
                  </div>

                  {/* Info area */}
                  <div className="w-full bg-surface px-4 py-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-bold text-white">{bm.name}</span>
                      {bm.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${bm.badgeColor}`}>
                          ★
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted">{bm.description}</div>
                    <div className="mt-2 text-xs font-semibold text-primary">{bm.bonus}</div>
                  </div>
                </ScrollReveal>
              </Link>
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
