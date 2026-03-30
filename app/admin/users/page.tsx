'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  ShieldOff,
  Search,
  RefreshCw,
  Loader2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  tier: string | null;
  created_at: string;
  country: string | null;
  verification: {
    id: string;
    bookmaker_identifier: string;
    verified_at: string | null;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Revoke dialog state
  const [revokeUser, setRevokeUser] = useState<UserProfile | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de chargement');
      setUsers(data.users || []);
    } catch {
      toast.error('Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeUser) return;
    setProcessing(revokeUser.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: revokeUser.id,
          reason: revokeReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success('Accès VIP révoqué avec succès');
      setRevokeUser(null);
      setRevokeReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la révocation');
    } finally {
      setProcessing(null);
    }
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const vipCount = users.filter(u => u.tier === 'verified').length;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Gestion des Utilisateurs</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {users.length} utilisateurs · {vipCount} VIP actifs
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-surface border-surface-light"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 border border-surface-light/50 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {u.tier === 'verified'
                        ? <ShieldCheck className="h-5 w-5 text-green-400" />
                        : <User className="h-5 w-5" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{u.full_name || 'Sans nom'}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" /> {u.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {u.tier === 'verified' && u.verification && (
                        <p className="text-xs text-green-400/70 mt-1">
                          ID: <code className="font-mono">{u.verification.bookmaker_identifier}</code>
                          {u.verification.verified_at && (
                            <span className="text-text-muted ml-2">
                              · Activé le {new Date(u.verification.verified_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={u.tier === 'verified' ? 'success' : 'outline'}>
                      {u.tier === 'verified' ? 'VIP Activé' : 'Standard'}
                    </Badge>
                    {u.tier === 'verified' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-8 gap-1"
                        onClick={() => { setRevokeUser(u); setRevokeReason(''); }}
                        disabled={processing === u.id}
                      >
                        {processing === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <ShieldOff className="h-3.5 w-3.5" />
                            Révoquer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!filtered.length && (
                <p className="text-center text-text-muted py-8">Aucun utilisateur trouvé.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revoke Dialog */}
      <Dialog open={!!revokeUser} onOpenChange={open => { if (!open) { setRevokeUser(null); setRevokeReason(''); } }}>
        <DialogContent className="sm:max-w-md bg-surface border-surface-light">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ShieldOff className="h-5 w-5 text-error" />
              Révoquer l&apos;accès VIP
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              L&apos;accès VIP de{' '}
              <span className="text-white font-medium">
                {revokeUser?.full_name || revokeUser?.email}
              </span>{' '}
              sera immédiatement supprimé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">
                Raison <span className="text-text-muted">(optionnel)</span>
              </label>
              <textarea
                placeholder="Ex: Compte 1xBet partenaire non créé via notre lien..."
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-surface-light bg-surface-light px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-error resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setRevokeUser(null); setRevokeReason(''); }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRevokeConfirm}
                disabled={!!processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Confirmer la révocation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
