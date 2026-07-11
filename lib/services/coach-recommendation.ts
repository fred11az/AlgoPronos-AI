/**
 * Assistant de pari IA — "Recommandation du jour" (Chantier 2)
 *
 * Génère un court message de coach basé sur les value bets du jour
 * (match_predictions) et la cohorte de risque de l'utilisateur, via
 * l'API Claude. Ton attendu : coach factuel et rassurant, jamais alarmiste.
 *
 * Stratégie de cache (voir docs/COACH_CACHE_STRATEGY.md) :
 * 1 génération par jour et par cohorte de risque (safe/balanced/risky),
 * stockée dans la table api_cache — au maximum 3 appels Claude par jour,
 * quel que soit le nombre d'utilisateurs.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskCohort = 'safe' | 'balanced' | 'risky';

export type CoachScenario = 'no_value_bet' | 'few_value_bets' | 'several_value_bets';

export interface CoachHighlight {
  match: string;
  league: string;
  pick: string;
  odds: number;
  modelPct: number | null;
  valueEdge: number | null;
  confidencePct: number;
}

export interface CoachRecommendation {
  date: string;
  cohort: RiskCohort;
  scenario: CoachScenario;
  /** Message principal du coach (généré par Claude). */
  message: string;
  /** Conseil complémentaire — ex: avertissement cote trop faible. */
  advice: string | null;
  /** Matchs mis en avant (données factuelles, calculées côté serveur). */
  highlights: CoachHighlight[];
  /** Confiance globale 0-100 (déterministe, pas générée par l'IA). */
  confidencePct: number | null;
  generatedBy: 'claude' | 'fallback';
}

interface PredictionRow {
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  match_time: string | null;
  prediction: string | null;
  probability: number | null;
  implied_probability: number | null;
  value_edge: number | null;
  recommended_odds: number | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const VALUE_EDGE_MIN = 3;   // % d'écart modèle vs bookmaker pour parler de "value bet"
const PROBABILITY_MIN = 55; // % de probabilité modèle minimale
const LOW_ODDS_MAX = 1.35;  // en-dessous, une cote sans edge positif est "trop faible"
const CACHE_VERSION = 'v1';

const COHORT_LABELS: Record<RiskCohort, string> = {
  safe: 'prudent (cotes basses, sécurité avant tout)',
  balanced: 'équilibré (bon rapport risque/récompense)',
  risky: 'offensif (accepte plus de variance pour de meilleures cotes)',
};

// ─── Schéma de sortie structurée Claude (output_config.format) ───────────────
// Zod v3 du projet incompatible avec le helper zodOutputFormat (Zod v4) —
// schéma JSON écrit à la main, mêmes garanties côté API.

const COACH_OUTPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    message: {
      type: 'string',
      description: 'Message principal du coach en français, 1 à 3 phrases, ton factuel et rassurant',
    },
    advice: {
      type: ['string', 'null'],
      description: 'Conseil complémentaire court, ou null si rien à ajouter',
    },
  },
  required: ['message', 'advice'],
  additionalProperties: false,
};

// ─── Récupération des données du jour ────────────────────────────────────────

async function fetchTodayPredictions(today: string): Promise<PredictionRow[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('match_predictions')
    .select('slug, home_team, away_team, league, match_date, match_time, prediction, probability, implied_probability, value_edge, recommended_odds')
    .eq('match_date', today)
    .order('value_edge', { ascending: false })
    .limit(30);

  // Exclut les matchs déjà joués (même marge 2h que ticket-du-jour)
  const nowMs = Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  return ((data ?? []) as PredictionRow[]).filter((m) => {
    if (!m.match_time) return true;
    const kickoffMs = new Date(`${m.match_date}T${m.match_time}:00Z`).getTime();
    return nowMs - kickoffMs <= TWO_HOURS_MS;
  });
}

// ─── Analyse déterministe du jour ─────────────────────────────────────────────

