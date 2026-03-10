'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  RefreshCw,
  Bell,
  Calendar,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DailyTicket {
  id: string;
  date: string;
  matches: Array<{
    home_team: string;
    away_team: string;
    league?: string;
    prediction?: string;
    recommended_bet?: string;
    total_odds?: number;
    odds?: number;
  }>;
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  result_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', variant: 'warning' as const, icon: null },
  won:     { label: 'Gagné',      variant: 'success' as const, icon: Trophy },
  lost:    { label: 'Perdu',      variant: 'destructive' as const, icon: XCircle },
  void:    { label: 'Annulé',     variant: 'outline' as const, icon: MinusCircle },
};

export default function AdminTicketsPage() {
  const [tickets, setTickets]   = useState<DailyTicket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'all' | 'pending' | 'won' | 'lost' | 'void'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [autoResolving, setAutoResolving] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/tickets?status=${filter}&limit=60`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data.tickets || []);
    } catch (e) {
      toast.error('Erreur de chargement des tickets');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function resolve(id: string, status: 'won' | 'lost' | 'void') {
    const notes = status === 'void'
      ? prompt('Raison de l\'annulation (optionnel) :')
      : status === 'lost'
      ? prompt('Notes sur le résultat (optionnel) :')
      : null;

    setProcessing(id);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, result_notes: notes, notify_users: notifyUsers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const statusLabel = status === 'won' ? 'Gagné ✅' : status === 'lost' ? 'Perdu ❌' : 'Annulé ⚪';
      toast.success(
        `Ticket marqué "${statusLabel}"${data.notified > 0 ? ` · ${data.notified} notif${data.notified > 1 ? 's' : ''} envoyées` : ''}`
      );
      fetchTickets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la résolution');
    } finally {
      setProcessing(null);
    }
  }

  async function autoResolve() {
    setAutoResolving(true);
    try {
      const res = await fetch('/api/admin/resolve-tickets', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.resolved === 0) {
        toast.success(data.message || 'Aucun ticket à résoudre pour l\'instant');
      } else {
        toast.success(`${data.resolved} ticket${data.resolved > 1 ? 's' : ''} résolu${data.resolved > 1 ? 's' : ''} automatiquement ✅`);
        fetchTickets();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la résolution automatique');
    } finally {
      setAutoResolving(false);
    }
  }

  const pending = tickets.filter(t => t.status === 'pending').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tickets IA — Résultats</h1>
          <p className="text-text-secondary">
            Marquez les tickets quotidiens comme gagnés, perdus ou annulés.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification toggle */}
          <button
            onClick={() => setNotifyUsers(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
              notifyUsers
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-surface-light border-surface-light text-text-muted'
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifier les users
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={autoResolve}
            disabled={autoResolving}
            className="border-accent/40 text-accent hover:bg-accent/10"
            title="Vérifie les résultats via API-Football et résout les tickets automatiquement"
          >
            {autoResolving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            Résoudre auto
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Pending badge */}
      {pending > 0 && (
        <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span className="text-warning text-sm font-medium">
            {pending} ticket{pending > 1 ? 's' : ''} en attente de résolution
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'won', 'lost', 'void'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Tous' : STATUS_CONFIG[f].label}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          Aucun ticket trouvé
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => {
            const cfg = STATUS_CONFIG[ticket.status];
            return (
              <Card key={ticket.id} className={ticket.status === 'pending' ? 'border-warning/20' : ''}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Date + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                          <Calendar className="h-4 w-4" />
                          {new Date(ticket.date).toLocaleDateString('fr-FR', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                          <TrendingUp className="h-4 w-4" />
                          ×{ticket.total_odds?.toFixed(2)}
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>

                      {/* Matches */}
                      <div className="space-y-1.5">
                        {(ticket.matches || []).map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-white font-medium">
                              {m.home_team} vs {m.away_team}
                            </span>
                            {m.league && (
                              <span className="text-text-muted text-xs">· {m.league}</span>
                            )}
                            <span className="text-primary text-xs ml-auto">
                              {m.prediction || m.recommended_bet}
                              {(m.total_odds || m.odds) && ` @ ${(m.total_odds || m.odds)?.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Notes si résoldu */}
                      {ticket.result_notes && (
                        <p className="mt-3 text-xs text-text-muted bg-surface-light rounded-lg px-3 py-2">
                          {ticket.result_notes}
                        </p>
                      )}
                      {ticket.resolved_at && (
                        <p className="mt-2 text-xs text-text-muted">
                          Résolu le {new Date(ticket.resolved_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {ticket.status === 'pending' && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-success/20 text-success border border-success/30 hover:bg-success hover:text-white"
                          onClick={() => resolve(ticket.id, 'won')}
                          disabled={processing === ticket.id}
                        >
                          {processing === ticket.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Gagné
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="opacity-80"
                          onClick={() => resolve(ticket.id, 'lost')}
                          disabled={processing === ticket.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Perdu
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolve(ticket.id, 'void')}
                          disabled={processing === ticket.id}
                        >
                          <MinusCircle className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
