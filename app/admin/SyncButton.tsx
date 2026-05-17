'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, Calendar, Zap, TrendingUp, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

type TicketType = 'classic' | 'optimus' | 'montante';

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingProno, setLoadingProno] = useState(false);
  const [doneProno, setDoneProno] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState<TicketType | null>(null);
  const [doneTicket, setDoneTicket] = useState<TicketType | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setDone(false);
    const toastId = toast.loading('Synchronisation des matchs...');
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la synchronisation');
      setDone(true);
      toast.success(data.message || 'Synchronisation terminée !', { id: toastId });
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePronostics = async () => {
    setLoadingProno(true);
    setDoneProno(false);
    const toastId = toast.loading('Génération des pronostics en cours... (30-60s)');
    try {
      const res = await fetch('/api/pronostics/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      setDoneProno(true);
      const count = data.generated ?? data.inserted ?? data.count ?? '?';
      toast.success(`✅ ${count} pronostics générés avec succès !`, { id: toastId, duration: 5000 });
      setTimeout(() => setDoneProno(false), 3000);
    } catch (err: any) {
      toast.error('Erreur : ' + err.message, { id: toastId });
    } finally {
      setLoadingProno(false);
    }
  };

  const handleGenerateTicket = async (type: TicketType) => {
    setLoadingTicket(type);
    setDoneTicket(null);
    const labels: Record<TicketType, string> = { classic: 'Classique', optimus: 'Optimus', montante: 'Montante' };
    const toastId = toast.loading(`Génération Ticket ${labels[type]}... (20-40s)`);
    try {
      const res = await fetch(`/api/admin/generate-ticket?type=${type}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de la génération');
      setDoneTicket(type);
      toast.success(`✅ Ticket ${labels[type]} généré !`, { id: toastId, duration: 5000 });
      setTimeout(() => setDoneTicket(null), 3000);
    } catch (err: any) {
      toast.error('Erreur : ' + err.message, { id: toastId });
    } finally {
      setLoadingTicket(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={handleSync}
        disabled={loading}
        variant={done ? 'success' : 'gradient'}
        className="gap-2"
      >
        {loading ? (
          <><RefreshCw className="h-4 w-4 animate-spin" />Synchronisation...</>
        ) : done ? (
          <><Check className="h-4 w-4" />Terminé</>
        ) : (
          <><RefreshCw className="h-4 w-4" />Actualiser Matchs</>
        )}
      </Button>

      <Button
        onClick={handleGeneratePronostics}
        disabled={loadingProno}
        variant={doneProno ? 'success' : 'outline'}
        className="gap-2"
      >
        {loadingProno ? (
          <><RefreshCw className="h-4 w-4 animate-spin" />Génération en cours...</>
        ) : doneProno ? (
          <><Check className="h-4 w-4" />Pronostics générés</>
        ) : (
          <><Calendar className="h-4 w-4" />Pronostics 7 jours</>
        )}
      </Button>

      <Button
        onClick={() => handleGenerateTicket('classic')}
        disabled={!!loadingTicket}
        variant={doneTicket === 'classic' ? 'success' : 'outline'}
        className="gap-2"
      >
        {loadingTicket === 'classic' ? (
          <><RefreshCw className="h-4 w-4 animate-spin" />Classique...</>
        ) : doneTicket === 'classic' ? (
          <><Check className="h-4 w-4" />Classique OK</>
        ) : (
          <><Zap className="h-4 w-4" />Ticket Classique</>
        )}
      </Button>

      <Button
        onClick={() => handleGenerateTicket('optimus')}
        disabled={!!loadingTicket}
        variant={doneTicket === 'optimus' ? 'success' : 'outline'}
        className="gap-2"
      >
        {loadingTicket === 'optimus' ? (
          <><RefreshCw className="h-4 w-4 animate-spin" />Optimus...</>
        ) : doneTicket === 'optimus' ? (
          <><Check className="h-4 w-4" />Optimus OK</>
        ) : (
          <><TrendingUp className="h-4 w-4" />Ticket Optimus</>
        )}
      </Button>

      <Button
        onClick={() => handleGenerateTicket('montante')}
        disabled={!!loadingTicket}
        variant={doneTicket === 'montante' ? 'success' : 'outline'}
        className="gap-2"
      >
        {loadingTicket === 'montante' ? (
          <><RefreshCw className="h-4 w-4 animate-spin" />Montante...</>
        ) : doneTicket === 'montante' ? (
          <><Check className="h-4 w-4" />Montante OK</>
        ) : (
          <><Shield className="h-4 w-4" />Ticket Montante</>
        )}
      </Button>
    </div>
  );
}
