/**
 * POST /api/admin/analytics/weekly/summary — Résumé IA hebdomadaire (bonus Chantier 3).
 * Compare la dernière semaine saisie aux précédentes (coût par inscrit par canal,
 * conversions, ROI) et génère une recommandation en français via l'API Claude.
 * Le résumé est stocké dans weekly_metrics.ai_summary de la semaine concernée.
 */
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface WeekRow {
  id: string;
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
}

function fmtWeek(w: WeekRow): string {
  const cpFb = w.fb_signups > 0 ? Math.round(Number(w.ad_budget_fcfa) / w.fb_signups) : null;
  const cpField = w.field_signups > 0 ? Math.round(Number(w.ambassador_salary_fcfa) / w.field_signups) : null;
  const conv1x = w.total_signups > 0 ? Math.round((w.onexbet_accounts / w.total_signups) * 100) : null;
  const convDep = w.onexbet_accounts > 0 ? Math.round((w.first_deposits / w.onexbet_accounts) * 100) : null;
  return `Semaine du ${w.week_start}: budget pub ${w.ad_budget_fcfa} FCFA | inscrits FB: ${w.fb_signups} | inscrits terrain: ${w.field_signups} | salaires ambassadeurs: ${w.ambassador_salary_fcfa} FCFA | contacts: ${w.new_contacts} | inscriptions totales: ${w.total_signups} | comptes 1xBet: ${w.onexbet_accounts} | premiers dépôts: ${w.first_deposits} | joueurs actifs: ${w.active_players} | revenus affiliation: ${w.affiliate_revenue_fcfa} FCFA | coût/inscrit FB: ${cpFb ?? 'n/a'} FCFA | coût/inscrit terrain: ${cpField ?? 'n/a'} FCFA | conversion inscrit→1xBet: ${conv1x ?? 'n/a'}% | conversion 1xBet→dépôt: ${convDep ?? 'n/a'}%`;
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await checkIsAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non configurée — résumé IA indisponible' },
      { status: 503 },
    );
  }

  const supabase = createAdminClient();
  const { data: weeks, error } = await supabase
    .from('weekly_metrics')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!weeks || weeks.length === 0) {
    return NextResponse.json({ error: 'Aucune semaine saisie' }, { status: 400 });
  }

  const [latest, ...previous] = weeks as WeekRow[];

  const system = `Tu es l'analyste growth d'AlgoPronos AI (pronostics sportifs IA, Afrique de l'Ouest francophone, monétisation par affiliation bookmaker).
Rédige un résumé hebdomadaire en français pour le fondateur: 3 à 5 phrases, factuel, chiffré, orienté décision.
Compare les canaux Facebook Ads vs prospection terrain (coût par inscrit, conversions 1xBet et premiers dépôts, ROI) et termine par UNE recommandation claire d'arbitrage budgétaire.
Exemple de style attendu: "Cette semaine, le canal terrain a un coût par inscrit 30% inférieur à Facebook mais un taux de conversion 1xBet plus faible — recommandation : maintenir le budget Facebook mais renforcer le suivi terrain."
Pas de titre, pas de liste à puces, pas d'invention de chiffres absents.`;

  const userMsg = `SEMAINE À ANALYSER:
${fmtWeek(latest)}

SEMAINES PRÉCÉDENTES (contexte, de la plus récente à la plus ancienne):
${previous.length > 0 ? previous.map(fmtWeek).join('\n') : '(aucune — première semaine saisie)'}

Rédige le résumé hebdomadaire.`;

  try {
    const client = new Anthropic({ timeout: 45_000 });
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'Génération refusée' }, { status: 502 });
    }
    const text = response.content.find((b) => b.type === 'text');
    const summary = text && text.type === 'text' ? text.text.trim() : '';
    if (!summary) return NextResponse.json({ error: 'Réponse vide' }, { status: 502 });

    await supabase
      .from('weekly_metrics')
      .update({ ai_summary: summary, updated_at: new Date().toISOString() })
      .eq('id', latest.id);

    return NextResponse.json({ summary, week_start: latest.week_start });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`[weekly-summary] Claude API error ${err.status}:`, err.message);
      return NextResponse.json({ error: `Erreur API Claude (${err.status})` }, { status: 502 });
    }
    console.error('[weekly-summary] failed:', err);
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 });
  }
}
