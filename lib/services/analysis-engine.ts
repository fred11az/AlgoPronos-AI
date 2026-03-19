// ─────────────────────────────────────────────────────────────────────────────
// AlgoPronos AI — Analysis Engine
//
// Transforms raw match data into a structured analysis by processing 6 signals:
//   1. Team Form    — last 5 match results & goal averages
//   2. Expected Goals (xG) — predicted goals, Over/Under & BTTS indicators
//   3. Real-time Odds — bookmaker-implied probabilities (Bet365 when available)
//   4. Value Betting — model probability vs bookmaker probability gap
//   5. Model Probability — API-Football statistical win/draw/loss percentages
//   6. Risk Adaptation — pick scoring tuned to safe / balanced / risky profile
//
// Each signal is scored (0–100) and labelled. The engine then calls Claude Haiku
// (primary) or Groq llama-3.3-70b (fallback) to convert the signal data into a
// human-readable, journalistic analysis. Results are cached in Redis (12 h TTL)
// so repeat requests for the same match are served instantly at $0 cost.
// ─────────────────────────────────────────────────────────────────────────────

import type { MatchStats, TeamFormStats } from './stats-service';
import {
  cacheGet,
  cacheSet,
  buildAnalysisCacheKey,
  CACHE_TTL,
} from './redis-cache';
import { predict } from './prediction/predictionEngine';
import { fetchModelParams, initializeParams } from './prediction/dixonColes';
import { logPrediction } from './prediction/tracking';

// ─── Public types ─────────────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'balanced' | 'risky';

export interface SignalResult {
  /** Internal signal identifier */
  signal: 'form' | 'xg' | 'odds' | 'value' | 'probability' | 'risk_adaptation';
  /** Normalised 0–100 score (50 = neutral, >50 = home-leaning, <50 = away-leaning) */
  score: number;
  /** Which side the signal favours */
  direction: 'home' | 'away' | 'draw' | 'neutral';
  /** Short human-readable summary */
  label: string;
  /** Detailed figures backing the label */
  detail: string;
  /** How reliable this signal is for this match */
  confidence: 'high' | 'medium' | 'low';
}

export interface BettingRecommendation {
  type: string;    // "1X2" | "Double Chance"
  value: string;   // "1" | "X" | "2" | "1X" | "X2"
  odds: number;
  impliedPct: number;
  modelPct: number | null;
  /** model_probability − bookmaker_implied_probability */
  valueEdge: number | null;
  valueLabel: 'strong_value' | 'value' | 'neutral' | 'no_value';
}

export interface MatchAnalysisResult {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  /** All 6 processed signals */
  signals: SignalResult[];
  /** Overall confidence score 0–100 derived from signal confidence distribution */
  confidence: number;
  /** Primary recommended bet for the given risk level */
  recommendation: BettingRecommendation;
  /** All candidates ranked by risk-level score */
  allRecommendations: BettingRecommendation[];
  /** AI-generated 3-4 sentence reasoning (Claude Haiku or Groq) */
  reasoning: string;
  /** 1-2 sentence executive summary */
  summary: string;
  /** Single sentence risk assessment */
  riskAssessment: string;
  /** Combined probability estimate (model + form adjustment), 5–95 % */
  estimatedProbability: number;
  fromCache: boolean;
  generatedAt: string;
}

// ─── Signal 1 — Team Form ─────────────────────────────────────────────────────