interface DayAnalysis {
  scenario: CoachScenario;
  valueBets: PredictionRow[];
  lowOddsTrap: PredictionRow | null;
}

function analyseDay(pool: PredictionRow[]): DayAnalysis {
  const valueBets = pool.filter(
    (m) => (m.value_edge ?? 0) >= VALUE_EDGE_MIN && (m.probability ?? 0) >= PROBABILITY_MIN
  );

  // Piège du jour : cote très basse SANS avantage de valeur (edge <= 0)
  const lowOddsTrap = pool.find(
    (m) => (m.recommended_odds ?? 99) <= LOW_ODDS_MAX && (m.value_edge ?? 0) <= 0
  ) ?? null;

  const scenario: CoachScenario =
    valueBets.length === 0 ? 'no_value_bet'
    : valueBets.length <= 2 ? 'few_value_bets'
    : 'several_value_bets';

  return { scenario, valueBets, lowOddsTrap };
}

function buildHighlights(valueBets: PredictionRow[]): CoachHighlight[] {
  return valueBets.slice(0, 3).map((m) => ({
    match: `${m.home_team} vs ${m.away_team}`,
    league: m.league,
    pick: m.prediction ?? '—',
    odds: m.recommended_odds ?? 0,
    modelPct: m.probability,
    valueEdge: m.value_edge,
    confidencePct: Math.round(m.probability ?? m.implied_probability ?? 60),
  }));
}

// ─── Génération du message via l'API Claude ──────────────────────────────────

async function generateWithClaude(
  analysis: DayAnalysis,
  cohort: RiskCohort,
  today: string,
): Promise<{ message: string; advice: string | null } | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[coach-reco] ANTHROPIC_API_KEY non défini — fallback messages déterministes');
    return null;
  }

  const client = new Anthropic({ timeout: 45_000 });

  const betsContext = analysis.valueBets.slice(0, 5).map((m, i) =>
    `${i + 1}. ${m.home_team} vs ${m.away_team} (${m.league}) — pick: ${m.prediction} @ ${m.recommended_odds} | proba modèle: ${m.probability}% | proba implicite bookmaker: ${m.implied_probability}% | value edge: +${m.value_edge}%`
  ).join('\n');

  const trapContext = analysis.lowOddsTrap
    ? `PIÈGE DÉTECTÉ: ${analysis.lowOddsTrap.home_team} vs ${analysis.lowOddsTrap.away_team} — cote ${analysis.lowOddsTrap.recommended_odds} trop faible par rapport à la probabilité estimée (edge ${analysis.lowOddsTrap.value_edge}%).`
    : 'Aucun pari piège à cote trop faible détecté aujourd\'hui.';

  const system = `Tu es le coach de pari d'AlgoPronos AI, plateforme de pronostics sportifs IA pour l'Afrique de l'Ouest francophone.
Ton rôle: conseiller, prévenir et guider — pas vendre. Ton: coach factuel, calme et rassurant. Jamais alarmiste, jamais de promesses de gains.
Règles:
- Réponds en français simple et direct (1 à 3 phrases pour le message principal).
- Si AUCUN value bet: recommande la patience et la discipline (ne pas parier aujourd'hui est une décision gagnante). Exemple d'esprit: "Aujourd'hui, il n'y a aucun pari avec une valeur suffisante. Patience, la discipline paie."
- Si 1 à 2 bons matchs: dis qu'ils présentent un bon rapport risque/récompense, cite les équipes.
- Si 3+ bons matchs: recommande de se limiter aux meilleurs, cite 1-2 équipes.
- Si un pari piège (cote trop faible vs probabilité) est signalé: ajoute un conseil du type "Évite ce pari : la cote est trop faible par rapport à la probabilité estimée." dans le champ advice.
- Adapte le conseil au profil de risque de l'utilisateur.
- Ne mentionne jamais de montants d'argent ni de garanties.`;

  const user = `Date: ${today}
Profil de risque de l'utilisateur: ${COHORT_LABELS[cohort]}
Scénario du jour: ${analysis.scenario} (${analysis.valueBets.length} value bet(s) détecté(s))

VALUE BETS DU JOUR:
${betsContext || '(aucun)'}

${trapContext}

Génère la recommandation du jour pour ce profil.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: COACH_OUTPUT_SCHEMA,
        },
      },
    });

    if (response.stop_reason === 'refusal') {
      console.warn('[coach-reco] Claude a refusé la requête — fallback');
      return null;
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return null;

    const parsed = JSON.parse(textBlock.text) as { message?: string; advice?: string | null };
    if (!parsed.message) return null;
    return { message: parsed.message, advice: parsed.advice ?? null };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.warn('[coach-reco] Claude rate-limited — fallback');
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[coach-reco] Claude API error ${err.status}:`, err.message);
    } else {
      console.error('[coach-reco] Claude call failed:', err);
    }
    return null;
  }
}

