/**
 * POST /api/admin/articles/ai-analysis — génère l'encadré "Analyse IA AlgoPronos"
 * d'un article résultat de match (admin uniquement).
 *
 * Croise le score saisi avec le pronostic stocké dans match_predictions (si
 * trouvé) pour expliquer pourquoi le modèle favorisait — ou non — une équipe,
 * chiffres à l'appui. Le texte reste éditable dans l'éditeur avant publication.
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { normalizeTeamName } from '@/lib/services/ticket-resolution';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface MatchInfo {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  league?: string;
  match_date?: string; // YYYY-MM-DD
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await checkIsAdmin(user.id))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as MatchInfo | null;
  if (!body?.home_team?.trim() || !body?.away_team?.trim()) {
    return NextResponse.json({ error: 'Équipes domicile et extérieur requises' }, { status: 400 });
  }
  const hasScore = Number.isFinite(Number(body.home_score)) && Number.isFinite(Number(body.away_score));

  // Retrouve le pronostic AlgoPronos du match (par noms d'équipes normalisés)
  const supabase = createAdminClient();
  let prediction: Record<string, unknown> | null = null;
  try {
    let query = supabase
      .from('match_predictions')
      .select('home_team, away_team, prediction, probability, implied_probability, value_edge, recommended_odds, odds_home, odds_draw, odds_away, home_form, away_form, match_date')
      .order('match_date', { ascending: false })
      .limit(50);
    if (body.match_date) query = query.eq('match_date', body.match_date);
    const { data } = await query;

    const targetH = normalizeTeamName(body.home_team);
    const targetA = normalizeTeamName(body.away_team);
    prediction = (data ?? []).find((p: any) =>
      normalizeTeamName(p.home_team) === targetH && normalizeTeamName(p.away_team) === targetA
    ) ?? null;
  } catch {
    // Pas bloquant — l'analyse sera générée sans données de pronostic
  }

  const predContext = prediction
    ? `PRONOSTIC ALGOPRONOS AVANT MATCH (données réelles du modèle):
- Pronostic: ${prediction.prediction}
- Probabilité modèle: ${prediction.probability}%
- Probabilité implicite bookmaker: ${prediction.implied_probability}%
- Value edge: ${prediction.value_edge}%
- Cote recommandée: ${prediction.recommended_odds}
- Cotes 1X2: ${prediction.odds_home} / ${prediction.odds_draw} / ${prediction.odds_away}
- Forme domicile: ${prediction.home_form} | Forme extérieur: ${prediction.away_form}`
    : `AUCUN PRONOSTIC STOCKÉ pour ce match — rédige une analyse plausible du point de vue d'un modèle
(forme, contexte, logique des cotes) SANS inventer de chiffres précis de probabilité ou de cote.`;

  const system = `Tu rédiges l'encadré "Analyse IA AlgoPronos" affiché à la fin des articles du site AlgoPronos (pronostics sportifs IA, Afrique de l'Ouest francophone).
Objectif: montrer la valeur du modèle Neural v4.2 (forme, xG, cotes, value betting, probabilités, risque) de façon crédible.
Règles:
- Français, 3 à 5 phrases, ton analyste factuel — jamais vantard ni alarmiste.
- Si le pronostic du modèle était correct: explique pourquoi (chiffres fournis à l'appui).
- Si le modèle s'est trompé: dis-le honnêtement et explique ce qui a surpris le modèle. La transparence crédibilise la plateforme.
- N'invente JAMAIS de chiffres (probabilités, cotes) absents des données fournies.
- Pas de titre, pas de liste — un paragraphe fluide.`;

  const userMsg = `MATCH: ${body.home_team} vs ${body.away_team}${body.league ? ` (${body.league})` : ''}${body.match_date ? ` — ${body.match_date}` : ''}
${hasScore ? `SCORE FINAL: ${body.home_team} ${body.home_score} - ${body.away_score} ${body.away_team}` : 'SCORE FINAL: non renseigné (match à venir — analyse en avant-match)'}

${predContext}

Rédige l'encadré "Analyse IA AlgoPronos".`;

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
    const analysis = text && text.type === 'text' ? text.text.trim() : '';
    if (!analysis) return NextResponse.json({ error: 'Réponse vide' }, { status: 502 });

    return NextResponse.json({ analysis, predictionFound: !!prediction });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`[articles/ai-analysis] Claude API error ${err.status}:`, err.message);
      return NextResponse.json({ error: `Erreur API Claude (${err.status})` }, { status: 502 });
    }
    console.error('[articles/ai-analysis] failed:', err);
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 });
  }
}