function processFormSignal(
  homeForm: TeamFormStats | null,
  awayForm: TeamFormStats | null,
  homeTeam: string,
  awayTeam: string,
): SignalResult {
  if (!homeForm || !awayForm) {
    return {
      signal: 'form',
      score: 50,
      direction: 'neutral',
      label: 'Forme des équipes',
      detail: 'Données de forme non disponibles pour ce match',
      confidence: 'low',
    };
  }

  // Points per game over last 5 (W=3, D=1, L=0), expressed as 0–100 %
  const formScore = (form: string): number => {
    const chars = form.split('').slice(0, 5);
    const pts = chars.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
    return (pts / (chars.length * 3)) * 100;
  };

  const homeScore  = formScore(homeForm.form);
  const awayScore  = formScore(awayForm.form);
  const homeDiff   = homeForm.goalsFor  - homeForm.goalsAgainst;
  const awayDiff   = awayForm.goalsFor  - awayForm.goalsAgainst;

  // Combine form points + goal differential (×5 weight factor)
  const homeTotal = homeScore + homeDiff * 5;
  const awayTotal = awayScore + awayDiff * 5;
  const diff      = homeTotal - awayTotal;

  const score     = Math.min(100, Math.max(0, 50 + diff));
  const direction: SignalResult['direction'] =
    diff >  15 ? 'home' :
    diff < -15 ? 'away' :
    Math.abs(diff) < 5 ? 'draw' : 'neutral';

  const confidence: SignalResult['confidence'] =
    Math.abs(diff) > 20 ? 'high' : Math.abs(diff) > 8 ? 'medium' : 'low';

  const label =
    direction === 'home' ? `${homeTeam} en meilleure forme récente` :
    direction === 'away' ? `${awayTeam} en meilleure forme récente` :
    'Forme équilibrée entre les deux équipes';

  const detail =
    `${homeTeam}: ${homeForm.form} | moy. ${homeForm.goalsFor.toFixed(1)} buts/m encaissés ${homeForm.goalsAgainst.toFixed(1)} ` +
    `| ${awayTeam}: ${awayForm.form} | moy. ${awayForm.goalsFor.toFixed(1)} buts/m encaissés ${awayForm.goalsAgainst.toFixed(1)}`;

  return { signal: 'form', score: Math.round(score), direction, label, detail, confidence };
}

// ─── Signal 2 — Expected Goals (xG) ──────────────────────────────────────────

function processXgSignal(
  xgHome: number,
  xgAway: number,
  homeTeam: string,
  awayTeam: string,
): SignalResult {
  if (xgHome === 0 && xgAway === 0) {
    return {
      signal: 'xg',
      score: 50,
      direction: 'neutral',
      label: 'Expected Goals (xG)',
      detail: 'Données xG non disponibles pour ce match',
      confidence: 'low',
    };
  }

  const total     = xgHome + xgAway;
  const diff      = xgHome - xgAway;
  const homeShare = total > 0 ? (xgHome / total) * 100 : 50;

  const direction: SignalResult['direction'] =
    diff >  0.5 ? 'home' :
    diff < -0.5 ? 'away' : 'draw';

  const confidence: SignalResult['confidence'] =
    Math.abs(diff) > 1.0 ? 'high' : Math.abs(diff) > 0.5 ? 'medium' : 'low';

  const over25  = total > 2.5 ? `Over 2.5 PROBABLE (${total.toFixed(1)} xG)` : `Under 2.5 probable (${total.toFixed(1)} xG)`;
  const btts    = xgHome > 0.7 && xgAway > 0.7 ? 'BTTS probable' : 'BTTS incertain';

  const label =
    direction === 'home' ? `${homeTeam} domine en xG (${xgHome.toFixed(1)} vs ${xgAway.toFixed(1)})` :
    direction === 'away' ? `${awayTeam} domine en xG (${xgAway.toFixed(1)} vs ${xgHome.toFixed(1)})` :
    `xG équilibré (${xgHome.toFixed(1)} vs ${xgAway.toFixed(1)})`;

  const detail = `${homeTeam} xG: ${xgHome.toFixed(2)} | ${awayTeam} xG: ${xgAway.toFixed(2)} | ${over25} | ${btts}`;

  return { signal: 'xg', score: Math.round(homeShare), direction, label, detail, confidence };
}

// ─── Signal 3 — Real-time Odds ────────────────────────────────────────────────

