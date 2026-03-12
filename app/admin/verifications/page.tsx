'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Loader2,
  Clock,
  Image as ImageIcon,
  RefreshCw,
  Mail,
  MessageCircle,
  User,
  Calendar,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Verification {
  id: string;
  user_id: string;
  bookmaker_identifier: string;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG = {
  pending:  { label: 'En attente', variant: 'warning'     as const, icon: Clock },
  approved: { label: 'Approuvé',   variant: 'success'     as const, icon: CheckCircle },
  rejected: { label: 'Rejeté',     variant: 'destructive' as const, icon: XCircle },
};

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => { fetchVerifications(); }, [filter]);

  async function fetchVerifications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de chargement');
      setVerifications(data.verifications || []);
    } catch {
      toast.error('Erreur de chargement des vérifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      const notifMsg = data.notification?.email ? ' · Email envoyé ✓' : '';
      const waMsg = data.notification?.whatsapp ? ' · WhatsApp ✓' : '';
      toast.success(`Compte activé !${notifMsg}${waMsg}`);
      fetchVerifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectId) return;
    setProcessing(rejectId);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rejectId, status: 'rejected', admin_notes: rejectNotes.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      const notifMsg = data.notification?.email ? ' · Email envoyé ✓' : '';
      toast.success(`Rejeté.${notifMsg}`);
      setRejectId(null);
      setRejectNotes('');
      fetchVerifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  }

  function openScreenshot(v: Verification) {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vip-verifications/${v.screenshot_url}`;
    window.open(url, '_blank');
  }

  const filtered = verifications.filter(v =>
    v.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.bookmaker_identifier?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = verifications.filter(v => v.status === 'pending').length;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Activations</h1>
          <p className="text-sm text-text-secondary mt-0.5">Vérifiez et activez les comptes Full Access</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="warning" className="text-sm px-2.5 py-1">
              {pendingCount} en attente
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={fetchVerifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-surface border-surface-light"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['pending', 'all', 'approved', 'rejected'] as FilterStatus[]).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tous' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-text-muted">
            Aucune vérification trouvée
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const cfg = STATUS_CONFIG[v.status];
            const isProcessing = processing === v.id;
            return (
              <Card key={v.id} className="border-surface-light overflow-hidden">
                <CardContent className="p-4">
                  {/* Top row: avatar + info + status */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(v.user?.full_name || v.user?.email || 'U')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">
                            {v.user?.full_name || 'Utilisateur'}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 text-text-muted shrink-0" />
                            <p className="text-xs text-text-muted truncate">{v.user?.email}</p>
                          </div>
                        </div>
                        <Badge variant={cfg.variant} className="shrink-0 text-xs">
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-background rounded-lg px-3 py-2">
                      <p className="text-xs text-text-muted mb-0.5">ID Bookmaker</p>
                      <code className="text-xs text-primary font-mono break-all">{v.bookmaker_identifier}</code>
                    </div>
                    <div className="bg-background rounded-lg px-3 py-2">
                      <p className="text-xs text-text-muted mb-0.5">Soumis le</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(v.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Screenshot + admin notes */}
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    {v.screenshot_url ? (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openScreenshot(v)}>
                        <ImageIcon className="h-3.5 w-3.5" />
                        Voir capture
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-xs text-text-muted">Pas de capture</span>
                    )}
                    {v.admin_notes && (
                      <p className="text-xs text-text-muted italic">Note: {v.admin_notes}</p>
                    )}
                  </div>

                  {/* Action buttons (pending only) */}
                  {v.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-9"
                        onClick={() => handleApprove(v.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approuver &amp; Activer
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs h-9"
                        onClick={() => { setRejectId(v.id); setRejectNotes(''); }}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Rejection Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!rejectId} onOpenChange={open => { if (!open) { setRejectId(null); setRejectNotes(''); } }}>
        <DialogContent className="sm:max-w-md bg-surface border-surface-light">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <XCircle className="h-5 w-5 text-error" />
              Rejeter la demande
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              Un email sera envoyé à l&apos;utilisateur pour l&apos;informer du rejet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">
                Raison du rejet <span className="text-text-muted">(optionnel)</span>
              </label>
              <Textarea
                placeholder="Ex: ID bookmaker non reconnu, compte non créé via notre lien partenaire..."
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                className="bg-surface-light border-surface-light focus:border-error resize-none text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setRejectId(null); setRejectNotes(''); }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRejectConfirm}
                disabled={!!processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirmer le rejet'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
