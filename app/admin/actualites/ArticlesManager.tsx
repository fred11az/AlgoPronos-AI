'use client';

import { useState, useTransition } from 'react';
import {
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticleStatus,
  type ArticlePayload,
} from './actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Newspaper,
  ExternalLink,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Présentation', 'Groupes', 'Analyse IA', 'Résultats',
  'Infos pratiques', 'Afrique', 'Stratégie', 'Actualités', 'Autre',
];

const EMPTY_FORM: ArticlePayload = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  category: 'Actualités',
  tags: [],
  author: 'AlgoPronos AI',
  status: 'draft',
  cover_image: '',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  published: 'text-green-400 bg-green-400/10 border-green-400/20',
  draft:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  archived:  'text-text-muted bg-surface-light border-white/10',
};

const STATUS_LABELS: Record<string, string> = {
  published: 'Publié', draft: 'Brouillon', archived: 'Archivé',
};

// ─── Editor dialog ───────────────────────────────────────────────────────────

interface EditorProps {
  open: boolean;
  onClose: () => void;
  initial?: Article | null;
  onSaved: (article: Article) => void;
}

function ArticleEditor({ open, onClose, initial, onSaved }: EditorProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ArticlePayload>(
    initial
      ? {
          title: initial.title,
          slug: initial.slug,
          summary: initial.summary ?? '',
          content: '',            // loaded separately if needed
          category: initial.category,
          tags: initial.tags ?? [],
          author: initial.author,
          status: initial.status === 'archived' ? 'draft' : initial.status,
          cover_image: '',
        }
      : EMPTY_FORM
  );
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [preview, setPreview] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState('');

  // Reset when dialog opens with new initial
  const reset = () => {
    setForm(initial
      ? { title: initial.title, slug: initial.slug, summary: initial.summary ?? '',
          content: '', category: initial.category, tags: initial.tags ?? [],
          author: initial.author, status: initial.status === 'archived' ? 'draft' : initial.status,
          cover_image: '' }
      : EMPTY_FORM);
    setTagsInput((initial?.tags ?? []).join(', '));
    setError('');
    setPreview(false);
  };

  const set = (k: keyof ArticlePayload, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTitleChange = (title: string) => {
    set('title', title);
    if (!isEdit) set('slug', slugify(title));
  };

  const handleTagsChange = (raw: string) => {
    setTagsInput(raw);
    set('tags', raw.split(',').map((t) => t.trim()).filter(Boolean));
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!form.slug.trim())  { setError('Le slug est obligatoire.'); return; }
    setError('');

    startSaving(async () => {
      try {
        let saved: Article;
        if (isEdit) {
          saved = await updateArticle(initial!.id, form) as Article;
        } else {
          saved = await createArticle(form) as Article;
        }
        onSaved(saved);
        onClose();
      } catch (e: any) {
        setError(e.message ?? 'Une erreur est survenue.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-surface border-surface-light">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-black flex items-center gap-3">
            <Newspaper className="h-5 w-5 text-primary" />
            {isEdit ? 'Modifier l\'article' : 'Nouvel article'}
          </DialogTitle>
        </DialogHeader>

        {/* ── Tabs preview / edit ── */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPreview(false)}
            className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition-colors ${!preview ? 'bg-primary text-white' : 'text-text-muted hover:text-white bg-surface-light'}`}
          >
            Éditeur
          </button>
          <button
            onClick={() => setPreview(true)}
            className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition-colors ${preview ? 'bg-primary text-white' : 'text-text-muted hover:text-white bg-surface-light'}`}
          >
            Aperçu
          </button>
        </div>

        {preview ? (
          /* ── PREVIEW ── */
          <div className="bg-background rounded-xl p-6 border border-surface-light min-h-64">
            <div className="mb-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                form.status === 'published'
                  ? 'text-green-400 bg-green-400/10 border-green-400/20'
                  : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
              }`}>
                {form.category}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mb-3">{form.title || '(sans titre)'}</h1>
            <p className="text-text-secondary text-base italic mb-4">{form.summary}</p>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed">
                {form.content || '(contenu vide)'}
              </pre>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {form.tags.map((t) => (
                  <span key={t} className="text-[10px] text-text-muted bg-surface-light px-2 py-0.5 rounded border border-white/5">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── FORM ── */
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                Titre *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex : Résultats Groupe A — Journée 1"
                className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-base font-semibold"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                Slug (URL) *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted bg-surface-light px-3 py-3 rounded-l-xl border border-r-0 border-surface-light shrink-0">
                  /actualites/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/\s/g, '-'))}
                  className="flex-1 bg-background border border-surface-light rounded-r-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm font-mono"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                Résumé (affiché dans la liste)
              </label>
              <textarea
                value={form.summary}
                onChange={(e) => set('summary', e.target.value)}
                rows={2}
                placeholder="1-2 phrases d'accroche…"
                className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm resize-y"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                Contenu (texte brut, paragraphes séparés par une ligne vide)
              </label>
              <textarea
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                rows={12}
                placeholder="Rédigez l'article ici…&#10;&#10;Séparez les paragraphes par une ligne vide."
                className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm font-mono resize-y leading-relaxed"
              />
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                  Statut
                </label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as 'draft' | 'published')}
                  className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 text-sm"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                </select>
              </div>
            </div>

            {/* Tags + Author */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="Groupe A, Résultats, France…"
                  className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
                  Auteur
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => set('author', e.target.value)}
                  className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs font-bold bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <DialogFooter className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => { reset(); onClose(); }}
            className="border-surface-light text-text-muted hover:text-white"
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            variant="gradient"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 min-w-36"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Enregistrer' : form.status === 'published' ? 'Publier l\'article' : 'Enregistrer en brouillon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirm({ article, onClose, onDeleted }: {
  article: Article;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, startDeleting] = useTransition();
  const [error, setError] = useState('');

  const handleDelete = () => {
    startDeleting(async () => {
      try {
        await deleteArticle(article.id);
        onDeleted(article.id);
        onClose();
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md bg-surface border-surface-light">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            Supprimer l'article ?
          </DialogTitle>
        </DialogHeader>
        <p className="text-text-secondary text-sm">
          Voulez-vous vraiment supprimer{' '}
          <strong className="text-white">&ldquo;{article.title}&rdquo;</strong> ?
          Cette action est irréversible.
        </p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting} className="border-surface-light">
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600 text-white gap-2"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Manager Component ───────────────────────────────────────────────────

interface Props {
  initialArticles: Article[];
}

export default function ArticlesManager({ initialArticles }: Props) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [toDelete, setToDelete] = useState<Article | null>(null);
  const [toggling, startToggling] = useTransition();

  const openNew  = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (a: Article) => { setEditing(a); setEditorOpen(true); };

  const handleSaved = (saved: Article) => {
    setArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
  };

  const handleDeleted = (id: string) =>
    setArticles((prev) => prev.filter((a) => a.id !== id));

  const handleToggle = (article: Article) => {
    startToggling(async () => {
      const updated = await toggleArticleStatus(article.id, article.status) as Article;
      setArticles((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    });
  };

  const published  = articles.filter((a) => a.status === 'published').length;
  const drafts     = articles.filter((a) => a.status === 'draft').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Newspaper className="h-6 w-6 text-primary" />
            Actualités
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Gérez les articles publiés sur{' '}
            <a href="/actualites" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
              /actualites <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
        <Button variant="gradient" onClick={openNew} className="gap-2 font-bold">
          <PlusCircle className="h-4 w-4" />
          Nouvel article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total', value: articles.length, icon: FileText, color: 'text-white' },
          { label: 'Publiés', value: published, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Brouillons', value: drafts, icon: Clock, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-surface-light p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-text-muted font-bold uppercase">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-surface-light p-16 text-center">
          <Newspaper className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted font-bold">Aucun article pour l'instant.</p>
          <Button variant="gradient" onClick={openNew} className="mt-6 gap-2">
            <PlusCircle className="h-4 w-4" />
            Créer le premier article
          </Button>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden shadow-lg">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-surface-light/50 border-b border-surface-light text-[10px] font-black text-text-muted uppercase tracking-widest">
            <span>Article</span>
            <span className="text-center">Statut</span>
            <span className="text-center hidden md:block">Date</span>
            <span className="text-center">Actions</span>
          </div>

          <div className="divide-y divide-surface-light">
            {articles.map((article) => (
              <div
                key={article.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
              >
                {/* Title + meta */}
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm leading-snug truncate">
                    {article.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      STATUS_STYLES[article.category] || 'text-primary bg-primary/10 border-primary/20'
                    } text-primary bg-primary/10 border-primary/20`}>
                      {article.category}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono truncate">
                      /{article.slug}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex justify-center">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${STATUS_STYLES[article.status]}`}>
                    {STATUS_LABELS[article.status]}
                  </span>
                </div>

                {/* Date */}
                <div className="text-[10px] text-text-muted text-center hidden md:block whitespace-nowrap">
                  {formatDate(article.created_at)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Toggle publish */}
                  <button
                    onClick={() => handleToggle(article)}
                    disabled={toggling}
                    title={article.status === 'published' ? 'Dépublier' : 'Publier'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      article.status === 'published'
                        ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                        : 'text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10'
                    }`}
                  >
                    {article.status === 'published'
                      ? <Eye className="h-4 w-4" />
                      : <EyeOff className="h-4 w-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(article)}
                    title="Modifier"
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  {/* Preview in new tab (published only) */}
                  {article.status === 'published' && (
                    <a
                      href={`/actualites/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Voir sur le site"
                      className="p-1.5 rounded-lg text-text-muted hover:text-secondary hover:bg-secondary/10 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => setToDelete(article)}
                    title="Supprimer"
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      {editorOpen && (
        <ArticleEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          initial={editing}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {toDelete && (
        <DeleteConfirm
          article={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