function processOddsSignal(
  realOdds: { home: number; draw: number; away: number } | null,
  fallbackOdds: { home: number; draw: number; away: number },
  homeTeam: string,
  awayTeam: string,
): SignalResult {
  const odds   = realOdds ?? fallbackOdds;
  const source = realOdds ? 'Bet365 (temps réel)' : 'Cotes estimées';

  // Remove bookmaker overround to get true implied probs
  const rawH = 1 / odds.home;
  const rawD = 1 / odds.draw;
  const rawA = 1 / odds.away;
  const sum  = rawH + rawD + rawA;

  const iH = (rawH / sum) * 100;
  const iD = (rawD / sum) * 100;
  const iA = (rawA / sum) * 100;

  const direction: SignalResult['direction'] =
    iH > 55 ? 'home' :
    iA > 55 ? 'away' :
    iD > 30 ? 'draw' : 'neutral';

  const confidence: SignalResult['confidence'] =
    Math.max(iH, iA) > 65 ? 'high' :
    Math.max(iH, iA) > 50 ? 'medium' : 'low';

  const label =
    direction === 'home' ? `${homeTeam} favori (${odds.home} | ${Math.round(iH)}% implicite)` :
    direction === 'away' ? `${awayTeam} favori (${odds.away} | ${Math.round(iA)}% implicite)` :
    `Match équilibré (1=${odds.home} | X=${odds.draw} | 2=${odds.away})`;

  const detail =
    `[${source}] Cotes: 1=${odds.home} | X=${odds.draw} | 2=${odds.away} ` +
    `→ Prob. implicites: ${Math.round(iH)}% / ${Math.round(iD)}% / ${Math.round(iA)}%`;

  return { signal: 'odds', score: Math.round(iH), direction, label, detail, confidence };
}

// ─── Signal 4 — Value Betting ─────────────────────────────────────────────────

function processValueSignal(
  valueBetHome: number | null,
  valueBetAway: number | null,
  homeTeam: string,
  awayTeam: string,
): SignalResult {
  if (valueBetHome === null && valueBetAway === null) {
    return {
      signal: 'value',
      score: 50,
      direction: 'neutral',
      label: 'Value Betting',
      detail: 'Calcul de valeur indisponible (cotes réelles requises)',
      confidence: 'low',
    };
  }

  const vH = valueBetHome ?? 0;
  const vA = valueBetAway ?? 0;
  const best = Math.max(vH, vA);

  const direction: SignalResult['direction'] =
    vH > 5 ? 'home' :
    vA > 5 ? 'away' : 'neutral';

  const score = Math.min(100, Math.max(0, 50 + best * 2));

  const confidence: SignalResult['confidence'] =
    best > 10 ? 'high' : best > 5 ? 'medium' : 'low';

  const valueTag =
    best > 10 ? `⚡ VALUE BET FORT (+${best.toFixed(1)}%)` :
    best >  5 ? `✓ Value bet (+${best.toFixed(1)}%)` :
    best >  0 ? `Value marginale (+${best.toFixed(1)}%)` :
    'Pas de valeur détectée';

  const label =
    vH > 0 && vH >= vA ? `${homeTeam} — ${valueTag}` :
    vA > 0             ? `${awayTeam} — ${valueTag}` :
    'Aucune value significative détectée';

  const fmt = (v: number) => v > 0 ? `+${v}%` : `${v}%`;
  const detail = `${homeTeam}: ${fmt(vH)} vs bookmaker | ${awayTeam}: ${fmt(vA)} vs bookmaker`;

  return { signal: 'value', score: Math.round(score), direction, label, detail, confidence };
}

// ─── Signal 5 — Model Probability ────────────────────────────────────────────

