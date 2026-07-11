'use client';

/**
 * Analytics acquisition hebdomadaire (Chantier 3).
 * Table de saisie (1 ligne/semaine) + indicateurs dérivés + graphiques + résumé IA.
 * Couleurs séries validées CVD sur fond sombre (scripts/validate_palette.js du
 * skill dataviz) : Facebook #8b5cf6 / Terrain #0891b2 · Revenus #16a34a / Coûts #d97706.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2, Sparkles, TrendingUp, Users, Wallet, Percent } from 'lucide-react';

// ─── Couleurs séries (validées) ───────────────────────────────────────────────

const COLOR_FB = '#8b5cf6';      // Facebook Ads
const COLOR_FIELD = '#0891b2';   // Prospection terrain
const COLOR_REVENUE = '#16a34a'; // Revenus d'affiliation
const COLOR_COST = '#d97706';    // Coûts investis

const GRID = '#ffffff10';
const AXIS = '#ffffff40';
const TOOLTIP_STYLE = {
  backgroundColor: '#1a1a2e',
  border: '1px solid #ffffff10',
  borderRadius: '12px',
  color: '#e2e8f0',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekRow {
  id?: string;
  week_start: string;
  ad_budget_fcfa: number;
  fb_signups: number;
  field_signups: number;
  ambassador_salary_fcfa: number;
  new_contacts: number;
  total_signups: number;
  onexbet_accounts: number;
  first_deposits: number;
  active_players: number;
  affiliate_revenue_fcfa: number;
  ai_summary?: string | null;
  _dirty?: boolean;
}

const EMPTY_FIELDS = {
  ad_budget_fcfa: 0, fb_signups: 0, field_signups: 0, ambassador_salary_fcfa: 0,
  new_contacts: 0, total_signups: 0, onexbet_accounts: 0, first_deposits: 0,
  active_players: 0, affiliate_revenue_fcfa: 0,
};

// Colonnes de saisie: [clé, libellé court]
const INPUT_COLUMNS: [keyof typeof EMPTY_FIELDS, string][] = [
  ['ad_budget_fcfa', 'Budget pub (FCFA)'],
  ['fb_signups', 'Inscrits FB'],
  ['field_signups', 'Inscrits terrain'],
  ['ambassador_salary_fcfa', 'Salaires ambass. (FCFA)'],
  ['new_contacts', 'Nouveaux contacts'],
  ['total_signups', 'Inscriptions totales'],
  ['onexbet_accounts', 'Comptes 1xBet'],
  ['first_deposits', 'Premiers dépôts'],
  ['active_players', 'Joueurs actifs'],
  ['affiliate_revenue_fcfa', 'Revenus affil. (FCFA)'],
];

// ─── Calculs dérivés ──────────────────────────────────────────────────────────

interface Derived {
  costPerFb: number | null;
  costPerField: number | null;
  convSignupTo1x: number | null;   // %
  conv1xToDeposit: number | null;  // %
  roiFb: number | null;            // %
  roiField: number | null;         // %
}

function derive(w: WeekRow): Derived {
  const budget = Number(w.ad_budget_fcfa);
  const salary = Number(w.ambassador_salary_fcfa);
  const revenue = Number(w.affiliate_revenue_fcfa);
  const channelSignups = w.fb_signups + w.field_signups;

  // Revenus attribués à chaque canal au prorata des inscrits du canal
  const revFb = channelSignups > 0 ? revenue * (w.fb_signups / channelSignups) : 0;
  const revField = channelSignups > 0 ? revenue * (w.field_signups / channelSignups) : 0;

  return {
    costPerFb: w.fb_signups > 0 ? Math.round(budget / w.fb_signups) : null,
    costPerField: w.field_signups > 0 ? Math.round(salary / w.field_signups) : null,
    convSignupTo1x: w.total_signups > 0 ? Math.round((w.onexbet_accounts / w.total_signups) * 100) : null,
    conv1xToDeposit: w.onexbet_accounts > 0 ? Math.round((w.first_deposits / w.onexbet_accounts) * 100) : null,
    roiFb: budget > 0 ? Math.round(((revFb - budget) / budget) * 100) : null,
    roiField: salary > 0 ? Math.round(((revField - salary) / salary) * 100) : null,
  };
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} F`;
const pct = (n: number | null) => (n === null ? '—' : `${n}%`);
const weekLabel = (d: string) => {
  const date = new Date(d + 'T12:00:00Z');
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

function nextMonday(after?: string): string {
  const base = after ? new Date(after + 'T12:00:00Z') : new Date();
  if (after) {
    base.setDate(base.getDate() + 7);
  } else {
    // Lundi de la semaine courante
    const day = base.getDay();
    base.setDate(base.getDate() - ((day + 6) % 7));
  }
  return base.toISOString().split('T')[0];
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AcquisitionClient() {
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/weekly');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWeeks(data.weeks ?? []);
    } catch {
      setError('Impossible de charger les métriques (la table weekly_metrics existe-t-elle ?)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateField = (weekStart: string, field: keyof typeof EMPTY_FIELDS, value: string) => {
    setWeeks(prev => prev.map(w =>
      w.week_start === weekStart ? { ...w, [field]: Number(value) || 0, _dirty: true } : w
    ));
  };

  const addWeek = () => {
    const last = weeks.length > 0 ? weeks[weeks.length - 1].week_start : undefined;
    const ws = nextMonday(last);
    if (weeks.some(w => w.week_start === ws)) return;
    setWeeks(prev => [...prev, { week_start: ws, ...EMPTY_FIELDS, _dirty: true }]);
  };

  const saveWeek = async (w: WeekRow) => {
    setSavingKey(w.week_start);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(w),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { week } = await res.json();
      setWeeks(prev => prev.map(x => x.week_start === w.week_start ? { ...week, _dirty: false } : x));
    } catch {
      setError(`Échec de l'enregistrement de la semaine du ${w.week_start}`);
    } finally {
      setSavingKey(null);
    }
  };

  const deleteWeek = async (w: WeekRow) => {
    if (!w.id) {
      setWeeks(prev => prev.filter(x => x.week_start !== w.week_start));
      return;
    }
    if (!confirm(`Supprimer la semaine du ${w.week_start} ?`)) return;
    const res = await fetch(`/api/admin/analytics/weekly?id=${w.id}`, { method: 'DELETE' });
    if (res.ok) setWeeks(prev => prev.filter(x => x.id !== w.id));
  };

  const generateSummary = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics/weekly/summary', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setWeeks(prev => prev.map(w =>
        w.week_start === data.week_start ? { ...w, ai_summary: data.summary } : w
      ));
    } catch (e: any) {
      setError(e.message || 'Échec de la génération du résumé IA');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Agrégats cumulés ────────────────────────────────────────────────────────
  const totals = weeks.reduce((acc, w) => ({
    budget: acc.budget + Number(w.ad_budget_fcfa),
    salary: acc.salary + Number(w.ambassador_salary_fcfa),
    fb: acc.fb + w.fb_signups,
    field: acc.field + w.field_signups,
    signups: acc.signups + w.total_signups,
    onexbet: acc.onexbet + w.onexbet_accounts,
    deposits: acc.deposits + w.first_deposits,
    revenue: acc.revenue + Number(w.affiliate_revenue_fcfa),
  }), { budget: 0, salary: 0, fb: 0, field: 0, signups: 0, onexbet: 0, deposits: 0, revenue: 0 });

  const cumCostPerFb = totals.fb > 0 ? Math.round(totals.budget / totals.fb) : null;
  const cumCostPerField = totals.field > 0 ? Math.round(totals.salary / totals.field) : null;
  const cumConv1x = totals.signups > 0 ? Math.round((totals.onexbet / totals.signups) * 100) : null;
  const cumConvDep = totals.onexbet > 0 ? Math.round((totals.deposits / totals.onexbet) * 100) : null;
  const totalCost = totals.budget + totals.salary;
  const globalRoi = totalCost > 0 ? Math.round(((totals.revenue - totalCost) / totalCost) * 100) : null;

  // ── Données graphiques ──────────────────────────────────────────────────────
  const signupsData = weeks.map(w => ({
    week: weekLabel(w.week_start),
    Facebook: w.fb_signups,
    Terrain: w.field_signups,
  }));

  const costData = weeks.map(w => {
    const d = derive(w);
    return {
      week: weekLabel(w.week_start),
      Facebook: d.costPerFb ?? 0,
      Terrain: d.costPerField ?? 0,
    };
  });

  let cumRevenue = 0, cumCost = 0;
  const breakEvenData = weeks.map(w => {
    cumRevenue += Number(w.affiliate_revenue_fcfa);
    cumCost += Number(w.ad_budget_fcfa) + Number(w.ambassador_salary_fcfa);
    return { week: weekLabel(w.week_start), 'Revenus cumulés': cumRevenue, 'Coûts cumulés': cumCost };
  });

  const latestSummary = [...weeks].reverse().find(w => w.ai_summary)?.ai_summary ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Indicateurs cumulés ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile icon={Users} label="Inscrits FB / Terrain" value={`${totals.fb} / ${totals.field}`} />
        <StatTile
          icon={Wallet}
          label="Coût par inscrit"
          value={`${cumCostPerFb !== null ? fcfa(cumCostPerFb) : '—'} FB · ${cumCostPerField !== null ? fcfa(cumCostPerField) : '—'} Terrain`}
        />
        <StatTile icon={Percent} label="Inscrit → 1xBet" value={pct(cumConv1x)} />
        <StatTile icon={Percent} label="1xBet → Dépôt" value={pct(cumConvDep)} />
        <StatTile
          icon={TrendingUp}
          label="ROI global"
          value={globalRoi === null ? '—' : `${globalRoi > 0 ? '+' : ''}${globalRoi}%`}
          accent={globalRoi !== null ? (globalRoi >= 0 ? 'text-green-400' : 'text-red-400') : undefined}
        />
      </div>

      {/* ── Résumé IA ── */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-white">Résumé IA de la semaine</CardTitle>
            <CardDescription>Analyse comparée des canaux + recommandation d&apos;arbitrage</CardDescription>
          </div>
          <Button size="sm" variant="gradient" onClick={generateSummary} disabled={aiLoading || weeks.length === 0}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Générer
          </Button>
        </CardHeader>
        <CardContent>
          {latestSummary ? (
            <p className="text-text-secondary text-sm leading-relaxed">{latestSummary}</p>
          ) : (
            <p className="text-text-muted text-sm">
              Aucun résumé généré. Saisissez au moins une semaine puis cliquez sur « Générer ».
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Table de saisie ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-white">Saisie hebdomadaire</CardTitle>
            <CardDescription>Une ligne par semaine — modifiez puis enregistrez la ligne</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addWeek}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une semaine
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="text-left text-text-muted border-b border-surface-light">
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">Semaine du</th>
                  {INPUT_COLUMNS.map(([key, label]) => (
                    <th key={key} className="py-2 px-2 font-medium whitespace-nowrap">{label}</th>
                  ))}
                  <th className="py-2 pl-2" />
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr key={w.week_start} className="border-b border-surface-light/50">
                    <td className="py-2 pr-3 text-white whitespace-nowrap font-medium">{w.week_start}</td>
                    {INPUT_COLUMNS.map(([key]) => (
                      <td key={key} className="py-2 px-1">
                        <input
                          type="number"
                          min={0}
                          value={w[key] ?? 0}
                          onChange={(e) => updateField(w.week_start, key, e.target.value)}
                          className="w-24 bg-surface-light/50 border border-surface-light rounded-lg px-2 py-1.5 text-white text-right focus:outline-none focus:border-primary/50"
                        />
                      </td>
                    ))}
                    <td className="py-2 pl-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={w._dirty ? 'gradient' : 'ghost'}
                          onClick={() => saveWeek(w)}
                          disabled={savingKey === w.week_start}
                          title="Enregistrer"
                        >
                          {savingKey === w.week_start
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteWeek(w)} title="Supprimer">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {weeks.length === 0 && (
                  <tr>
                    <td colSpan={INPUT_COLUMNS.length + 2} className="py-8 text-center text-text-muted">
                      Aucune semaine. Cliquez sur « Ajouter une semaine » pour commencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Indicateurs dérivés par semaine ── */}
      {weeks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Indicateurs dérivés</CardTitle>
            <CardDescription>Calculés automatiquement à partir de la saisie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="text-left text-text-muted border-b border-surface-light">
                    <th className="py-2 pr-3 font-medium">Semaine du</th>
                    <th className="py-2 px-2 font-medium">Coût/inscrit FB</th>
                    <th className="py-2 px-2 font-medium">Coût/inscrit Terrain</th>
                    <th className="py-2 px-2 font-medium">Inscrit → 1xBet</th>
                    <th className="py-2 px-2 font-medium">1xBet → Dépôt</th>
                    <th className="py-2 px-2 font-medium">ROI Facebook</th>
                    <th className="py-2 px-2 font-medium">ROI Terrain</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w) => {
                    const d = derive(w);
                    return (
                      <tr key={w.week_start} className="border-b border-surface-light/50 text-text-secondary">
                        <td className="py-2 pr-3 text-white font-medium">{w.week_start}</td>
                        <td className="py-2 px-2">{d.costPerFb !== null ? fcfa(d.costPerFb) : '—'}</td>
                        <td className="py-2 px-2">{d.costPerField !== null ? fcfa(d.costPerField) : '—'}</td>
                        <td className="py-2 px-2">{pct(d.convSignupTo1x)}</td>
                        <td className="py-2 px-2">{pct(d.conv1xToDeposit)}</td>
                        <td className={`py-2 px-2 ${d.roiFb !== null ? (d.roiFb >= 0 ? 'text-green-400' : 'text-red-400') : ''}`}>{pct(d.roiFb)}</td>
                        <td className={`py-2 px-2 ${d.roiField !== null ? (d.roiField >= 0 ? 'text-green-400' : 'text-red-400') : ''}`}>{pct(d.roiField)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-muted mt-3">
              ROI par canal = (revenus d&apos;affiliation attribués au prorata des inscrits du canal − coûts du canal) / coûts du canal.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Graphiques ── */}
      {weeks.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-white text-base">Inscrits par canal</CardTitle>
              <CardDescription>Évolution semaine par semaine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signupsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="week" stroke={AXIS} fontSize={12} />
                    <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Facebook" stroke={COLOR_FB} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Terrain" stroke={COLOR_FIELD} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white text-base">Coût par inscrit (FCFA)</CardTitle>
              <CardDescription>Facebook Ads vs prospection terrain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="week" stroke={AXIS} fontSize={12} />
                    <YAxis stroke={AXIS} fontSize={12} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fcfa(v)} cursor={{ fill: '#ffffff08' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Facebook" fill={COLOR_FB} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Terrain" fill={COLOR_FIELD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white text-base">Revenus vs budget investi (cumulés, FCFA)</CardTitle>
              <CardDescription>
                Le croisement des deux courbes marque le point de rentabilité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={breakEvenData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="week" stroke={AXIS} fontSize={12} />
                    <YAxis stroke={AXIS} fontSize={12} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fcfa(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Revenus cumulés" stroke={COLOR_REVENUE} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Coûts cumulés" stroke={COLOR_COST} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Tuile de stat ────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-primary" />
          <p className="text-text-muted text-xs">{label}</p>
        </div>
        <p className={`text-lg font-bold ${accent ?? 'text-white'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
