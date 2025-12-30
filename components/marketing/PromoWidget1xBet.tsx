'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogoIcon } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Gift,
  Percent,
  Users,
  Rocket,
  ArrowRight,
  Clock,
  Shield,
  Star,
  Flame,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoWidget1xBetProps {
  promoCode?: string;
  className?: string;
}

export function PromoWidget1xBet({
  promoCode = 'ALGOPRONO2025',
  className,
}: PromoWidget1xBetProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const benefits = [
    {
      icon: Crown,
      title: 'VIP AlgoPronos AI gratuit à vie',
      value: '208,000 FCFA/an',
    },
    {
      icon: Gift,
      title: 'Bonus 1xBet 100% sur 1er dépôt',
      value: "jusqu'à 50,000 FCFA",
    },
    {
      icon: Percent,
      title: 'Cashback 2% sur tous vos dépôts',
      value: 'économie continue',
    },
    {
      icon: Users,
      title: 'Bonus parrainage exclusif',
      value: '500 FCFA par filleul',
    },
  ];

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 rounded-3xl shadow-2xl overflow-hidden border border-[#00D4FF]/20',
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern
            id="promo-pattern"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="2" fill="#00D4FF" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#promo-pattern)" />
        </svg>
      </div>

      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4FF] rounded-full filter blur-[120px] opacity-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary rounded-full filter blur-[100px] opacity-15" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header avec badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
            <Flame className="h-4 w-4" />
            OFFRE EXCLUSIVE
          </span>
          <span className="bg-[#00D4FF]/20 backdrop-blur-sm text-[#00D4FF] px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 border border-[#00D4FF]/30">
            <Clock className="h-4 w-4" />
            Places limitées !
          </span>
        </div>

        {/* Logo et Titre */}
        <div className="flex items-center gap-4 mb-4">
          <LogoIcon size={48} />
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              AlgoPronos AI + 1xBet
            </h3>
            <p className="text-[#00D4FF] text-sm font-medium">
              Partenariat officiel
            </p>
          </div>
        </div>

        {/* Titre accrocheur */}
        <h4 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
          Débloquez VIP Gratuit À VIE
        </h4>
        <p className="text-3xl md:text-4xl font-bold text-primary mb-6">
          + 259,200 FCFA de Bonus !
        </p>

        {/* Liste avantages */}
        <div className="space-y-3 mb-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-[#00D4FF]/20 rounded-lg flex items-center justify-center">
                <benefit.icon className="h-5 w-5 text-[#00D4FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">
                  {benefit.title}
                </div>
                <div className="text-primary text-xs font-semibold">
                  {benefit.value}
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Code Promo */}
        <div className="bg-gradient-to-r from-[#00D4FF]/10 to-primary/10 rounded-2xl p-4 mb-6 border border-[#00D4FF]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Votre code promo exclusif :</p>
              <p className="text-2xl font-bold text-white tracking-wider">{promoCode}</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] px-4 py-2 rounded-lg transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm font-medium">Copier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Calcul Total */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center text-text-secondary">
              <span>VIP à vie (valeur annuelle)</span>
              <span className="font-semibold text-white">208,000 F</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>Bonus 1xBet 100%</span>
              <span className="font-semibold text-white">50,000 F</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>Cashback + Bonus</span>
              <span className="font-semibold text-white">1,200 F</span>
            </div>
            <div className="h-px bg-white/20 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">TOTAL AVANTAGES</span>
              <span className="font-bold text-xl text-primary">259,200 F</span>
            </div>
          </div>
        </div>

        {/* CTA Principal */}
        <Button
          size="xl"
          className="w-full bg-gradient-to-r from-[#00D4FF] to-primary hover:opacity-90 text-white font-bold shadow-xl shadow-[#00D4FF]/25"
          asChild
        >
          <Link href="/unlock-vip">
            <Rocket className="mr-2 h-5 w-5" />
            Débloquer Maintenant (100% Gratuit)
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>

        {/* Trust indicators */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-primary" />
            <span>2,847 VIP actifs</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-primary" />
            <span>100% Sécurisé</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary" />
            <span>Activation 5 min</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>4.9/5</span>
          </div>
        </div>

        {/* Micro-copy */}
        <p className="mt-4 text-center text-text-muted text-xs">
          Sans carte bancaire • Sans engagement • Activation immédiate
        </p>
      </div>
    </div>
  );
}