// ─── Messages de secours (si API Claude indisponible uniquement) ─────────────

function fallbackMessages(analysis: DayAnalysis): { message: string; advice: string | null } {
  const advice = analysis.lowOddsTrap
    ? `Évite ${analysis.lowOddsTrap.home_team} vs ${analysis.lowOddsTrap.away_team} : la cote est trop faible par rapport à la probabilité estimée.`
    : null;

  if (analysis.scenario === 'no_value_bet') {
    return {
      message: "Aujourd'hui, il n'y a aucun pari avec une valeur suffisante. Patience, la discipline paie.",
      advice,
    };
  }
  const n = Math.min(analysis.valueBets.length, 3);
  return {
    message: `${n === 1 ? 'Ce match présente' : `Ces ${n} matchs présentent`} un bon rapport risque/récompense selon notre analyse du jour.`,
    advice,
  };
}

// ─── Cache (api_cache, 1x/jour/cohorte) ──────────────────────────────────────

function cacheKey(today: string, cohort: RiskCohort): string {
  return `coach-reco:${CACHE_VERSION}:${today}:${cohort}`;
}

async function readCache(key: string): Promise<CoachRecommendation | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('api_cache')
      .select('data')
      .eq('cache_key', key)
      .single();
    return (data?.data as CoachRecommendation) ?? null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, reco: CoachRecommendation): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('api_cache').upsert(
      { cache_key: key, data: reco, fetched_at: new Date().toISOString() },
      { onConflict: 'cache_key' },
    );
  } catch (err) {
    console.warn('[coach-reco] cache write failed:', err);
  }
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export async function getCoachRecommendation(cohort: RiskCohort = 'balanced'): Promise<CoachRecommendation> {
  const today = new Date().toISOString().split('T')[0];
  const key = cacheKey(today, cohort);

  const cached = await readCache(key);
  if (cached) return cached;

  const pool = await fetchTodayPredictions(today);
  const analysis = analyseDay(pool);

  const generated = await generateWithClaude(analysis, cohort, today);
  const { message, advice } = generated ?? fallbackMessages(analysis);

  const highlights = buildHighlights(analysis.valueBets);
  const confidencePct = highlights.length > 0
    ? Math.round(highlights.reduce((acc, h) => acc + h.confidencePct, 0) / highlights.length)
    : null;

  const reco: CoachRecommendation = {
    date: today,
    cohort,
    scenario: analysis.scenario,
    message,
    advice,
    highlights,
    confidencePct,
    generatedBy: generated ? 'claude' : 'fallback',
  };

  // Ne met en cache que les vraies générations Claude — un fallback (clé API
  // absente, erreur réseau) sera retenté au prochain chargement.
  if (generated) {
    await writeCache(key, reco);
  }

  console.log(`[coach-reco] ${today}/${cohort}: scenario=${analysis.scenario}, valueBets=${analysis.valueBets.length}, source=${reco.generatedBy}`);
  return reco;
}
