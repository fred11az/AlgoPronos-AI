'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Search,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Bookmakers disponibles ────────────────────────────────────────────────

const BOOKMAKERS = [
  { id: '1xbet',      name: '1xBet'     },
  { id: 'melbet',     name: 'Melbet'    },
  { id: 'betwinner',  name: 'Betwinner' },
  { id: 'betway',     name: 'Betway'    },
  { id: 'premierbet', name: 'PremierBet'},
  { id: 'paripesa',   name: 'Paripesa'  },
  { id: 'bet365',     name: 'Bet365'    },
  { id: 'other',      name: 'Autre'     },
];

// ─── Types ─────────────────────────────────────────────────────────────────

interface ApprovedId {
  id: string;
  bookmaker: string;
  account_id: string;
  notes: string | null;
  added_at: string;
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BookmakersPage() {
  const [entries, setEntries]         = useState<ApprovedId[]>([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Formulaire
  const [bookmaker, setBookmaker] = useState('');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes]         = useState('');

  const selectedBM = BOOKMAKERS.find(b => b.id === bookmaker);

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/bookmaker-ids');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries(data.ids || []);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!bookmaker || !accountId.trim()) return;
    setAdding(true);
    try {
      const res  = await fetch('/api/admin/bookmaker-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmaker, account_id: accountId.trim(), notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('ID ajouté — le compte est maintenant optimisé IA ✅');
      setAccountId('');
      setNotes('');
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, aid: string) {
    if (!confirm(`Supprimer l'ID "${aid}" ? Le compte ne sera plus optimisé IA.`)) return;
    setDeletingId(id);
    try {
      const res  = await fetch('/api/admin/bookmaker-ids', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('ID supprimé');
      fetchEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = entries.filter(e =>
    e.account_id.toLowerCase().includes(search.toLowerCase()) ||
    e.bookmaker.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const bmLabel = (id: string) => BOOKMAKERS.find(b => b.id === id)?.name ?? id;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-success" />
            IDs Bookmakers Optimisés
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Les comptes listés ici affichent <span className="text-success font-medium">Félicitations !</span> lors de la vérification, sans qu&apos;ils aient besoin de soumettre une demande.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchEntries} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ── Formulaire d'ajout ──────────────────────────────────────────── */}
      <Card className="mb-6 border-primary/20 bg-surface">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
            Ajouter un ID
          </h2>

          {/* Sélecteur bookmaker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-background border border-surface-light rounded-xl text-left hover:border-primary/40 transition-colors"
            >
              {selectedBM ? (
                <span className="text-white font-medium">{selectedBM.name}</span>
              ) : (
                <span className="text-text-muted">Choisir un bookmaker…</span>
              )}
              <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-surface-light rounded-xl shadow-lg overflow-hidden">
                {BOOKMAKERS.map(bm => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => { setBookmaker(bm.id); setDropdownOpen(false); }}
                    className="w-full flex items-center px-4 py-3 text-left hover:bg-surface-light transition-colors text-white text-sm"
                  >
                    {bm.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ID du compte */}
          <Input
            placeholder="ID du compte bookmaker (ex: 123456789)"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="bg-background border-surface-light"
          />

          {/* Notes optionnelles */}
          <Input
            placeholder="Note optionnelle (ex: Client VIP, batch janvier…)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="bg-background border-surface-light"
          />

          <Button
            onClick={handleAdd}
            disabled={adding || !bookmaker || !accountId.trim()}
            className="w-full bg-success hover:bg-success/90 text-white"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter et activer l&apos;optimisation IA
          </Button>
        </CardContent>
      </Card>

      {/* ── Recherche ───────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Rechercher un ID, bookmaker, note…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-surface border-surface-light"
        />
      </div>

      {/* ── Liste ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-text-muted">
            {search ? 'Aucun résultat pour cette recherche.' : 'Aucun ID enregistré pour l\'instant.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted mb-2">{filtered.length} ID{filtered.length > 1 ? 's' : ''}</p>
          {filtered.map(entry => (
            <Card key={entry.id} className="border-surface-light">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-white font-mono text-sm">{entry.account_id}</code>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {bmLabel(entry.bookmaker)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {entry.notes && (
                          <p className="text-xs text-text-muted italic truncate">{entry.notes}</p>
                        )}
                        <p className="text-xs text-text-muted">
                          {new Date(entry.added_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:text-error hover:bg-error/10 shrink-0"
                    onClick={() => handleDelete(entry.id, entry.account_id)}
                    disabled={deletingId === entry.id}
                  >
                    {deletingId === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
