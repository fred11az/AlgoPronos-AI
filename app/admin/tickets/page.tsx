'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  PlusCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DailyTicket {
  id: string;
  date: string;
  matches: Array<{
    homeTeam?: string;
    awayTeam?: string;
    home_team?: string;
    away_team?: string;
    league?: string;
    prediction?: string;
    recommended_bet?: string;
    total_odds?: number;
    odds?: number;
    selection?: { type?: string; value?: string; odds?: number };
  }>;
  total_odds: number;
  confidence_pct: number;
  risk_level: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  result_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface MatchRow {
  home_team: string;
  away_team: string;
  league: string;
  prediction: string;
  odds: string;
}

const EMPTY_MATCH: MatchRow = { home_team: '', away_team: '', league: '', prediction: '', odds: '' };

const STATUS_CONFIG = {
  pending: { label: 'En attente', variant: 'warning' as const, icon: null },
  won:     { label: 'Gagné',      variant: 'success' as const, icon: Trophy },
  lost:    { label: 'Perdu',      variant: 'destructive' as const, icon: XCircle },
  void:    { label: 'Annulé',     variant: 'outline' as const, icon: MinusCircle },
};

// ─── Dialog states ───────────────────────────────────────────────────────────

interface ConfirmDialog {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

interface NotesDialog {
  open: boolean;
  title: string;
  placeholder: string;
  onConfirm: (notes: string) => void;
}

interface ScoreDialog {
  open: boolean;
  ticket: DailyTicket | null;
  status: 'won' | 'lost';
  homeScores: string[];
  awayScores: string[];
  notes: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets]   = useState<DailyTicket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'all' | 'pending' | 'won' | 'lost' | 'void'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [autoResolving, setAutoResolving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false, title: '', description: '', onConfirm: () => {},
  });
  const [notesDialog, setNotesDialog] = useState<NotesDialog>({
    open: false, title: '', placeholder: '', onConfirm: () => {},
  });
  const [notesValue, setNotesValue] = useState('');
  const [scoreDialog, setScoreDialog] = useState<ScoreDialog>({
    open: false, ticket: null, status: 'won', homeScores: [], awayScores: [], notes: '',
  });

  // ── Manual creation dialog ──────────────────────────────────────────────
  const [createDialog, setCreateDialog] = useState(false);
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createMatches, setCreateMatches] = useState<MatchRow[]>([{ ...EMPTY_MATCH }]);
  const [createConfidence, setCreateConfidence] = useState('75');
  const [createRisk, setCreateRisk] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [creating, setCreating] = useState(false);

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

  // Exécute la résolution avec notes et scores optionnels
  async function resolveWithNotes(
    id: string,
    status: 'won' | 'lost' | 'void',
    notes: string | null,
    scores?: string[],
  ) {
    setProcessing(id);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, result_notes: notes, notify_users: notifyUsers, scores }),
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

  // Ouvre le dialog de scores pour won/lost, ou le dialog de notes pour void
  function resolve(ticket: DailyTicket, status: 'won' | 'lost' | 'void') {
    if (status === 'void') {
      setNotesValue('');
      setNotesDialog({
        open: true,
        title: "Raison de l'annulation",
        placeholder: 'Raison (optionnel)...',
        onConfirm: (notes) => resolveWithNotes(ticket.id, status, notes || null),
      });
      return;
    }
    const n = (ticket.matches || []).length;
    setScoreDialog({
      open: true,
      ticket,
      status,
      homeScores: Array(n).fill(''),
      awayScores: Array(n).fill(''),
      notes: '',
    });
  }

  function submitScoreDialog() {
    if (!scoreDialog.ticket) return;
    const scores = scoreDialog.homeScores.map((h, i) => {
      const hs = h.trim();
      const as_ = scoreDialog.awayScores[i].trim();
      if (hs === '' && as_ === '') return '';
      return `${hs || '?'}-${as_ || '?'}`;
    });
    const nonEmpty = scores.filter(Boolean);
    resolveWithNotes(
      scoreDialog.ticket.id,
      scoreDialog.status,
      scoreDialog.notes || null,
      nonEmpty.length > 0 ? scores : undefined,
    );
    setScoreDialog(d => ({ ...d, open: false }));
  }

  async function generateToday() {
    setConfirmDialog({
      open: true,
      title: 'Régénérer le ticket du jour',
      description: 'Le ticket du jour existant sera supprimé et régénéré depuis API-Football. Cette action est irréversible.',
      onConfirm: async () => {
        setGenerating(true);
        try {
          const res = await fetch('/api/admin/generate-ticket', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || JSON.stringify(data.details));
          toast.success('Ticket du jour généré ✅');
          fetchTickets();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Erreur de génération');
        } finally {
          setGenerating(false);
        }
      },
    });
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

  // ── Manual creation helpers ─────────────────────────────────────────────

  function openCreateDialog() {
    setCreateDate(new Date().toISOString().split('T')[0]);
    setCreateMatches([{ ...EMPTY_MATCH }]);
    setCreateConfidence('75');
    setCreateRisk('balanced');
    setCreateDialog(true);
  }

  function updateMatch(idx: number, field: keyof MatchRow, value: string) {
    setCreateMatches(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  function addMatch() {
    setCreateMatches(prev => [...prev, { ...EMPTY_MATCH }]);
  }

  function removeMatch(idx: number) {
    setCreateMatches(prev => prev.filter((_, i) => i !== idx));
  }

  // Cote totale calculée à la volée
  const computedTotalOdds = createMatches.reduce((acc, m) => {
    const o = parseFloat(m.odds);
    return isNaN(o) || o <= 0 ? acc : acc * o;
  }, 1).toFixed(2);

  async function submitCreate(replace: boolean) {
    const validMatches = createMatches.filter(m =>
      m.home_team.trim() && m.away_team.trim() && m.prediction.trim() && parseFloat(m.odds) > 0
    );
    if (validMatches.length === 0) {
      toast.error('Ajoutez au moins un match complet (équipes, pronostic, cote)');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: createDate,
          matches: validMatches.map(m => ({
            home_team: m.home_team.trim(),
            away_team: m.away_team.trim(),
            league: m.league.trim(),
            prediction: m.prediction.trim(),
            odds: parseFloat(m.odds),
          })),
          confidence_pct: parseInt(createConfidence) || 75,
          risk_level: createRisk,
          replace,
        }),
      });
      const data = await res.json();

      if (res.status === 409 && !replace) {
        // Ticket déjà existant — demander confirmation de remplacement
        setCreateDialog(false);
        setConfirmDialog({
          open: true,
          title: 'Ticket déjà existant',
          description: `Un ticket existe déjà pour le ${createDate}. Voulez-vous le remplacer ?`,
          onConfirm: () => {
            setCreateDialog(true);
            submitCreate(true);
          },
        });
        return;
      }

      if (!res.ok) throw new Error(data.error);
      toast.success(`Coupon du ${createDate} publié ✅`);
      setCreateDialog(false);
      fetchTickets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }

  const pending = tickets.filter(t => t.status === 'pending').length;

  return (
    <div className="p-8">
      {/* ── Confirm Dialog ── */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(d => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmDialog(d => ({ ...d, open: false }))}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDialog(d => ({ ...d, open: false }));
                confirmDialog.onConfirm();
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Notes Dialog ── */}
      <Dialog open={notesDialog.open} onOpenChange={(o) => setNotesDialog(d => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{notesDialog.title}</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full rounded-lg bg-surface-light border border-surface-light text-white placeholder:text-text-muted text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={3}
            placeholder={notesDialog.placeholder}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
          />
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setNotesDialog(d => ({ ...d, open: false }))}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setNotesDialog(d => ({ ...d, open: false }));
                notesDialog.onConfirm(notesValue);
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Score Dialog (won/lost) ── */}
      <Dialog open={scoreDialog.open} onOpenChange={(o) => setScoreDialog(d => ({ ...d, open: o }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {scoreDialog.status === 'won' ? '✅ Ticket Gagné' : '❌ Ticket Perdu'} — Scores
            </DialogTitle>
            <DialogDescription>
              Entrez le score final de chaque match (optionnel).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(scoreDialog.ticket?.matches || []).map((m, i) => (
              <div key={i} className="bg-surface-light rounded-xl p-3">
                <p className="text-xs text-text-muted mb-2">
                  {m.homeTeam || m.home_team} vs {m.awayTeam || m.away_team}
                  {m.league && <span className="ml-1">· {m.league}</span>}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Dom."
                    value={scoreDialog.homeScores[i] ?? ''}
                    onChange={(e) => setScoreDialog(d => {
                      const h = [...d.homeScores]; h[i] = e.target.value; return { ...d, homeScores: h };
                    })}
                    className="w-16 text-center rounded-lg bg-background border border-surface-light text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-text-muted font-bold">—</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ext."
                    value={scoreDialog.awayScores[i] ?? ''}
                    onChange={(e) => setScoreDialog(d => {
                      const a = [...d.awayScores]; a[i] = e.target.value; return { ...d, awayScores: a };
                    })}
                    className="w-16 text-center rounded-lg bg-background border border-surface-light text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-xs text-text-muted mb-1">Notes (optionnel)</label>
              <textarea
                className="w-full rounded-lg bg-surface-light border border-surface-light text-white placeholder:text-text-muted text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                rows={2}
                placeholder="Commentaire sur le résultat..."
                value={scoreDialog.notes}
                onChange={(e) => setScoreDialog(d => ({ ...d, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setScoreDialog(d => ({ ...d, open: false }))}>
              Annuler
            </Button>
            <Button
              className={scoreDialog.status === 'won' ? 'bg-success text-white hover:bg-success/90' : 'bg-destructive text-white hover:bg-destructive/90'}
              onClick={submitScoreDialog}
            >
              {scoreDialog.status === 'won' ? '✅ Confirmer Gagné' : '❌ Confirmer Perdu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manual Creation Dialog ── */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Poster le coupon du jour manuellement
            </DialogTitle>
            <DialogDescription>
              Renseignez les matchs et pronostics. La cote totale est calculée automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Date + meta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Date du coupon</label>
                <input
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  className="w-full rounded-lg bg-surface-light border border-surface-light text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Confiance (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={createConfidence}
                  onChange={(e) => setCreateConfidence(e.target.value)}
                  className="w-full rounded-lg bg-surface-light border border-surface-light text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="75"
                />
              </div>
            </div>

            {/* Risk level */}
            <div>
              <label className="block text-xs text-text-muted mb-2">Niveau de risque</label>
              <div className="flex gap-2">
                {(['low', 'balanced', 'high'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCreateRisk(r)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      createRisk === r
                        ? r === 'low'
                          ? 'bg-success/20 border-success/40 text-success'
                          : r === 'balanced'
                          ? 'bg-primary/20 border-primary/40 text-primary'
                          : 'bg-destructive/20 border-destructive/40 text-destructive'
                        : 'bg-surface-light border-surface-light text-text-muted'
                    }`}
                  >
                    {r === 'low' ? 'Faible' : r === 'balanced' ? 'Équilibré' : 'Élevé'}
                  </button>
                ))}
              </div>
            </div>

            {/* Matches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-text-muted">Matchs ({createMatches.length})</label>
                <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Cote totale : ×{computedTotalOdds}
                </div>
              </div>

              <div className="space-y-3">
                {createMatches.map((m, idx) => (
                  <div key={idx} className="bg-surface-light rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted font-medium">Match {idx + 1}</span>
                      {createMatches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMatch(idx)}
                          className="text-text-muted hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Équipe domicile"
                        value={m.home_team}
                        onChange={(e) => updateMatch(idx, 'home_team', e.target.value)}
                        className="rounded-lg bg-background border border-surface-light text-white text-sm px-3 py-1.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="text"
                        placeholder="Équipe extérieure"
                        value={m.away_team}
                        onChange={(e) => updateMatch(idx, 'away_team', e.target.value)}
                        className="rounded-lg bg-background border border-surface-light text-white text-sm px-3 py-1.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Compétition"
                        value={m.league}
                        onChange={(e) => updateMatch(idx, 'league', e.target.value)}
                        className="rounded-lg bg-background border border-surface-light text-white text-sm px-3 py-1.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="text"
                        placeholder="Pronostic (ex: 1, 1X, +2.5)"
                        value={m.prediction}
                        onChange={(e) => updateMatch(idx, 'prediction', e.target.value)}
                        className="rounded-lg bg-background border border-surface-light text-white text-sm px-3 py-1.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="Cote"
                        value={m.odds}
                        onChange={(e) => updateMatch(idx, 'odds', e.target.value)}
                        className="rounded-lg bg-background border border-surface-light text-white text-sm px-3 py-1.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMatch}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-primary/30 text-primary text-sm hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter un match
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => submitCreate(false)}
              disabled={creating}
              className="bg-primary text-white"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4 mr-1" />
              )}
              Publier le coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tickets IA — Résultats</h1>
          <p className="text-text-secondary">
            Marquez les tickets quotidiens comme gagnés, perdus ou annulés.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
            variant="default"
            size="sm"
            onClick={openCreateDialog}
            className="bg-primary text-white hover:bg-primary/90"
            title="Poster le coupon du jour manuellement"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Poster le coupon
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateToday}
            disabled={generating}
            className="border-secondary/40 text-secondary hover:bg-secondary/10"
            title="Supprime le ticket du jour et le régénère depuis API-Football"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-1" />
            )}
            Générer (IA)
          </Button>
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
                              {m.homeTeam || m.home_team} vs {m.awayTeam || m.away_team}
                            </span>
                            {m.league && (
                              <span className="text-text-muted text-xs">· {m.league}</span>
                            )}
                            <span className="text-primary text-xs ml-auto">
                              {m.selection?.value || m.prediction || m.recommended_bet}
                              {(m.selection?.odds || m.total_odds || m.odds) && ` @ ${(m.selection?.odds || m.total_odds || m.odds)?.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Notes si résolu */}
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
                          onClick={() => resolve(ticket, 'won')}
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
                          onClick={() => resolve(ticket, 'lost')}
                          disabled={processing === ticket.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Perdu
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolve(ticket, 'void')}
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
