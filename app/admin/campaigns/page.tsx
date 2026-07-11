'use client';

/**
 * /admin/campaigns — historique des campagnes email envoyées.
 * Chaque campagne est sauvegardée par /api/admin/campaigns avant l'envoi ;
 * elle reste donc consultable et renvoyable même en cas d'échec d'envoi.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Loader2, Send, Eye, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CampaignSummary {
  id: string;
  subject: string;
  title: string;
  target: 'all' | 'selection';
  total: number;
  sent: number;
  failed: number;
  first_error: string | null;
  created_at: string;
}

interface CampaignDetail extends CampaignSummary {
  body: string;
  cta_label: string | null;
  cta_url: string | null;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<CampaignDetail | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/campaigns');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de chargement');
      setCampaigns(data.campaigns || []);
    } catch {
      toast.error('Erreur de chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  }

  async function handleView(id: string) {
    setLoadingView(true);
    try {
      const res = await fetch(`/api/admin/campaigns?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setViewing(data.campaign);
    } catch (e: any) {
      toast.error(e.message || 'Impossible de charger cette campagne');
    } finally {
      setLoadingView(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            Historique des campagnes
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {campaigns.length} campagne(s) envoyée(s) — consultable et renvoyable
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <Mail className="h-4 w-4 mr-2" />
            Retour aux utilisateurs
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-text-muted">
            Aucune campagne envoyée pour l&apos;instant. Elles apparaîtront ici dès le premier envoi
            depuis <Link href="/admin/users" className="text-primary hover:underline">Gestion des utilisateurs</Link>.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-[11px] text-text-muted uppercase tracking-widest border-b border-surface-light bg-surface-light/30">
                    <th className="py-3 px-4 font-bold">Objet</th>
                    <th className="py-3 px-2 font-bold">Cible</th>
                    <th className="py-3 px-2 font-bold">Résultat</th>
                    <th className="py-3 px-2 font-bold whitespace-nowrap">Envoyée le</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-light/60">
                  {campaigns.map(c => {
                    const partial = c.sent > 0 && c.sent < c.total;
                    const failedAll = c.sent === 0 && c.total > 0;
                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white truncate max-w-[280px]">{c.subject}</p>
                          <p className="text-xs text-text-muted truncate max-w-[280px]">{c.title}</p>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {c.target === 'all' ? 'Tous' : 'Sélection'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            {failedAll ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Échec
                              </Badge>
                            ) : partial ? (
                              <Badge variant="warning">
                                {c.sent}/{c.total} envoyés
                              </Badge>
                            ) : (
                              <Badge variant="success">{c.sent}/{c.total} envoyés</Badge>
                            )}
                          </div>
                          {c.first_error && (
                            <p className="text-[10px] text-red-400 mt-1 truncate max-w-[220px]" title={c.first_error}>
                              {c.first_error}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-2 text-text-muted whitespace-nowrap">
                          {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-8 gap-1"
                              onClick={() => handleView(c.id)}
                              disabled={loadingView}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                              asChild
                            >
                              <Link href={`/admin/users?resend=${c.id}`}>
                                <Send className="h-3.5 w-3.5" />
                                Renvoyer
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aperçu du contenu */}
      <Dialog open={!!viewing} onOpenChange={open => { if (!open) setViewing(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-surface border-surface-light">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{viewing.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Titre (bandeau)</p>
                  <p className="text-white">{viewing.title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Contenu</p>
                  <div className="bg-background rounded-xl border border-surface-light p-4 text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {viewing.body}
                  </div>
                </div>
                {viewing.cta_label && (
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Bouton</p>
                    <p className="text-sm text-text-secondary">{viewing.cta_label} → <span className="font-mono text-primary">{viewing.cta_url}</span></p>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={() => setViewing(null)} className="border-surface-light">
                    Fermer
                  </Button>
                  <Button variant="gradient" className="gap-2" asChild>
                    <Link href={`/admin/users?resend=${viewing.id}`}>
                      <Send className="h-4 w-4" />
                      Renvoyer cette campagne
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