function processProbabilitySignal(
  homePct: number,
  drawPct: number,
  awayPct: number,
  homeTeam: string,
  awayTeam: string,
): SignalResult {
  const direction: SignalResult['direction'] =
    homePct > 55 ? 'home' :
    awayPct > 55 ? 'away' :
    drawPct > 30 ? 'draw' : 'neutral';

  const confidence: SignalResult['confidence'] =
    Math.max(homePct, awayPct) > 65 ? 'high' :
    Math.max(homePct, awayPct) > 50 ? 'medium' : 'low';

  const label =
    direction === 'home' ? `Modèle: ${homeTeam} favoris à ${homePct}%` :
    direction === 'away' ? `Modèle: ${awayTeam} favoris à ${awayPct}%` :
    `Modèle: match incertain (${homePct}% / ${drawPct}% / ${awayPct}%)`;

  const detail =
    `Probabilités statistiques API-Football: ${homeTeam} ${homePct}% | Nul ${drawPct}% | ${awayTeam} ${awayPct}%`;

  return { signal: 'probability', score: homePct, direction, label, detail, confidence };
}

// ─── Signal 6 — Risk Adaptation ──────────────────────────────────────────────

function processRiskSignal(
  riskLevel: RiskLevel,
  recommendation: BettingRecommendation,
): SignalResult {
  const labels = {
    safe:     'PRUDENT — Favoris et Double Chance, exposition minimale',
    balanced: 'ÉQUILIBRÉ — Rapport risque/rendement optimal',
    risky:    'RISQUÉ — Maximisation du gain potentiel',
  };
  const details = {
    safe:     'Cotes cibles 1.20–2.00, Double Chance favorisée, value edge positif en bonus',
    balanced: 'Cotes cibles ~2.00, value edge positif prioritaire, 1X2 préféré',
    risky:    'Cotes cibles 2.00–8.00, value edge maximum, paris directs uniquement (pas de DC)',
  };

  const score = riskLevel === 'safe' ? 30 : riskLevel === 'balanced' ? 60 : 85;

  return {
    signal: 'risk_adaptation',
    score,
    direction: 'neutral',
    label: labels[riskLevel],
    detail: `${details[riskLevel]} | Sélection adaptée: "${recommendation.value}" @ ${recommendation.odds}`,
    confidence: 'high',
  };
}

// ─── Recommendation builder ───────────────────────────────────────────────────

function computeDCOdds(o1: number, o2: number): number {
  return Math.round((o1 * o2 / (o1 + o2)) * 100) / 100;
}

const RISK_PROFILE = {
  safe:     { minOdds: 1.20, maxOdds: 2.00, targetOdds: 1.55 },
  balanced: { minOdds: 1.55, maxOdds: 3.50, targetOdds: 2.00 },
  risky:    { minOdds: 2.00, maxOdds: 8.00, targetOdds: 3.00 },
} as const;

