'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Zap, ArrowRight, ShieldCheck, Layers } from 'lucide-react';

export default function TicketMontanteWidget() {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ticket-du-jour?type=montante')
      .then(res => res.json())
      .then(data => setTicket(data.ticket))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!ticket) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-8 text-center">
          <Layers className="h-10 w-10 text-primary mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-white mb-2 italic">La Montante IA</h3>
          <p className="text-text-secondary text-sm mb-1">Pas d&apos;analyse actuellement.</p>
          <p className="text-text-muted text-xs mb-6">Le ticket sera généré automatiquement dès que les données de matchs seront disponibles.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/concept-montante">Voir le concept</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const match = ticket.matches[0];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp className="h-24 w-24 text-primary" />
      </div>
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 italic">
              <Zap className="h-5 w-5 text-primary fill-primary" />
              La Montante IA
            </CardTitle>
            <CardDescription>Étape {ticket.current_step || 1} • Objectif Qualité</CardDescription>
          </div>
          <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
            Ultra Safe
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-background/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{match.league}</span>
            <span className="text-xs font-bold text-primary">Confiance 92%</span>
          </div>
          <div className="text-white font-black text-lg mb-3">
            {match.homeTeam} vs {match.awayTeam}
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <span className="text-sm text-text-muted">Sélection : <span className="text-white font-bold">{match.selection.value}</span></span>
            <span className="text-xl font-black text-primary">@{match.selection.odds}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/3" />
            </div>
          </div>
          <span className="text-[10px] font-black text-text-muted uppercase italic">Progression</span>
        </div>

        <div className="flex gap-2">
          <Button variant="gradient" className="flex-1 h-11" asChild>
            <Link href={process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || '#'}>
              Parier sur l'étape
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="h-11 px-4" asChild title="Comment ça marche ?">
            <Link href="/concept-montante">
              <ShieldCheck className="h-5 w-5 text-text-muted" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
