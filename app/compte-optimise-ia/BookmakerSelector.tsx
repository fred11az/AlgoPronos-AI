'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Star,
  Zap,
  Shield,
  Lock,
} from 'lucide-react';
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
  /** Lien affilié actif (true = lien réel, false = bientôt disponible) */
  live: boolean;
}

const BOOKMAKERS: Bookmaker[] = [
  {
    id: '1xbet',
    name: '1xBet',
    logo: '/bookmakers/1xbet.webp',
    bgColor: 'bg-[#003087]',
    bonus: 'Bonus 200%',
    bonusDetail: "jusqu'à 250 000 FCFA sur 1er dépôt",
    affiliateUrl:
      process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
      'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    badge: '1xBet',
    highlight: true,
    live: true,
  },
  {
    id: 'melbet',
    name: 'Melbet',
    logo: '/bookmakers/melbet.png',
    bgColor: 'bg-[#1a1a1a]',
    bonus: 'Bonus 130%',
    bonusDetail: "jusqu'à 150 000 FCFA",
    affiliateUrl:
      process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
      'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    live: false,
  },
  {
    id: 'betwinner',
    name: 'Betwinner',
    logo: '/bookmakers/betwinner.webp',
    bgColor: 'bg-[#1a2a1a]',
    bonus: 'Bonus 200%',
    bonusDetail: "jusqu'à 200 000 FCFA",
    affiliateUrl:
      process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
      'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    live: false,
  },
  {
    id: 'betway',
    name: 'Betway',
    logo: '/bookmakers/betway.jpg',
    bgColor: 'bg-[#1a1a1a]',
    bonus: 'Bonus 50%',
    bonusDetail: "jusqu'à 50 000 FCFA",
    affiliateUrl:
      process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
      'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    live: false,
  },
  {
    id: 'premierbet',
    name: 'PremierBet',
    logo: '/bookmakers/premierbet.jpg',
    bgColor: 'bg-white',
    bonus: 'Bonus local',
    bonusDetail: 'offre réservée Afrique',
    affiliateUrl:
      process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
      'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    live: false,
  },
  {
    id: 'bet365',
    name: 'Bet365',
    logo: '/bookmakers/bet365.png',
    bgColor: 'bg-[#027b5b]',
    bonus: 'Bonus 100%',
    bonusDetail: "jusqu'à 100 000 FCFA",
    affiliateUrl:
      process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
      'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599',
    live: false,
  },
  {
    id: 'afropari',
    name: 'AfroPari',
    logo: '/bookmakers/afropari.svg',
    bgColor: 'bg-[#1a1a1a]',
    bonus: 'Bonus Afrique',
    bonusDetail: 'offre exclusive Afrique de l\'Ouest',
    affiliateUrl:
      process.env.NEXT_PUBLIC_AFROPARI_AFFILIATE_URL ||
      'https://refpa84423.com/L?tag=d_5390010m_70055c_&site=5390010&ad=70055',
    badge: '1xBet',
    live: true,
  },
];

// ─── Composant principal ────────────────────────────────────────────────────

export function BookmakerSelector() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBm = BOOKMAKERS.find((b) => b.id === selected);

  return (
    <div>
      {/* Grille de sélection */}
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

            {/* Badge "Partenaire officiel" */}
            {bm.badge && (
              <div className="absolute top-1.5 left-1.5 bg-accent/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {bm.badge}
              </div>
            )}

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
            className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-2xl p-5 space-y-4"
          >
            {/* En-tête bookmaker sélectionné */}
            <div className="flex items-center gap-3">
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
                <div className="text-sm text-primary font-semibold">
                  {selectedBm.bonus} — {selectedBm.bonusDetail}
                </div>
              </div>
            </div>

            {/* ── Argument "Passerelle de métadonnées" ───────────────────── */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-300 mb-1">
                    Aucun code promo requis
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    L&apos;optimisation IA est injectée automatiquement via notre{' '}
                    <span className="text-blue-300 font-semibold">passerelle de métadonnées</span>.
                    Votre nouveau compte sera configuré pour l&apos;IA avec tous les avantages
                    exclusifs dès la création — sans manipulation manuelle.
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    Le code{' '}
                    <code className="bg-surface border border-surface-light px-1.5 py-0.5 rounded text-primary font-mono">
                      ALGOPRONOS
                    </code>{' '}
                    reste une option facultative pour le bonus de bienvenue.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Garanties Full Access ────────────────────────────────────── */}
            <div className="bg-surface-light rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold text-accent uppercase tracking-wide">
                  Avantages Full Access débloqués
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  'Bouclier 20 Matchs — remboursement 100%',
                  'Garantie Matchs Nuls — 100% si 2 paires de nuls',
                  'Analyses IA illimitées chaque semaine',
                  'Value bets exclusifs signalés en temps réel',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-xs text-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Lien d'activation ───────────────────────────────────────── */}
            <Link
              href={`/redirect?url=${encodeURIComponent(selectedBm.affiliateUrl)}&bookmaker=${encodeURIComponent(selectedBm.name)}`}
              className="block"
            >
              <Button size="lg" variant="gradient" className="w-full group">
                <Lock className="mr-2 h-4 w-4" />
                Créer mon compte optimisé {selectedBm.name}
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <p className="text-xs text-text-muted text-center">
              Une fois le compte créé, revenez sur AlgoPronos pour générer votre
              premier ticket IA gratuitement. Puis validez via{' '}
              <a href="/unlock-vip" className="text-primary hover:underline">
                Activer mon accès Full Access
              </a>
              .
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

// ─── Version grille compact (section bookmakers en bas de page) ────────────

export function BookmakerAffiliateButtons() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {BOOKMAKERS.map((bm) => (
        <Link
          key={bm.id}
          href={`/redirect?url=${encodeURIComponent(bm.affiliateUrl)}&bookmaker=${encodeURIComponent(bm.name)}`}
          className="group flex flex-col items-center rounded-2xl border border-surface-light hover:border-primary/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className={`${bm.bgColor} w-full h-20 flex items-center justify-center px-4 relative`}>
            <Image
              src={bm.logo}
              alt={bm.name}
              width={120}
              height={50}
              className="object-contain max-h-12 w-auto"
              unoptimized
            />
            {bm.badge && (
              <div className="absolute top-2 left-2 bg-accent text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {bm.badge}
              </div>
            )}
          </div>
          <div className="bg-surface w-full px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{bm.name}</div>
              <div className="text-xs text-primary font-semibold">{bm.bonus}</div>
            </div>
            <ExternalLink className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