function buildRecommendations(
  odds: { home: number; draw: number; away: number },
  homePct: number,
  drawPct: number,
  awayPct: number,
  valueBetHome: number | null,
  valueBetAway: number | null,
  riskLevel: RiskLevel,
): { primary: BettingRecommendation; all: BettingRecommendation[] } {
  const dc1X = computeDCOdds(odds.home, odds.draw);
  const dcX2 = computeDCOdds(odds.draw, odds.away);

  const makeRec = (
    type: string,
    value: string,
    o: number,
    modelPct: number | null,
    rawValueBet: number | null,
  ): BettingRecommendation => {
    const impliedPct = Math.round((1 / o) * 100);
    const valueEdge  = rawValueBet !== null
      ? rawValueBet
      : modelPct !== null
        ? Math.round((modelPct - impliedPct) * 10) / 10
        : null;

    const valueLabel: BettingRecommendation['valueLabel'] =
      valueEdge === null ? 'neutral' :
      valueEdge > 10    ? 'strong_value' :
      valueEdge >  3    ? 'value' :
      valueEdge <  0    ? 'no_value' : 'neutral';

    return { type, value, odds: o, impliedPct, modelPct, valueEdge, valueLabel };
  };

  const all: BettingRecommendation[] = [
    makeRec('1X2',          '1',  odds.home, homePct,              valueBetHome),
    makeRec('1X2',          'X',  odds.draw, drawPct,              null),
    makeRec('1X2',          '2',  odds.away, awayPct,              valueBetAway),
    makeRec('Double Chance','1X', dc1X,      homePct + drawPct,    null),
    makeRec('Double Chance','X2', dcX2,      drawPct + awayPct,    null),
  ];

  const profile = RISK_PROFILE[riskLevel];

  const scoreRec = (r: BettingRecommendation): number => {
    if (riskLevel === 'safe') {
      return -r.odds
        + (r.type === 'Double Chance' ? 0.5 : 0)
        + ((r.valueEdge ?? 0) > 0 ? 0.3 : 0)
        - (r.odds > profile.targetOdds ? 0.4 : 0);
    }
    if (riskLevel === 'balanced') {
      return (r.valueEdge ?? 0) * 4
        - Math.abs(r.odds - profile.targetOdds) * 0.8
        + (r.type === '1X2' ? 0.2 : 0);
    }
    // risky
    return (r.valueEdge ?? 0) * 3
      + (r.odds > profile.targetOdds ? r.odds * 0.5 : 0)
      - (r.type === 'Double Chance' ? 2.0 : 0);
  };

  // Filter to odds range; fall back to full list if no candidates match
  let pool = all.filter(r => r.odds >= profile.minOdds && r.odds <= profile.maxOdds);
  if (pool.length === 0) pool = all;

  const sorted = [...pool].sort((a, b) => scoreRec(b) - scoreRec(a));
  return { primary: sorted[0], all: sorted };
}

// ─── AI Reasoning (Claude Haiku ▸ Groq fallback) ─────────────────────────────

