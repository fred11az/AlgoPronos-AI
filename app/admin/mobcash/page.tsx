'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2, RefreshCw, ArrowDownCircle, ArrowUpCircle,
  CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Status = 'all' | 'pending' | 'processing' | 'completed' | 'rejected';

interface MobcashRequest {
  id: string;
  type: 'depot' | 'retrait';
  amount: number;
  bookmaker: string;
  bookmaker_id: string;
  phone: string;
  full_name: string;
  email: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: 'En attente',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  processing: { label: 'En cours',     color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: AlertCircle },
  completed:  { label: 'Complétée',    color: 'bg-success/20 text-success border-success/30',           icon: CheckCircle2 },
  rejected:   { label: 'Rejetée',      color: 'bg-error/20 text-error border-error/30',                icon: XCircle },
};

export default function AdminMobcashPage() {
  const [requests, setRequests]   = useState<MobcashRequest[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<Status>('all');
  const [updating, setUpdating]   = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/mobcash?status=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/mobcash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_notes: noteInputs[id] || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Statut mis à jour');
      fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setUpdating(null);
    }
  }

  const filterTabs: { key: Status; label: string }[] = [
    { key: 'all',        label: 'Toutes' },
    { key: 'pending',    label: 'En attente' },
    { key: 'processing', label: 'En cours' },
    { key: 'completed',  label: 'Complétées' },
    { key: 'rejected',   label: 'Rejetées' },
  ];

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
            💳 Caisse MobCash
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Gestion des demandes de dépôt et retrait 1xBet via MobCash
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === tab.key
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-surface-light text-text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-text-muted text-sm self-center">{total} demande{total > 1 ? 's' : ''}</span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-text-muted">
            Aucune demande pour ce filtre.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const cfg    = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
            const Icon   = cfg.icon;
            const TypeIcon = req.type === 'depot' ? ArrowDownCircle : ArrowUpCircle;
            const typeColor = req.type === 'depot' ? 'text-success' : 'text-orange-400';
            return (
              <Card key={req.id} className="border-surface-light">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Icône type */}
                    <div className={`mt-0.5 ${typeColor}`}>
                      <TypeIcon className="h-6 w-6" />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="text-white font-bold text-lg">
                          {req.amount.toLocaleString('fr-FR')} FCFA
                        </span>
                        <Badge className={`text-xs border ${cfg.color}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                        <span className="text-text-muted text-xs">
                          {new Date(req.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                        <p className="text-text-secondary"><span className="text-text-muted">Nom :</span> {req.full_name}</p>
                        <p className="text-text-secondary"><span className="text-text-muted">Tél :</span> {req.phone}</p>
                        <p className="text-text-secondary">
                          <span className="text-text-muted">ID {req.bookmaker} :</span>{' '}
                          <code className="text-primary font-mono">{req.bookmaker_id}</code>
                        </p>
                        {req.email && <p className="text-text-secondary"><span className="text-text-muted">Email :</span> {req.email}</p>}
                        {req.notes && <p className="text-text-muted italic col-span-2 text-xs mt-1">"{req.notes}"</p>}
                      </div>
                      {req.admin_notes && (
                        <p className="text-xs text-primary/70 italic mt-2 border-l-2 border-primary/30 pl-2">{req.admin_notes}</p>
                      )}

                      {/* Actions */}
                      {req.status !== 'completed' && req.status !== 'rejected' && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="Note admin (optionnel)…"
                            value={noteInputs[req.id] || ''}
                            onChange={e => setNoteInputs(n => ({ ...n, [req.id]: e.target.value }))}
                            className="text-sm bg-background border-surface-light h-8 flex-1"
                          />
                          <div className="flex gap-2 shrink-0">
                            {req.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                onClick={() => updateStatus(req.id, 'processing')}
                                disabled={updating === req.id}
                              >
                                {updating === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'En cours'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="bg-success hover:bg-success/90 text-white"
                              onClick={() => updateStatus(req.id, 'completed')}
                              disabled={updating === req.id}
                            >
                              {updating === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Complétée'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-error hover:bg-error/10"
                              onClick={() => updateStatus(req.id, 'rejected')}
                              disabled={updating === req.id}
                            >
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
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
