'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Bookmaker {
  id: string;
  name: string;
  logo: string;
  bgColor: string;
  bonus: string;
  bonusDetail: string;
  affiliateUrl: string;
  badge?: string;
  highlight?: boolean;
}

const BOOKMAKERS: Bookmaker[] = [
  {
    id: '1xbet',
    name: '1xBet',
    logo: '/bookmakers/1xbet.png',
    bgColor: 'bg-[#003087]',
    bonus: 'Bonus 200%',
    bonusDetail: "jusqu'à 250 000 FCFA sur 1er dépôt",
    affiliateUrl: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://1xbet.com',
    badge: 'Partenaire officiel',
    highlight: true,
  },
  {
    id: 'melbet',
    name: 'Melbet',
    logo: '/bookmakers/melbet.png',
    bgColor: 'bg-[#1a1a1a]',
    bonus: 'Bonus 130%',
    bonusDetail: "jusqu'à 150 000 FCFA",
    affiliateUrl: 'https://melbet.com',
  },
  {
    id: 'betwinner',
    name: 'Betwinner',
    logo: '/bookmakers/betwinner.png',
    bgColor: 'bg-[#1a2a1a]',
    bonus: 'Bonus 200%',
    bonusDetail: "jusqu'à 200 000 FCFA",
    affiliateUrl: 'https://betwinner.com',
  },
  {
    id: 'betway',
    name: 'Betway',
    logo: '/bookmakers/betway.png',
    bgColor: 'bg-[#1a1a1a]',
    bonus: 'Bonus 50%',
    bonusDetail: "jusqu'à 50 000 FCFA",
    affiliateUrl: 'https://betway.com',
  },
  {
    id: 'premierbet',
    name: 'PremierBet',
    logo: '/bookmakers/premierbet.png',
    bgColor: 'bg-white',
    bonus: 'Bonus local',
    bonusDetail: 'offre réservée Afrique',
    affiliateUrl: 'https://premierbet.com',
  },
  {
    id: 'bet365',
    name: 'Bet365',
    logo: '/bookmakers/bet365.png',
    bgColor: 'bg-[#027b5b]',
    bonus: 'Bonus 100%',
    bonusDetail: "jusqu'à 100 000 FCFA",
    affiliateUrl: 'https://www.bet365.com',
  },
];

export function BookmakerSelector() {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedBm = BOOKMAKERS.find((b) => b.id === selected);

  return (
    <div>
      {/* Grid de sélection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {BOOKMAKERS.map((bm) => (
          <motion.button
            key={bm.id}
            onClick={() => setSelected(bm.id === selected ? null : bm.id)}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-200 text-left ${
              selected === bm.id
                ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                : 'border-surface-light hover:border-primary/40'
            }`}
            whileTap={{ scale: 0.97 }}
          >
            {/* Logo */}
            <div className={`${bm.bgColor} w-full h-16 flex items-center justify-center px-3`}>
              <Image
                src={bm.logo}
                alt={bm.name}
                width={100}
                height={40}
                className="object-contain max-h-10 w-auto"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="bg-surface px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{bm.name}</span>
                {bm.badge && (
                  <Star className="h-3 w-3 text-accent fill-accent" />
                )}
              </div>
              <span className="text-xs text-primary font-semibold">{bm.bonus}</span>
            </div>

            {/* Check overlay */}
            {selected === bm.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* CTA affiché après sélection */}
      <AnimatePresence mode="wait">
        {selectedBm ? (
          <motion.div
            key={selectedBm.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`${selectedBm.bgColor} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5`}>
                <Image
                  src={selectedBm.logo}
                  alt={selectedBm.name}
                  width={40}
                  height={40}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <div className="text-white font-bold">{selectedBm.name} sélectionné</div>
                <div className="text-sm text-primary font-semibold">{selectedBm.bonus} — {selectedBm.bonusDetail}</div>
              </div>
            </div>

            <a href={selectedBm.affiliateUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button size="lg" variant="gradient" className="w-full group">
                Créer mon compte optimisé {selectedBm.name}
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>

            <p className="text-xs text-text-muted text-center mt-3">
              Une fois le compte créé, revenez générer votre premier ticket IA gratuitement.
            </p>
          </motion.div>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-text-muted py-3"
          >
            ↑ Sélectionnez un bookmaker pour afficher votre lien d&apos;activation
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Version compacte pour les sections sans sélecteur interactif
export function BookmakerAffiliateButtons() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {BOOKMAKERS.map((bm) => (
        <motion.a
          key={bm.id}
          href={bm.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center rounded-2xl border border-surface-light hover:border-primary/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          whileTap={{ scale: 0.97 }}
        >
          <div className={`${bm.bgColor} w-full h-20 flex items-center justify-center px-4`}>
            <Image
              src={bm.logo}
              alt={bm.name}
              width={120}
              height={50}
              className="object-contain max-h-12 w-auto"
              unoptimized
            />
          </div>
          <div className="bg-surface w-full px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{bm.name}</div>
              <div className="text-xs text-primary font-semibold">{bm.bonus}</div>
            </div>
            <ExternalLink className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
          </div>
        </motion.a>
      ))}
    </div>
  );
}