async function generateAIReasoning(
  homeTeam: string,
  awayTeam: string,
  league: string,
  signals: SignalResult[],
  recommendation: BettingRecommendation,
  riskLevel: RiskLevel,
): Promise<{ reasoning: string; summary: string; riskAssessment: string }> {
  const riskCtx = {
    safe:     'COUPON PRUDENT — insiste sur la solidité du favori et la sécurité de la sélection.',
    balanced: 'COUPON ÉQUILIBRÉ — mets en avant le rapport risque/rendement optimal et la value détectée.',
    risky:    'COUPON RISQUÉ — insiste sur le potentiel de gain élevé et l\'avantage value.',
  }[riskLevel];

  const signalsBlock = signals.map(s =>
    `• ${s.signal.toUpperCase()} [${s.confidence}]: ${s.label}\n  ${s.detail}`
  ).join('\n');

  const valueNote = recommendation.valueEdge !== null && recommendation.valueEdge > 0
    ? `⚡ VALUE BET DÉTECTÉ: modèle ${recommendation.modelPct}% vs bookmaker ${recommendation.impliedPct}% → +${recommendation.valueEdge}% d'avantage`
    : `Probabilité implicite bookmaker: ${recommendation.impliedPct}%${recommendation.modelPct !== null ? ` | Modèle: ${recommendation.modelPct}%` : ''}`;

  const systemPrompt =
    `Tu es AlgoPronos AI, analyste sportif expert en paris sportifs. ${riskCtx}
RÈGLES:
- reasoning: 3-4 phrases percutantes, journalistiques, spécifiques à CE match — cite forme, xG, value
- summary: 1-2 phrases résumant la logique du pari
- riskAssessment: 1 phrase nommant le risque principal
- INTERDITS: "les statistiques indiquent", "il est difficile de prédire", formules génériques
- Réponds UNIQUEMENT en JSON valide, zéro texte avant/après`;

  const userPrompt =
    `MATCH: ${homeTeam} vs ${awayTeam} (${league})
SÉLECTION CONFIRMÉE: "${recommendation.value}" @ ${recommendation.odds} [${recommendation.type}]
${valueNote}

SIGNAUX ANALYSÉS:
${signalsBlock}

RÉPONDS avec ce JSON exact:
{
  "reasoning": "3-4 phrases percutantes justifiant cette sélection",
  "summary": "1-2 phrases résumant la logique du pari",
  "riskAssessment": "1 phrase évaluant le risque principal"
}`;

  let text = '';

  // — Primary: OpenClaw gateway (requested by user) ———————————————————————
  const ocUrl = process.env.OPENCLAW_GATEWAY_URL;
  const ocToken = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (ocUrl && !text) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

      const res = await fetch(ocUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ocToken ? `Bearer ${ocToken}` : '',
        },
        body: JSON.stringify({
          model: 'openclaw',
          messages: [
            { role: 'system', content: systemPrompt + "\nIMPORTANT: All data is provided. DO NOT PERFORM ANY EXTERNAL SEARCH. Use only provided context." },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        text = data.choices[0]?.message?.content ?? '';
      }
    } catch (err) {
      console.warn('[analysis-engine] OpenClaw failed, trying Claude:', err);
    }
  }

  // — Fallback: Claude Haiku (excellent French) ——————————————
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && !text) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client  = new Anthropic({ apiKey: anthropicKey });
      const message = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }],
      });
      if (message.content[0].type === 'text') {
        text = message.content[0].text;
      }
    } catch (err) {
      console.warn('[analysis-engine] Claude Haiku failed, trying Groq:', err);
    }
  }

  // — Fallback: Groq llama-3.3-70b ——————————————————————————————————————
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !text) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model:      'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens:  600,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        text = data.choices[0]?.message?.content ?? '';
      }
    } catch (err) {
      console.warn('[analysis-engine] Groq fallback failed:', err);
    }
  }

  // — Static fallback if both AI services are unavailable —————————————————
  if (!text) {
    const pctLabel = recommendation.modelPct ?? recommendation.impliedPct;
    return {
      reasoning:      `${homeTeam} vs ${awayTeam}: sélection "${recommendation.value}" retenue par l'algorithme avec une probabilité estimée de ${pctLabel}%.`,
      summary:        `Pari ${recommendation.type} sur "${recommendation.value}" @ ${recommendation.odds}.`,
      riskAssessment: `Risque ${riskLevel === 'safe' ? 'faible' : riskLevel === 'risky' ? 'élevé' : 'modéré'}.`,
    };
  }

  // Parse JSON from AI response
  const stripped   = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const jsonMatch  = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { reasoning: text.substring(0, 400), summary: '', riskAssessment: '' };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      reasoning:      parsed.reasoning      || '',
      summary:        parsed.summary        || '',
      riskAssessment: parsed.riskAssessment || '',
    };
  } catch {
    return { reasoning: text.substring(0, 400), summary: '', riskAssessment: '' };
  }
}

// ─── Main public API ──────────────────────────────────────────────────────────

/**
 * Generate a full 6-signal analysis for one match.
 *
 * Results are cached in Redis for `CACHE_TTL.MATCH_ANALYSIS` (12 h) so that
 * subsequent requests for the same matchId+riskLevel+day are returned instantly
 * without any API call.
 */
