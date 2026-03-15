'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    setDone(false);
    
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la synchronisation');
      
      setDone(true);
      alert(data.message || 'Synchronisation terminée !');
      
      // Reset after 3 seconds
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={loading}
      variant={done ? "success" : "gradient"}
      className="gap-2"
    >
      {loading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Synchronisation en cours...
        </>
      ) : done ? (
        <>
          <Check className="h-4 w-4" />
          Terminé
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Actualiser Matchs & IA
        </>
      )}
    </Button>
  );
}
