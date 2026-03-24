'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket, Sparkles, Lock, ArrowRight, Target } from 'lucide-react';

export default function TicketOptimusWidget({ isVerified = false }) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVerified) {
      fetch('/api/ticket-du-jour?type=optimus')
        .then(res => res.json())
        .then(data => setTicket(data.ticket))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isVerified]);

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-background overflow-hidden relative group">
      <div className="absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
        <Rocket className="h-32 w-32 text-secondary" />
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 italic">
              <Rocket className="h-5 w-5 text-secondary" />
              Ticket OPTIMUS
            </CardTitle>
            <CardDescription>Stratégie Récupération Or</CardDescription>
          </div>
          <div className="bg-secondary/20 border border-secondary/30 px-3 py-1 rounded-full text-[10px] font-black text-secondary uppercase tracking-widest">
            Cote 5.0+
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isVerified ? (
          <div className="relative py-8 px-4 text-center">
            <div className="blur-md pointer-events-none opacity-20 select-none">
              <div className="bg-surface-light p-4 rounded-xl mb-4">
                <div className="h-4 w-3/4 bg-white/20 rounded mb-2" />
                <div className="h-4 w-1/2 bg-white/20 rounded" />
              </div>
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/40 backdrop-blur-sm rounded-3xl border border-white/5">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 border border-secondary/20">
                <Lock className="h-6 w-6 text-secondary" />
              </div>
              <p className="text-white font-black text-sm mb-4 leading-tight">Réservé aux Comptes Optimisés AI</p>
              <Button variant="secondary" size="sm" className="w-full font-black text-[11px] uppercase tracking-wider" asChild>
                <Link href="/unlock-vip">DÉBLOQUER MAINTENANT</Link>
              </Button>
              <Link href="/concept-optimus" className="text-[10px] text-text-muted mt-3 underline hover:text-secondary transition-colors">Comment fonctionne l'algorithme Optimus ?</Link>
            </div>
          </div>
        ) : !ticket ? (
          <div className="py-8 text-center bg-surface/30 rounded-2xl border border-dashed border-white/10">
            <Target className="h-10 w-10 text-secondary mx-auto mb-3 opacity-30" />
            <p className="text-white text-sm font-semibold mb-1">Pas d&apos;analyse actuellement.</p>
            <p className="text-text-muted text-xs px-6">Le ticket Optimus sera généré dès que les données de matchs seront disponibles.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {ticket.matches.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-xs text-white font-medium truncate pr-2">{m.homeTeam} - {m.awayTeam}</span>
                  <span className="text-[10px] font-bold text-secondary text-right shrink-0">@{m.selection.odds}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none mb-1">Cote Totale</span>
                <span className="text-2xl font-black text-secondary tracking-tighter italic">@{ticket.total_odds || '5.12'}</span>
              </div>
              <Button size="sm" variant="gradient" asChild className="h-10 px-6">
                <Link href={process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || '#'}>
                  COPIER CODE
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