export async function analyzeMatch(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  league: string,
  matchDate: string,
  currentOdds: { home: number; draw: number; away: number },
  riskLevel: RiskLevel,
  stats: MatchStats,
  skipCache = false,
): Promise<MatchAnalysisResult> {
  // ── Redis cache lookup ────────────────────────────────────────────────────
  const cacheKey = buildAnalysisCacheKey(matchId, riskLevel, matchDate);

  if (!skipCache) {
    const cached = await cacheGet<MatchAnalysisResult>(cacheKey);
    if (cached) {
      console.log(`[analysis-engine] Cache HIT  ${matchId}:${riskLevel}`);
      return { ...cached, fromCache: true };
    }
    console.log(`[analysis-engine] Cache MISS ${matchId}:${riskLevel}`);
  }

  const effectiveOdds = stats.realOdds ?? currentOdds;

  // ── 0. Dixon-Coles Prediction ───────────────────────────────────────────
  let dcPrediction: any = null;
  try {
    // 1. Initialisation des paramètres par défaut
    const defaultParams = initializeParams([homeTeam, awayTeam]);
    
    // 2. Tentative de récupération des paramètres optimisés (MLE/Seeded)
    const optimizedStrengths = await fetchModelParams([homeTeam, awayTeam]);
    if (optimizedStrengths[homeTeam]) defaultParams.teams[homeTeam] = optimizedStrengths[homeTeam];
    if (optimizedStrengths[awayTeam]) defaultParams.teams[awayTeam] = optimizedStrengths[awayTeam];

    // 3. Update with derived stats (last 5) if MLE not available
    if (!optimizedStrengths[homeTeam] && stats.homeAttack && stats.homeDefense) {
      defaultParams.teams[homeTeam] = { attack: stats.homeAttack, defense: stats.homeDefense };
    }
    if (!optimizedStrengths[awayTeam] && stats.awayAttack && stats.awayDefense) {
      defaultParams.teams[awayTeam] = { attack: stats.awayAttack, defense: stats.awayDefense };
    }

    // 4. Run Prediction
    dcPrediction = predict({
      homeTeam,
      awayTeam,
      marketOdds: effectiveOdds,
      modelParams: defaultParams
    });

    console.log(`✅ [Dixon-Coles] ${homeTeam} vs ${awayTeam}`);
    console.log(`   - Parameters: H_Att:${defaultParams.teams[homeTeam]?.attack.toFixed(2)} A_Att:${defaultParams.teams[awayTeam]?.attack.toFixed(2)} (Adv:${defaultParams.homeAdvantage})`);
    console.log(`   - Lambdas: H:${dcPrediction.lambdas.home.toFixed(2)} A:${dcPrediction.lambdas.away.toFixed(2)}`);
    console.log(`   - Probabilities: H:${(dcPrediction.probabilities.home * 100).toFixed(1)}% D:${(dcPrediction.probabilities.draw * 100).toFixed(1)}% A:${(dcPrediction.probabilities.away * 100).toFixed(1)}%`);
    
    if (dcPrediction.valueAnalysis) {
      const best = dcPrediction.valueAnalysis.find((v: any) => v.valueEdge > 0.05);
      if (best) console.log(`✅ [Value] Edge détecté: +${(best.valueEdge * 100).toFixed(1)}% sur marché ${best.market.toUpperCase()}`);
    }

    // 5. LOG to predictions_log for ROI Tracking
    if (dcPrediction && dcPrediction.valueAnalysis && dcPrediction.valueAnalysis.length > 0) {
      // Find the best bet from value analysis (already sorted by best edge)
      const bestValue = dcPrediction.valueAnalysis[0];
      
      if (bestValue && bestValue.valueEdge > 0.05) { // Log only significant value bets
        await logPrediction({
          matchId: matchId,
          homeTeam,
          awayTeam,
          market: bestValue.market as any,
          modelProb: bestValue.modelProb,
          bookmakerOdds: bestValue.bookmakerOdds,
          valueEdge: bestValue.valueEdge
        });
      }
    }
  } catch (err) {
    console.error('[analysis-engine] Dixon-Coles error:', err);
  }

  // ── Process signals 1–5 ──────────────────────────────────────────────────
  const formSignal    = processFormSignal(stats.homeForm, stats.awayForm, homeTeam, awayTeam);
  const xgSignal      = processXgSignal(stats.goalsHomeExpected, stats.goalsAwayExpected, homeTeam, awayTeam);
  const oddsSignal    = processOddsSignal(stats.realOdds, currentOdds, homeTeam, awayTeam);
  const valueSignal   = processValueSignal(
    dcPrediction.valueAnalysis.find((v: any) => v.market === 'home')?.valueEdge ?? null,
    dcPrediction.valueAnalysis.find((v: any) => v.market === 'away')?.valueEdge ?? null,
    homeTeam, 
    awayTeam
  );
  const probSignal    = processProbabilitySignal(
    dcPrediction.probabilities.home,
    dcPrediction.probabilities.draw,
    dcPrediction.probabilities.away,
    homeTeam,
    awayTeam
  );

  // ── Build recommendations ────────────────────────────────────────────────
  const { primary: recommendation, all: allRecommendations } = buildRecommendations(
    effectiveOdds,
    dcPrediction.probabilities.home,
    dcPrediction.probabilities.draw,
    dcPrediction.probabilities.away,
    dcPrediction.valueAnalysis.find((v: any) => v.market === 'home')?.valueEdge ?? null,
    dcPrediction.valueAnalysis.find((v: any) => v.market === 'away')?.valueEdge ?? null,
    riskLevel,
  );

  // ── Signal 6 — Risk Adaptation ───────────────────────────────────────────
  const riskSignal = processRiskSignal(riskLevel, recommendation);

  const signals: SignalResult[] = [
    formSignal,
    xgSignal,
    oddsSignal,
    valueSignal,
    probSignal,
    riskSignal,
  ];

  // ── Overall confidence (weighted by signal confidence level) ─────────────
  const highCount   = signals.filter(s => s.confidence === 'high').length;
  const mediumCount = signals.filter(s => s.confidence === 'medium').length;
  const confidence  = Math.round(
    (highCount * 3 + mediumCount * 1.5) / (signals.length * 3) * 100
  );

  // ── Estimated probability (model + form adjustment) ──────────────────────
  const modelPct    = recommendation.modelPct ?? recommendation.impliedPct;
  const favSide     = recommendation.value === '1' ? 'home'
                    : recommendation.value === '2' ? 'away'
                    : 'draw';
  const formBonus   = formSignal.direction === favSide ? 3 : formSignal.direction === 'neutral' ? 0 : -2;
  const estimatedProbability = Math.min(95, Math.max(5, Math.round(modelPct + formBonus)));

  // ── AI reasoning (Claude Haiku ▸ Groq) ───────────────────────────────────
  const { reasoning, summary, riskAssessment } = await generateAIReasoning(
    homeTeam, awayTeam, league, signals, recommendation, riskLevel,
  );

  const result: MatchAnalysisResult = {
    matchId,
    homeTeam,
    awayTeam,
    league,
    signals,
    confidence,
    recommendation,
    allRecommendations,
    reasoning,
    summary,
    riskAssessment,
    estimatedProbability,
    fromCache: false,
    generatedAt: new Date().toISOString(),
  };

  // ── Persist to Redis ──────────────────────────────────────────────────────
  await cacheSet(cacheKey, result, CACHE_TTL.MATCH_ANALYSIS);

  return result;
}

