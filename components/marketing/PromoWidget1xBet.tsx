'use client';

import { LogoIcon } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  Gift,
  Percent,
  Users,
  Rocket,
  ArrowRight,
  Clock,
  Shield,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoWidget1xBetProps {
  className?: string;
}

export function PromoWidget1xBet({
  className,
}: PromoWidget1xBetProps) {
  const benefits = [
    {
      icon: Rocket,
      title: 'Compte synchronisé avec l\'IA',
      value: 'Analyses optimisées à vie',
    },
    {
      icon: Gift,
      title: 'BONUS 200% sur 1er dépôt',
      value: "jusqu'à 250,000 FCFA !",
      highlight: true,
    },
    {
      icon: Percent,
      title: 'Cashback permanent',
      value: 'sur tous vos dépôts',
    },
    {
      icon: Users,
      title: 'Bonus parrainage',
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
          <span className="bg-gradient-to-r from-primary to-[#00D4FF] text-white px-4 py-1.5 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            COMPTE OPTIMISÉ IA
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
              Partenariat officiel exclusif
            </p>
          </div>
        </div>

        {/* Titre accrocheur */}
        <h4 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
          Créez Votre Compte 1xBet Optimisé
        </h4>
        <p className="text-2xl md:text-3xl font-bold text-primary mb-6">
          4 Avantages Exclusifs avec Notre Code !
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

        {/* Calcul Total */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center text-[#00D4FF]">
              <span className="font-medium">🤖 Synchronisation IA</span>
              <span className="font-semibold">INCLUS</span>
            </div>
            <div className="flex justify-between items-center text-yellow-400">
              <span className="font-bold">🎁 Bonus 200% 1er dépôt</span>
              <span className="font-bold">jusqu&apos;à 250,000 F</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>💰 Cashback + 👥 Parrainage</span>
              <span className="font-semibold text-white">INCLUS</span>
            </div>
            <div className="h-px bg-white/20 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">VALEUR TOTALE</span>
              <span className="font-bold text-xl text-primary">250,000+ F</span>
            </div>
          </div>
        </div>

        {/* CTA Principal */}
        <Button
          size="xl"
          className="w-full bg-gradient-to-r from-[#00D4FF] to-primary hover:opacity-90 text-white font-bold shadow-xl shadow-[#00D4FF]/25"
          asChild
        >
          <a
            href={process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Créer Mon Compte Optimisé (Gratuit)
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
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
