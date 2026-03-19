'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, Calendar } from 'lucide-react';

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingProno, setLoadingProno] = useState(false);
  const [doneProno, setDoneProno] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la synchronisation');
      setDone(true);
      alert(data.message || 'Synchronisation terminée !');
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePronostics = async () => {
    setLoadingProno(true);
    setDoneProno(false);
    try {
      const res = await fetch('/api/pronostics/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      setDoneProno(true);
      alert(`✅ Pronostics générés !\n${JSON.stringify(data, null, 2).substring(0, 300)}`);
      setTimeout(() => setDoneProno(false), 3000);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setLoadingProno(false);
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
          <><RefreshCw className="h-4 w-4 animate-spin" />Génération en cours... (30-60s)</>
        ) : doneProno ? (
          <><Check className="h-4 w-4" />Pronostics générés</>
        ) : (
          <><Calendar className="h-4 w-4" />Générer Pronostics 7 jours</>
        )}
      </Button>
    </div>
  );
}
