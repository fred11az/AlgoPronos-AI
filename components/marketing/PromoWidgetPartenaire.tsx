'use client';

import { CheckCircle, Shield, Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PromoWidgetPartenaireProps {
  className?: string;
}

export function PromoWidgetPartenaire({
  className = '',
}: PromoWidgetPartenaireProps) {
  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {/* Background Decor */}
      <div className="absolute inset-0 bg-surface border border-white/5 rounded-3xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-primary/20 transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -ml-32 -mb-32 group-hover:bg-secondary/20 transition-colors duration-500" />
      </div>

      <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
        {/* Left: Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              Partenariat Officiel
            </span>
          </div>

          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Activez Votre Compte <span className="text-primary tracking-tight italic">1xBet Optimisé IA</span>
          </h3>

          <p className="text-text-secondary text-lg mb-8 max-w-xl">
            Profitez de l&apos;algorithme de prédiction le plus avancé d&apos;Afrique. 
            Analyse xG, Value Betting et Cashback mensuel automatique.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              'Pronostics VIP Illimités',
              'Backtesting Data Science',
              'Cashback de Perte 10-15%',
              'Statut Compte Vérifié IA',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-text-secondary">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 h-14 bg-primary hover:bg-primary/90 text-secondary-dark font-black rounded-2xl shadow-xl shadow-primary/20 group/btn transition-all duration-300"
              asChild
            >
              <Link
                href={`/redirect?url=${encodeURIComponent(process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599')}&bookmaker=1xBet`}
              >
                <Rocket className="mr-2 h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                Créer Mon Compte (Gratuit)
              </Link>
            </Button>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Code Promo Officiel</p>
              <div className="bg-surface-light px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                <span className="text-primary font-black text-lg tracking-tighter">ALGOPRONOS</span>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold uppercase underline">COPIER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="w-full md:w-80 shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-3xl" />
            <div className="relative aspect-square rounded-[2rem] bg-gradient-to-br from-surface-light/50 to-surface/80 border border-white/10 p-8 flex flex-col justify-center gap-6 overflow-hidden">
              <div className="space-y-4">
                <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                <div className="h-8 w-full bg-primary/10 rounded-xl flex items-center px-4">
                  <div className="h-2 w-1/3 bg-primary/40 rounded-full" />
                </div>
                <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                <div className="h-32 w-full bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col gap-2">
                   <div className="flex justify-between items-end h-full gap-2">
                      <div className="flex-1 bg-primary/20 rounded-t-lg h-1/2" />
                      <div className="flex-1 bg-primary/40 rounded-t-lg h-3/4" />
                      <div className="flex-1 bg-primary/60 rounded-t-lg h-1/3" />
                      <div className="flex-1 bg-primary/30 rounded-t-lg h-1/2" />
                      <div className="flex-1 bg-primary/80 rounded-t-lg h-full" />
                   </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-primary font-black text-xs">
                 <ArrowRight className="w-4 h-4" /> Analyse Prédictive IA
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