/**
 * Analyse multiple matches in parallel, re-using the Redis cache for each.
 * Ideal for combine generation: one call, all 6-signal analyses in one shot.
 */
export async function analyzeMatches(
  matches: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    date: string;
    odds: { home: number; draw: number; away: number };
  }>,
  riskLevel: RiskLevel,
  statsMap: Map<string, MatchStats>,
): Promise<MatchAnalysisResult[]> {
  return Promise.all(
    matches.map(m => {
      const stats = statsMap.get(m.id) ?? {
        fixtureId:          m.id,
        homeTeam:           m.homeTeam,
        awayTeam:           m.awayTeam,
        homePct:            Math.round((1 / m.odds.home) * 100),
        drawPct:            Math.round((1 / m.odds.draw) * 100),
        awayPct:            Math.round((1 / m.odds.away) * 100),
        goalsHomeExpected:  0,
        goalsAwayExpected:  0,
        advice:             '',
        predictedWinner:    null,
        homeForm:           null,
        awayForm:           null,
        valueBetHome:       null,
        valueBetAway:       null,
        realOdds:           null,
        dataSource:         'estimated' as const,
      };

      return analyzeMatch(
        m.id, m.homeTeam, m.awayTeam, m.league,
        m.date, m.odds, riskLevel, stats,
      );
    })
  );
}
