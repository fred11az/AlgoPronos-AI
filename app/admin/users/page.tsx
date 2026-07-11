'use client';

/**
 * Gestion des utilisateurs (admin) — tableau lisible (nom, email, téléphone,
 * pays, statut, date) + sélection multiple + composeur de campagnes email HTML
 * (envoi à tous les utilisateurs ou à la sélection) via /api/admin/campaigns.
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  ShieldCheck,
  ShieldOff,
  Search,
  RefreshCw,
  Loader2,
  XCircle,
  Send,
  Mail,
  Eye,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  tier: string | null;
  created_at: string;
  country: string | null;
  verification: {
    id: string;
    bookmaker_identifier: string;
    verified_at: string | null;
  } | null;
}

interface CampaignForm {
  subject: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}

// ─── Modèles de campagne prêts à l'emploi ────────────────────────────────────

const APP_URL = 'https://algopronos.com';

const CAMPAIGN_TEMPLATES: { name: string; form: CampaignForm }[] = [
  {
    name: 'Invitation Compte Optimisé IA',
    form: {
      subject: 'Débloquez votre Compte Optimisé IA — 100% gratuit',
      title: 'Votre IA de pronostics vous attend',
      body: `Vous utilisez AlgoPronos en accès de base — vous passez à côté du meilleur.

En créant votre Compte Optimisé IA (gratuit, moins de 5 minutes), vous débloquez : le ticket IA quotidien, les value bets détectés automatiquement, les analyses xG en temps réel et un bonus majoré à l'inscription.

Nos membres Full Access reçoivent chaque matin la sélection du jour, calculée par notre moteur Neural v4.2. Rejoignez-les dès aujourd'hui.`,
      ctaLabel: 'Créer mon Compte Optimisé IA',
      ctaUrl: `${APP_URL}/compte-optimise-ia`,
    },
  },
  {
    name: 'Nouvel article',
    form: {
      subject: 'Nouvelle analyse AlgoPronos à ne pas manquer',
      title: 'Notre dernière analyse est en ligne',
      body: `Notre équipe vient de publier une nouvelle analyse sur AlgoPronos.

[Résumez ici l'article en 2-3 phrases : le match, le contexte, ce que dit notre modèle IA.]

Lisez l'analyse complète et découvrez les value bets identifiés par notre moteur Neural v4.2.`,
      ctaLabel: "Lire l'article",
      ctaUrl: `${APP_URL}/actualites`,
    },
  },
  {
    name: 'Annonce / promo',
    form: {
      subject: 'Du nouveau sur AlgoPronos',
      title: 'Une annonce importante',
      body: `[Rédigez votre annonce ici — nouvelle fonctionnalité, offre spéciale, événement…]

[Deuxième paragraphe si besoin. Une ligne "![légende](https://url-image)" insère une image.]`,
      ctaLabel: 'Découvrir',
      ctaUrl: APP_URL,
    },
  },
];

const EMPTY_CAMPAIGN: CampaignForm = {
  subject: '', title: '', body: '', ctaLabel: '', ctaUrl: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Revoke dialog
  const [revokeUser, setRevokeUser] = useState<UserProfile | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Campaign dialog
  const [campaignOpen, setCampaignOpen] = useState(false);

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

  async function handleInvite(userId: string) {
    setProcessing(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success('Invitation envoyée · Email reçu ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setProcessing(null);
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
      const notifMsg = data.notification?.email ? ' · Email envoyé ✓' : '';
      toast.success(`Accès VIP révoqué avec succès${notifMsg}`);
      setRevokeUser(null);
      setRevokeReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la révocation');
    } finally {
      setProcessing(null);
    }
  }

  const filtered = useMemo(() => users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const vipCount = users.filter(u => u.tier === 'verified').length;
  const allFilteredSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));

  const toggleOne = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleAllFiltered = () => setSelected(prev => {
    const next = new Set(prev);
    if (allFilteredSelected) filtered.forEach(u => next.delete(u.id));
    else filtered.forEach(u => next.add(u.id));
    return next;
  });

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Gestion des Utilisateurs</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {users.length} utilisateurs · {vipCount} VIP actifs
            {selected.size > 0 && <span className="text-primary font-bold"> · {selected.size} sélectionné(s)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            className="gap-2 font-bold"
            onClick={() => setCampaignOpen(true)}
          >
            <Mail className="h-4 w-4" />
            {selected.size > 0 ? `Envoyer un email (${selected.size})` : 'Campagne email'}
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Rechercher par nom, email ou téléphone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-surface border-surface-light"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-[11px] text-text-muted uppercase tracking-widest border-b border-surface-light bg-surface-light/30">
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleAllFiltered}
                        className="h-4 w-4 accent-[#7c3aed] cursor-pointer"
                        title="Tout sélectionner (résultats filtrés)"
                      />
                    </th>
                    <th className="py-3 px-2 font-bold">Nom</th>
                    <th className="py-3 px-2 font-bold">Email</th>
                    <th className="py-3 px-2 font-bold">Téléphone</th>
                    <th className="py-3 px-2 font-bold">Pays</th>
                    <th className="py-3 px-2 font-bold">Statut</th>
                    <th className="py-3 px-2 font-bold whitespace-nowrap">Inscrit le</th>
                    <th className="py-3 px-2 font-bold text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-light/60">
                  {filtered.map(u => (
                    <tr
                      key={u.id}
                      className={`hover:bg-white/[0.02] transition-colors ${selected.has(u.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-3 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleOne(u.id)}
                          className="h-4 w-4 accent-[#7c3aed] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            {u.tier === 'verified'
                              ? <ShieldCheck className="h-4 w-4 text-green-400" />
                              : <User className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[180px]">{u.full_name || '—'}</p>
                            {u.tier === 'verified' && u.verification && (
                              <p className="text-[10px] text-green-400/70 font-mono truncate">
                                1xBet: {u.verification.bookmaker_identifier}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        <span className="truncate block max-w-[220px]" title={u.email}>{u.email}</span>
                      </td>
                      <td className="py-3 px-2 text-text-secondary whitespace-nowrap">{u.phone || '—'}</td>
                      <td className="py-3 px-2 text-text-secondary whitespace-nowrap">{u.country || '—'}</td>
                      <td className="py-3 px-2">
                        <Badge variant={u.tier === 'verified' ? 'success' : 'outline'}>
                          {u.tier === 'verified' ? 'VIP' : 'Standard'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-text-muted whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-2 pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.tier === 'verified' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-8 gap-1"
                              onClick={() => { setRevokeUser(u); setRevokeReason(''); }}
                              disabled={processing === u.id}
                            >
                              {processing === u.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <><ShieldOff className="h-3.5 w-3.5" />Révoquer</>}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() => handleInvite(u.id)}
                              disabled={processing === u.id}
                              title="Inviter à créer un Compte Optimisé IA"
                            >
                              {processing === u.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <><Send className="h-3.5 w-3.5" />Inviter</>}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={8} className="text-center text-text-muted py-10">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Composeur de campagne ── */}
      {campaignOpen && (
        <CampaignComposer
          selectedUsers={users.filter(u => selected.has(u.id))}
          totalUsers={users.length}
          onClose={() => setCampaignOpen(false)}
        />
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

// ─── Composeur de campagne email ─────────────────────────────────────────────

function CampaignComposer({
  selectedUsers,
  totalUsers,
  onClose,
}: {
  selectedUsers: UserProfile[];
  totalUsers: number;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CampaignForm>(
    selectedUsers.length > 0 ? EMPTY_CAMPAIGN : CAMPAIGN_TEMPLATES[0].form
  );
  const [target, setTarget] = useState<'selection' | 'all'>(selectedUsers.length > 0 ? 'selection' : 'all');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const recipientCount = target === 'all' ? totalUsers : selectedUsers.length;
  const set = (k: keyof CampaignForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handlePreview = async () => {
    setLoadingPreview(true); setError('');
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, preview: true, recipients: 'all' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setPreviewHtml(data.html);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = async () => {
    if (!form.subject.trim() || !form.title.trim() || !form.body.trim()) {
      setError('Objet, titre et contenu sont obligatoires.');
      return;
    }
    if (target === 'selection' && selectedUsers.length === 0) {
      setError('Aucun utilisateur sélectionné — coche des lignes dans la liste ou choisis "Tous".');
      return;
    }
    if (!confirm(`Envoyer cet email à ${recipientCount} utilisateur(s) ? Cette action est irréversible.`)) return;

    setSending(true); setError('');
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          recipients: target === 'all' ? 'all' : selectedUsers.map(u => u.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      toast.success(`Campagne envoyée : ${data.sent}/${data.total} emails délivrés${data.failed ? ` (${data.failed} échecs)` : ''}`);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={v => { if (!v && !sending) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-surface border-surface-light">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-black flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            Campagne email
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Email HTML aux couleurs AlgoPronos — personnalisé avec le prénom de chaque destinataire.
          </DialogDescription>
        </DialogHeader>

        {/* Modèles */}
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN_TEMPLATES.map(t => (
            <button
              key={t.name}
              type="button"
              onClick={() => { setForm(t.form); setPreviewHtml(null); }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-primary bg-surface-light hover:bg-primary/10 border border-white/5 hover:border-primary/30 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              {t.name}
            </button>
          ))}
        </div>

        {/* Destinataires */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTarget('selection')}
            disabled={selectedUsers.length === 0}
            className={`px-4 py-3 rounded-xl border text-sm font-bold transition-colors disabled:opacity-40 ${
              target === 'selection'
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-background border-surface-light text-text-muted hover:text-white'
            }`}
          >
            Sélection ({selectedUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setTarget('all')}
            className={`px-4 py-3 rounded-xl border text-sm font-bold transition-colors ${
              target === 'all'
                ? 'bg-warning/15 border-warning/40 text-warning'
                : 'bg-background border-surface-light text-text-muted hover:text-white'
            }`}
          >
            Tous les utilisateurs ({totalUsers})
          </button>
        </div>
        {target === 'all' && (
          <p className="text-[11px] text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
            ⚠️ L&apos;email partira à <strong>tous les utilisateurs inscrits</strong>. Une confirmation sera demandée avant l&apos;envoi.
          </p>
        )}

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Objet de l&apos;email *</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              placeholder="Ex : Débloquez votre Compte Optimisé IA"
              className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Titre (bandeau) *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ex : Votre IA de pronostics vous attend"
              className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
              Contenu * <span className="normal-case font-normal">(paragraphes séparés par une ligne vide · <code className="font-mono">![légende](url)</code> = image)</span>
            </label>
            <textarea
              value={form.body}
              onChange={e => set('body', e.target.value)}
              rows={8}
              placeholder={'Bonjour est ajouté automatiquement avec le prénom.\n\nRédigez vos paragraphes ici…'}
              className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm leading-relaxed resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Bouton (libellé)</label>
              <input
                type="text"
                value={form.ctaLabel}
                onChange={e => set('ctaLabel', e.target.value)}
                placeholder="Créer mon Compte Optimisé IA"
                className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Bouton (lien)</label>
              <input
                type="url"
                value={form.ctaUrl}
                onChange={e => set('ctaUrl', e.target.value)}
                placeholder={`${APP_URL}/compte-optimise-ia`}
                className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Aperçu */}
        {previewHtml && (
          <div className="rounded-xl overflow-hidden border border-surface-light">
            <iframe
              srcDoc={previewHtml}
              title="Aperçu de l'email"
              className="w-full h-[420px] bg-[#0f0f1a]"
              sandbox=""
            />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs font-bold bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={loadingPreview || sending}
            className="gap-2 border-surface-light"
          >
            {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Aperçu
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} disabled={sending} className="border-surface-light text-text-muted">
            Annuler
          </Button>
          <Button variant="gradient" onClick={handleSend} disabled={sending} className="gap-2 font-bold min-w-44">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Envoi en cours…' : `Envoyer à ${recipientCount} utilisateur(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
