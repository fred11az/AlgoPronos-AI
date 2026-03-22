import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trophy, XCircle, Clock, TrendingUp, Target, Percent } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient();

  // Fetch all tickets (no date limit for admin)
  const { data: tickets } = await supabase
    .from('daily_ticket')
    .select('id, date, status, total_odds, type, confidence_pct')
    .order('date', { ascending: false })
    .limit(200);

  // Fetch predictions_log stats
  const { data: predStats } = await supabase
    .from('predictions_log')
    .select('result, bookmaker_odds, value_edge, market')
    .order('created_at', { ascending: false })
    .limit(500);

  // ── Ticket Stats ───────────────────────────────────────────────────────────
  const rows = tickets || [];
  const won    = rows.filter(t => t.status === 'won');
  const lost   = rows.filter(t => t.status === 'lost');
  const voided = rows.filter(t => t.status === 'void');
  const pending = rows.filter(t => t.status === 'pending');
  const resolved = won.length + lost.length;
  const winRate = resolved > 0
    ? Math.round((won.length / resolved) * 1000) / 10
    : null;

  const wonOdds = won.map(t => Number(t.total_odds)).filter(o => o > 0);
  const avgWonOdds = wonOdds.length > 0
    ? (wonOdds.reduce((a, b) => a + b, 0) / wonOdds.length).toFixed(2)
    : '—';
  const bestOdds = wonOdds.length > 0 ? Math.max(...wonOdds).toFixed(2) : '—';

  // ── Predictions Log Stats ──────────────────────────────────────────────────
  const preds = predStats || [];
  const predResolved = preds.filter(p => p.result === 'WIN' || p.result === 'LOSS');
  const predWon      = predResolved.filter(p => p.result === 'WIN');
  const predPending  = preds.filter(p => p.result === 'PENDING');
  const predWinRate  = predResolved.length > 0
    ? Math.round((predWon.length / predResolved.length) * 1000) / 10
    : null;
  const avgEdge = preds.length > 0
    ? (preds.reduce((a, p) => a + Number(p.value_edge || 0), 0) / preds.length * 100).toFixed(1)
    : '—';

  // ── Recent tickets (last 30) ───────────────────────────────────────────────
  const recent = rows.slice(0, 30);

  function statusBadge(status: string) {
    switch (status) {
      case 'won':     return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'lost':    return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'void':    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  }
  function statusLabel(status: string) {
    switch (status) {
      case 'won':     return 'Gagné';
      case 'lost':    return 'Perdu';
      case 'void':    return 'Annulé';
      default:        return 'En cours';
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics & Performances</h1>
        <p className="text-text-secondary mt-1">Suivi des tickets IA et des prédictions Dixon-Coles</p>
      </div>

      {/* ── Ticket Stats Cards ── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Tickets IA du Jour
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-text-muted text-xs mb-1">Total générés</p>
              <p className="text-3xl font-bold text-white">{rows.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-green-400" />
                <p className="text-text-muted text-xs">Gagnés</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{won.length}</p>
              {winRate !== null && (
                <p className="text-xs text-green-400/70 mt-1">{winRate}% taux de réussite</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-400" />
                <p className="text-text-muted text-xs">Perdus</p>
              </div>
              <p className="text-3xl font-bold text-red-400">{lost.length}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-400" />
                <p className="text-text-muted text-xs">En attente</p>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{pending.length}</p>
              <p className="text-xs text-gray-400/70 mt-1">{voided.length} annulés</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="h-4 w-4 text-primary" />
                <p className="text-text-muted text-xs">Taux de réussite</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {winRate !== null ? `${winRate}%` : '—'}
              </p>
              <p className="text-xs text-text-muted mt-1">Sur {resolved} tickets résolus</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-text-muted text-xs mb-1">Cote moy. gagnante</p>
              <p className="text-3xl font-bold text-white">{avgWonOdds}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-text-muted text-xs mb-1">Meilleure cote gagnée</p>
              <p className="text-3xl font-bold text-primary">{bestOdds}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Predictions Log Stats ── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Prédictions Dixon-Coles (Value Bets)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-text-muted text-xs mb-1">Total loggées</p>
              <p className="text-3xl font-bold text-white">{preds.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-5">
              <p className="text-text-muted text-xs mb-1">WIN</p>
              <p className="text-3xl font-bold text-green-400">{predWon.length}</p>
              {predWinRate !== null && (
                <p className="text-xs text-green-400/70 mt-1">{predWinRate}% win rate</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-400" />
                <p className="text-text-muted text-xs">En attente</p>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{predPending.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-text-muted text-xs">Value edge moy.</p>
              </div>
              <p className="text-3xl font-bold text-white">{avgEdge}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Recent Tickets Table ── */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-white">30 derniers tickets</CardTitle>
            <CardDescription>Tous types confondus (classic, montante, optimus)</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">Aucun ticket trouvé</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted border-b border-surface-light">
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left py-2 pr-4">Type</th>
                      <th className="text-left py-2 pr-4">Statut</th>
                      <th className="text-right py-2 pr-4">Cote totale</th>
                      <th className="text-right py-2">Confiance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(t => (
                      <tr key={t.id} className="border-b border-surface-light/30 hover:bg-surface-light/20">
                        <td className="py-2 pr-4 text-white">{t.date}</td>
                        <td className="py-2 pr-4 text-text-muted capitalize">{t.type || 'classic'}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded text-xs border ${statusBadge(t.status)}`}>
                            {statusLabel(t.status)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right text-white font-mono">
                          {t.total_odds ? Number(t.total_odds).toFixed(2) : '—'}
                        </td>
                        <td className="py-2 text-right text-text-muted">
                          {t.confidence_pct ? `${t.confidence_pct}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
