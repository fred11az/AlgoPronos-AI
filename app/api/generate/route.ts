import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAnonymousSession, getAnonymousSessionId, logAnonymousEvent } from '@/lib/anonymous';
import { fetchStatsForMatches, type MatchStats } from '@/lib/services/stats-service';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { cacheGet, cacheSet, cacheDel, buildCombineCacheKey, CACHE_TTL } from '@/lib/services/redis-cache';
import { callVenice, parseAIJson, getVeniceModel } from '@/lib/services/venice-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Types ───────────────────────────────────────────────────────────────────

interface SelectedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueCode: string;
  country: string;
  date: string;
  time: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

interface CombineParameters {
  date: string;
  leagues: string[];
  oddsRange: { min: number; max: number };
  matchCount: number;
  riskLevel: 'safe' | 'balanced' | 'risky';
  betType: 'single' | 'double' | 'triple' | 'accumulator';
  selectedMatches?: SelectedMatch[];
}

// ─── Quota config ─────────────────────────────────────────────────────────────

const DAILY_LIMIT_REGISTERED = 2; // registered (non-verified): 2 per day
// Visitor trial: 1 total, tracked via HttpOnly cookie 'algopronos_v_trial'

// ─── Day helper ───────────────────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function isNewDay(lastDate: string | null | undefined): boolean {
  if (!lastDate) return true;
  return lastDate < getTodayDate();
}

// ─── Cache key ────────────────────────────────────────────────────────────────

// Increment this when prompts change significantly — forces cache invalidation
const PROMPT_VERSION = 7; // 2026-05: Venice AI replaces deterministic algorithm — AI selects + explains picks

function generateCacheKey(params: CombineParameters): string {
  const normalized = {
    v: PROMPT_VERSION,
    date: new Date(params.date).toISOString().split('T')[0],
    leagues: [...params.leagues].sort(),
    oddsMin: params.oddsRange.min,
    oddsMax: params.oddsRange.max,
    matchCount: params.matchCount,
    riskLevel: params.riskLevel,
    betType: params.betType,
    selectedMatchIds: params.selectedMatches?.map(m => m.id).sort() || [],
  };
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex').substring(0, 16);
}

// ─── Venice-only AI Call ─────────────────────────────────────────────────────
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  _model: string,
  maxTokens: number,
): Promise<string> {
  if (!process.env.VENICE_API_KEY) {
    console.error('[callAI] VENICE_API_KEY is missing. Venice is the only configured AI provider.');
    return '';
  }

  try {
    console.log('[callAI] Using Venice AI only...');
    const result = await callVenice(systemPrompt, userPrompt, { maxTokens, temperature: 0.4 });
    console.log('[callAI] Venice AI OK');
    return result;
  } catch (err: any) {
    console.error('[callAI] Venice AI failed:', err?.message || err);
    return '';
  }
}

// ─── AI-driven pick selection (Venice AI replaces the deterministic algorithm) ─

interface AIPickResult {
  finalMatches: object[];
  analysis: object;
  totalOdds: number;
  probability: number;
}

interface VenicePicksResponse {
  picks: Array<{
    matchId: string;
    type: string;
    value: string;
    odds: number;
    reasoning: string;
  }>;
  summary: string;
  keyFactors: string[];
  riskAssessment: string;
}

async function selectPicksWithVenice(
  matches: Array<{ id: string; homeTeam: string; awayTeam: string; league: string; country: string; date: string; time: string; odds?: { home: number; draw: number; away: number } | null }>,
  statsMap: Map<string, MatchStats>,
  params: CombineParameters,
): Promise<AIPickResult | null> {
  if (!process.env.VENICE_API_KEY) return null;

  const riskLabel = { safe: 'SÉCURISÉ', balanced: 'ÉQUILIBRÉ', risky: 'RISQUÉ' }[params.riskLevel];
  const riskGuide = {
    safe:     'Choisis des favoris solides. Préfère Double Chance (1X ou X2). Cotes entre 1.10 et 2.20. Priorité sécurité absolue.',
    balanced: 'Équilibre risque/rendement. Mélange 1X2 et Double Chance. Cherche la valeur (cote bookmaker sous-évaluée). Cotes 1.30-4.00.',
    risky:    'Recherche les coups surprises et value bets. Cotes 2.50+. Sélections directes (1X2), pas Double Chance. Potentiel de gain max.',
  }[params.riskLevel];

  const matchesContext = matches.map((m, i) => {
    const stats = statsMap.get(m.id);
    const odds = isValidOdds(stats?.realOdds) ? stats!.realOdds! : isValidOdds(m.odds) ? m.odds! : null;

    let text = `[Match ${i + 1}] ID:${m.id} | ${m.homeTeam} vs ${m.awayTeam} | ${m.league} | ${m.date} ${m.time}`;

    if (odds) {
      const dc1X = computeDCOdds(odds.home, odds.draw);
      const dcX2 = computeDCOdds(odds.draw, odds.away);
      text += `\n  Cotes 1X2 → Domicile:${odds.home} | Nul:${odds.draw} | Extérieur:${odds.away}`;
      text += `\n  Double Chance → 1X:${dc1X} | X2:${dcX2}`;
      text += `\n  Probabilités implicites → Dom:${Math.round(100/odds.home)}% | Nul:${Math.round(100/odds.draw)}% | Ext:${Math.round(100/odds.away)}%`;
    } else {
      text += '\n  ⚠️ Cotes indisponibles — ne pas sélectionner';
    }

    if (stats?.homeForm) {
      const diff = (stats.homeForm.goalsFor - stats.homeForm.goalsAgainst).toFixed(1);
      text += `\n  ${m.homeTeam}: forme=${stats.homeForm.form} | moy.buts=${stats.homeForm.goalsFor.toFixed(1)} | diff=${diff}`;
    }
    if (stats?.awayForm) {
      const diff = (stats.awayForm.goalsFor - stats.awayForm.goalsAgainst).toFixed(1);
      text += `\n  ${m.awayTeam}: forme=${stats.awayForm.form} | moy.buts=${stats.awayForm.goalsFor.toFixed(1)} | diff=${diff}`;
    }
    if (stats?.over25Odds) text += `\n  Over 2.5: cote ${stats.over25Odds}`;
    if (stats?.bttsOdds)   text += `\n  BTTS Oui: cote ${stats.bttsOdds}`;
    if (stats?.advice)     text += `\n  Conseil API: "${stats.advice}"`;

    return text;
  }).join('\n\n');

  const system = `Tu es AlgoPronos AI, analyste expert en paris sportifs pour l'Afrique de l'Ouest.
Contexte: Coupe du Monde 2026 FIFA approche — les équipes nationales jouent leurs dernières qualifications.

MISSION: Analyser les matchs fournis et sélectionner exactement ${params.matchCount} pick(s) optimal(-aux) pour un coupon ${riskLabel}.

RÈGLES IMPÉRATIVES:
1. Utilise UNIQUEMENT les cotes fournies — ne les invente jamais
2. Ne sélectionne QUE des matchs avec des cotes disponibles
3. ${riskGuide}
4. Pour chaque pick: type = "1X2" | "Double Chance" | "Over/Under" | "BTTS" et value = "1"|"X"|"2"|"1X"|"X2"|"Over 2.5"|"Under 2.5"|"Oui"|"Non"
5. Les odds dans ta réponse doivent correspondre EXACTEMENT aux cotes données
6. Raisonnement SPÉCIFIQUE: forme réelle des équipes, avantage terrain, contexte championnat
7. INTERDIT: inventer des classements, citer des % de probabilité, être générique
8. Réponds UNIQUEMENT en JSON valide — zéro texte avant ou après`;

  const user = `MATCHS DISPONIBLES:
${matchesContext}

Sélectionne exactement ${params.matchCount} pick(s) (profil: ${riskLabel}).

JSON de réponse:
{
  "picks": [
    {
      "matchId": "ID_EXACT_DU_MATCH",
      "type": "1X2",
      "value": "1",
      "odds": 1.75,
      "reasoning": "2-3 phrases d'analyse spécifique. Cite la forme, le contexte, l'avantage identifié. Concis et percutant."
    }
  ],
  "summary": "Résumé global en 2 phrases. Cite au moins 1 équipe concrète et l'atout principal du coupon.",
  "keyFactors": ["facteur clé 1", "facteur clé 2", "facteur clé 3"],
  "riskAssessment": "Identification du match le plus incertain et pourquoi en 1 phrase."
}`;

  try {
    console.log(`[Venice picks] Calling Venice AI (${getVeniceModel()}) for ${params.matchCount} picks (${riskLabel})...`);
    const content = await callVenice(system, user, { maxTokens: 2500, temperature: 0.25 });
    const parsed = parseAIJson<VenicePicksResponse>(content);

    if (!parsed?.picks || !Array.isArray(parsed.picks) || parsed.picks.length === 0) {
      console.warn('[Venice picks] Invalid or empty picks in response');
      return null;
    }

    // Validate each pick against real match data and fix odds if drifted
    const finalMatchesList: object[] = [];
    for (const pick of parsed.picks.slice(0, params.matchCount)) {
      const match = matches.find(m => m.id === pick.matchId);
      if (!match) {
        console.warn(`[Venice picks] Unknown matchId: ${pick.matchId}`);
        continue;
      }

      const stats = statsMap.get(match.id);
      const realOdds = isValidOdds(stats?.realOdds) ? stats!.realOdds! : isValidOdds(match.odds) ? match.odds! : null;
      if (!realOdds) continue;

      // Snap odds to actual bookmaker value if AI drifted
      let confirmedOdds = pick.odds;
      if (pick.type === '1X2') {
        const expected = pick.value === '1' ? realOdds.home : pick.value === 'X' ? realOdds.draw : realOdds.away;
        if (Math.abs(expected - pick.odds) > 0.3) confirmedOdds = expected;
      } else if (pick.type === 'Double Chance') {
        const dc1X = computeDCOdds(realOdds.home, realOdds.draw);
        const dcX2 = computeDCOdds(realOdds.draw, realOdds.away);
        confirmedOdds = pick.value === '1X' ? dc1X : dcX2;
      }

      const impliedPct = Math.round((1 / confirmedOdds) * 100);
      finalMatchesList.push({
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        kickoffTime: `${match.date} ${match.time}`.trim(),
        selection: {
          type: pick.type,
          value: pick.value,
          odds: confirmedOdds,
          reasoning: pick.reasoning || null,
          impliedPct,
          modelPct: null,
          valueEdge: null,
        },
      });
    }

    if (finalMatchesList.length === 0) return null;

    const totalOdds = Math.round(
      (finalMatchesList as any[]).reduce((acc, m) => acc * m.selection.odds, 1) * 100
    ) / 100;
    const probability = Math.round(
      (finalMatchesList as any[]).reduce((acc, m) => acc + m.selection.impliedPct, 0) / finalMatchesList.length
    );

    console.log(`[Venice picks] Generated ${finalMatchesList.length} picks. Total odds: ${totalOdds}`);
    return {
      finalMatches: finalMatchesList,
      analysis: {
        summary: parsed.summary || '',
        keyFactors: parsed.keyFactors || [],
        riskAssessment: parsed.riskAssessment || '',
        poweredBy: 'venice-ai',
      },
      totalOdds,
      probability,
    };
  } catch (err: any) {
    console.error('[Venice picks] Failed:', err.message);
    return null;
  }
}


// ─── Risk strategy helpers ────────────────────────────────────────────────────

// ─── Pick algorithm (deterministic — IA explains, algorithm decides) ──────────

function computeDCOdds(o1: number, o2: number): number {
  return Math.round((o1 * o2 / (o1 + o2)) * 100) / 100;
}

interface AlgoPick {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  kickoffTime: string;
  selection: {
    type: string;
    value: string;
    odds: number;
    impliedPct: number;
    modelPct: number | null;
    valueEdge: number | null;
  };
}

interface PickCandidate {
  type: string;
  value: string;
  odds: number;
  impliedPct: number;
  modelPct: number | null;
  valueEdge: number | null;
}

// Odds min/max selon le niveau de risque
// IMPORTANT: balanced.minOdds DOIT être bas (1.20) pour inclure les favoris et doubles chances
const RISK_ODDS_PROFILE = {
  safe:     { minOdds: 1.10, maxOdds: 2.10 },
  balanced: { minOdds: 1.20, maxOdds: 5.00 },
  risky:    { minOdds: 2.50, maxOdds: 20.0 },
} as const;

// Cote totale cible selon le niveau de risque et le nombre de matchs
// → la cote cible PAR MATCH est totalTarget^(1/matchCount)
const TOTAL_ODDS_TARGET = {
  safe:     2.5,
  balanced: 5.0,
  risky:    20.0,
};

function computeTargetOddsPerPick(riskLevel: 'safe' | 'balanced' | 'risky', matchCount: number): number {
  const total = TOTAL_ODDS_TARGET[riskLevel];
  return Math.pow(total, 1 / Math.max(matchCount, 1));
}

function isValidOdds(odds: any) {
  return odds && Number(odds.home) > 0 && Number(odds.draw) > 0 && Number(odds.away) > 0;
}

function pickForMatch(
  match: { id: string; homeTeam: string; awayTeam: string; league: string; country: string; date: string; time: string; odds?: { home: number; draw: number; away: number } | null },
  riskLevel: 'safe' | 'balanced' | 'risky',
  stats: MatchStats | undefined,
  oddsRange: { min: number; max: number },
  targetOddsPerPick: number,
): AlgoPick | null {
  // Utilise uniquement les cotes réelles — The Odds API (via match.odds) ou API-Football (stats.realOdds)
  // Aucune estimation ni génération aléatoire
  const finalOdds = isValidOdds(stats?.realOdds)
    ? stats!.realOdds!
    : isValidOdds(match.odds) ? match.odds! : null;

  // Pas de cotes disponibles → pas de sélection possible
  if (!finalOdds) return null;
  const ho = finalOdds.home;
  const dr = finalOdds.draw;
  const aw = finalOdds.away;
  const dc1X = computeDCOdds(ho, dr);
  const dcX2 = computeDCOdds(dr, aw);

  const candidates: PickCandidate[] = [];

  const addCandidate = (type: string, value: string, odds: number, modelPct: number | null) => {
    if (odds < 1.01 || odds > 25) return;
    const impliedPct = Math.round((1 / odds) * 100);
    const valueEdge = modelPct !== null ? Math.round((modelPct - impliedPct) * 10) / 10 : null;
    candidates.push({ type, value, odds, impliedPct, modelPct, valueEdge });
  };

  // 1X2
  addCandidate('1X2', '1', ho, stats?.homePct ?? null);
  addCandidate('1X2', 'X', dr, stats?.drawPct ?? null);
  addCandidate('1X2', '2', aw, stats?.awayPct ?? null);
  // Double Chance
  addCandidate('Double Chance', '1X', dc1X, stats ? stats.homePct + stats.drawPct : null);
  addCandidate('Double Chance', 'X2', dcX2, stats ? stats.drawPct + stats.awayPct : null);
  // BTTS (probabilité Poisson depuis xG)
  if (stats?.bttsOdds && stats.bttsProbability !== null) {
    addCandidate('BTTS', 'Oui', stats.bttsOdds, stats.bttsProbability);
  }
  if (stats?.bttsNoOdds && stats.bttsProbability !== null) {
    addCandidate('BTTS', 'Non', stats.bttsNoOdds, 100 - stats.bttsProbability);
  }
  // Over / Under 2.5
  if (stats?.over25Odds && stats.over25Probability !== null) {
    addCandidate('Over/Under', 'Over 2.5', stats.over25Odds, stats.over25Probability);
  }
  if (stats?.under25Odds && stats.over25Probability !== null) {
    addCandidate('Over/Under', 'Under 2.5', stats.under25Odds, 100 - stats.over25Probability);
  }

  const riskProfile = RISK_ODDS_PROFILE[riskLevel];

  let pool = candidates.filter(c =>
    c.odds <= riskProfile.maxOdds &&
    (c.type === 'Double Chance' ? c.odds >= 1.01 : c.odds >= riskProfile.minOdds)
  );
  // Fallback: si aucun candidat dans la plage, on prend tout
  if (pool.length === 0) pool = candidates;

  let best = pool[0];

  if (riskLevel === 'safe') {
    // Sécurisé : cotes basses (haute prob.), bonus Double Chance, proche de la cible par match
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        (c.modelPct ?? c.impliedPct) * 1.5              // haute probabilité en priorité
        + (c.type === 'Double Chance' ? 2.0 : 0)        // forte préférence DC
        + ((c.valueEdge ?? 0) > 0 ? 0.5 : 0)
        - Math.abs(c.odds - targetOddsPerPick) * 1.0;  // proche de la cible par match
      return score(b) > score(a) ? b : a;
    });
  } else if (riskLevel === 'balanced') {
    // Équilibré : value edge + cotes proches de la cible par match + probabilité correcte
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        (c.valueEdge ?? 0) * 2.5                        // value bet prioritaire
        + (c.modelPct ?? c.impliedPct) * 0.5            // probabilité modèle
        - Math.abs(c.odds - targetOddsPerPick) * 1.5   // proche de la cible par match
        + (c.type === '1X2' ? 0.3 : 0);                // léger bonus 1X2 (plus lisible)
      return score(b) > score(a) ? b : a;
    });
  } else {
    // Risqué : cotes élevées, value edge, Double Chance exclu
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        c.odds * 2.0
        + (c.valueEdge ?? 0) * 0.4
        - (c.type === 'Double Chance' ? 5.0 : 0);
      return score(b) > score(a) ? b : a;
    });
  }

  // Aucun candidat dans la plage de risque → prend le plus proche de la cible parmi tous
  if (pool.length === 0) pool = candidates;

  // Already assigned in the risk blocks above
  return {
    matchId: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    country: match.country || '',
    kickoffTime: `${match.date} ${match.time}`.trim(),
    selection: {
      type: best.type,
      value: best.value,
      odds: best.odds,
      impliedPct: best.impliedPct,
      modelPct: best.modelPct,
      valueEdge: best.valueEdge,
    },
  };
}

function pickBestMarkets(
  matches: { id: string; homeTeam: string; awayTeam: string; league: string; country: string; date: string; time: string; odds?: { home: number; draw: number; away: number } | null }[],
  riskLevel: 'safe' | 'balanced' | 'risky',
  statsMap: Map<string, MatchStats>,
  oddsRange: { min: number; max: number },
): AlgoPick[] {
  // La cote cible par match dépend du nombre de matchs pour atteindre la cote totale visée
  const targetOddsPerPick = computeTargetOddsPerPick(riskLevel, matches.length);
  return matches
    .map(m => pickForMatch(m, riskLevel, statsMap.get(m.id), oddsRange, targetOddsPerPick))
    .filter((p): p is AlgoPick => p !== null); // exclut les matchs sans cotes réelles
}


// ─── Visitor coupon (no AI call) ─────────────────────────────────────────────

function buildVisitorCoupon(picks: AlgoPick[]): {
  selectedMatches: object[];
  totalOdds: number;
  probability: number;
  analysis: { visitor: true };
} {
  const totalOdds = Math.round(picks.reduce((acc, p) => acc * p.selection.odds, 1) * 100) / 100;
  // Confiance = moyenne par pick (pas le produit qui donne ~1% pour 4 matchs)
  const probability = Math.round(picks.reduce((acc, p) => acc + p.selection.impliedPct, 0) / picks.length);

  return {
    selectedMatches: picks.map(p => ({
      matchId: p.matchId,
      homeTeam: p.homeTeam,
      awayTeam: p.awayTeam,
      league: p.league,
      kickoffTime: p.kickoffTime,
      selection: {
        type: p.selection.type,
        value: p.selection.value,
        odds: p.selection.odds,
        reasoning: null,
        impliedPct: p.selection.impliedPct,
        valueEdge: p.selection.valueEdge,
      },
    })),
    totalOdds,
    probability,
    analysis: { visitor: true },
  };
}

// ─── Explain prompt (Groq only explains pre-selected picks) ──────────────────

function buildExplainPrompt(
  picks: AlgoPick[],
  statsMap: Map<string, MatchStats>,
  isOptimized: boolean,
  riskLevel?: 'safe' | 'balanced' | 'risky',
): { system: string; user: string } {
  const riskContext = riskLevel === 'safe'
    ? 'COUPON SÉCURISÉ — insiste sur la solidité des favoris et la faible exposition.'
    : riskLevel === 'risky'
    ? 'COUPON RISQUÉ — insiste sur le potentiel de gain élevé et les opportunités value bet.'
    : 'COUPON ÉQUILIBRÉ — mets en avant le rapport risque/rendement optimal.';

  const system = `Tu es AlgoPronos AI, analyste sportif pro spécialisé Paris sportifs Afrique de l'Ouest.
Les sélections ont DÉJÀ été choisies par l'algorithme AlgoPronos. TON RÔLE: les expliquer avec conviction et expertise.

RÈGLES ABSOLUES:
- Ne JAMAIS modifier ni contredire les sélections fournies.
- SI LA SÉLECTION DÉSIGNE UNE ÉQUIPE (ex: "1" ou "2"), TU DOIS L'EXPLIQUER COMME ÉTANT LA SEULE ISSUE POSSIBLE.
- INTERDICTION ABSOLUE de parler des forces de l'équipe adverse si cela affaiblit la sélection.
- Langage journalistique naturel — jamais robotique ni générique.
- 2-3 phrases par match MAXIMUM — concis, précis, percutant.
- Cite la forme, le contexte (derby, enjeux, fatigue, avantage terrain), les statistiques fournies.
- ${isOptimized ? '⚡ Mets en avant les VALUE BETS identifiés (avantage modèle vs bookmaker)' : 'Explique la logique algorithmique de façon accessible.'}
- INTERDITS: "les statistiques indiquent", "les cotes suggèrent", "il est difficile de prédire".
- INTERDIT ABSOLU: citer un pourcentage de probabilité dans l'analyse (ex: "probabilité de 60%", "60% de chances"). Utilise des qualificatifs: "favori solide", "large avantage", "légère supériorité", "match ouvert".
- INTERDIT ABSOLU: mentionner un classement, une position (ex: "1er", "16e", "en bas de tableau") ou un écart de points que tu n'as PAS reçu explicitement dans les données ci-dessous. Si tu n'as pas les données de classement, N'EN PARLE PAS.
- ${riskContext}
- Tu réponds EXCLUSIVEMENT en JSON valide. Zéro texte avant ou après.`;

  const matchesText = picks.map((p, i) => {
    const stats = statsMap.get(p.matchId);
    // Determine the selected team name for clarity
    const selectedTeam = p.selection.type === 'MATCH_WINNER'
      ? (p.selection.value === '1' ? p.homeTeam : p.selection.value === '2' ? p.awayTeam : 'Match nul')
      : p.selection.value;
    const lines = [
      `Match ${i + 1}: ${p.homeTeam} vs ${p.awayTeam} (${p.league})`,
      `  ► Sélection CONFIRMÉE: "${p.selection.value}" = ${selectedTeam} @ ${p.selection.odds} [${p.selection.type}]`,
      `  ⚠️ Tu dois UNIQUEMENT justifier pourquoi "${selectedTeam}" est la bonne issue. N'explique JAMAIS pourquoi l'autre équipe gagnerait.`,
      `  [données internes — NE PAS CITER] Cote implicite bk.: ${p.selection.impliedPct}% | Écart valeur: ${(p.selection.valueEdge ?? 0) > 0 ? '+' + p.selection.valueEdge + '%' : 'nul'}`,
    ];
    if (p.selection.modelPct !== null) {
      lines.push(`  Prob. modèle AlgoPronos: ${p.selection.modelPct}% ${p.selection.modelPct > p.selection.impliedPct ? '(supérieure au marché ✓)' : ''}`);
      if ((p.selection.valueEdge ?? 0) > 0) {
        lines.push(`  ⚡ VALUE BET DÉTECTÉ: +${p.selection.valueEdge}% d'avantage vs bookmaker`);
      }
    }
    if (stats?.homeForm) {
      const homeGoalDiff = (stats.homeForm.goalsFor - stats.homeForm.goalsAgainst).toFixed(1);
      lines.push(`  ${p.homeTeam}: forme ${stats.homeForm.form} | ${stats.homeForm.goalsFor} buts/m | diff ${homeGoalDiff}`);
    }
    if (stats?.awayForm) {
      const awayGoalDiff = (stats.awayForm.goalsFor - stats.awayForm.goalsAgainst).toFixed(1);
      lines.push(`  ${p.awayTeam}: forme ${stats.awayForm.form} | ${stats.awayForm.goalsFor} buts/m | diff ${awayGoalDiff}`);
    }
    // Only include API advice if it supports the selected outcome — otherwise omit it to avoid contradiction
    if (stats?.advice) {
      const adviceLower = stats.advice.toLowerCase();
      const selectedLower = selectedTeam.toLowerCase();
      const supportsSelection = adviceLower.includes(selectedLower.split(' ')[0]) || adviceLower.includes('draw') || adviceLower.includes('nul');
      if (supportsSelection) {
        lines.push(`  Contexte: "${stats.advice}"`);
      }
    }
    return lines.join('\n');
  }).join('\n\n');

  const totalOdds = Math.round(picks.reduce((acc, p) => acc * p.selection.odds, 1) * 100) / 100;
  const riskLabel = riskLevel === 'safe' ? 'SÉCURISÉ' : riskLevel === 'risky' ? 'RISQUÉ' : 'ÉQUILIBRÉ';

  // Risk-specific summary instructions with concrete guidance
  const summaryInstruction = riskLevel === 'safe'
    ? `2 phrases: cite au moins 1 équipe ou ligue concrète. Insiste sur la FIABILITÉ des favoris et les cotes basses sécurisées (cote totale: ${totalOdds}).`
    : riskLevel === 'risky'
    ? `2 phrases: cite au moins 1 équipe ou ligue concrète. Insiste sur le POTENTIEL DE GAIN ÉLEVÉ et les cotes généreuses choisies (cote totale: ${totalOdds}). Mentionne l'aspect value bet.`
    : `2 phrases: cite au moins 1 équipe ou ligue concrète. Mets en avant le RAPPORT RISQUE/RENDEMENT optimal et les value bets détectés (cote totale: ${totalOdds}).`;

  const keyFactorsInstruction = picks.map((p, i) =>
    `facteur spécifique au match ${i + 1} (${p.homeTeam} vs ${p.awayTeam})`
  ).concat([`raison du profil ${riskLabel}`]).slice(0, 3);

  const analysesSchema = picks.map(p =>
    `{"matchId": "${p.matchId}", "reasoning": "2-3 phrases SPÉCIFIQUES à ce match qui justifient la sélection CONFIRMÉE. Cite forme, stats ou contexte."}`
  ).join(',\n    ');

  const user = `Analyse ce coupon ${riskLabel} de ${picks.length} sélections (cote totale: ${totalOdds}).

${matchesText}

RÉPONDS UNIQUEMENT avec ce JSON valide:
{
  "analyses": [
    ${analysesSchema}
  ],
  "summary": "${summaryInstruction}",
  "keyFactors": ["${keyFactorsInstruction[0]}", "${keyFactorsInstruction[1] || 'facteur tactique déterminant'}", "${keyFactorsInstruction[2] || `profil ${riskLabel}`}"],
  "riskAssessment": "Le match le plus incertain est celui dont la probabilité implicite est la plus proche de 50% (données: ${picks.map(p => `${p.homeTeam} vs ${p.awayTeam}: ${p.selection.impliedPct}% impl.`).join(' | ')}). Identifie-le et explique son risque en 1 phrase basée UNIQUEMENT sur sa forme et ses cotes fournies. INTERDIT: inventer un classement ou citer un % de probabilité."
}`;

  return { system, user };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    version: '2.6', 
    timestamp: new Date().toISOString(),
    env: {
      oc: !!process.env.OPENCLAW_GATEWAY_URL,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // ── Identify user ──────────────────────────────────────────────────────────
    const user = await getCurrentUser();
    const anonymousCookieId = !user ? await getAnonymousSessionId() : null;
    const anonymousSession = anonymousCookieId ? await getCurrentAnonymousSession() : null;

    // Allow if authenticated OR has anonymous cookie (with or without DB session)
    if (!user && !anonymousCookieId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isVerified = user?.tier === 'verified';
    const isRegistered = !!user && !isVerified;
    // isVisitor = anonymous cookie present (with or without DB session)
    const isVisitor = !user && !!anonymousCookieId;

    // ── Quota check ────────────────────────────────────────────────────────────
    if (isVisitor) {
      // Visitor: 1 total trial, tracked by HttpOnly cookie
      const cookieStore = await cookies();
      const trialCookie = cookieStore.get('algopronos_v_trial');
      if (trialCookie) {
        if (anonymousSession) {
          await logAnonymousEvent(anonymousSession.id, 'generation_attempted', {
            blocked: true, reason: 'TRIAL_USED',
          });
        }
        return NextResponse.json(
          {
            error: 'Trial already used',
            code: 'TRIAL_USED',
            isAnonymous: true,
            limit: 1,
            remaining: 0,
            message: 'Tu as déjà utilisé ton essai gratuit. Crée un compte AlgoPronos AI pour 2 analyses/jour ou un compte 1xBet optimisé IA pour un accès illimité.',
          },
          { status: 429 }
        );
      }
    } else if (isRegistered && user) {
      // Registered: 2 per day
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_coupon_count, last_coupon_date')
        .eq('id', user.id)
        .single();

      const currentCount = isNewDay(profile?.last_coupon_date) ? 0 : (profile?.daily_coupon_count ?? 0);

      if (currentCount >= DAILY_LIMIT_REGISTERED) {
        return NextResponse.json(
          {
            error: 'Daily limit reached',
            code: 'DAILY_LIMIT',
            limit: DAILY_LIMIT_REGISTERED,
            remaining: 0,
            message: 'Tu as atteint ta limite de 2 analyses IA par jour. Reviens demain ou active ton compte Full Access pour un accès illimité.',
          },
          { status: 429 }
        );
      }
    }

    // ── Parse & validate body ──────────────────────────────────────────────────
    const body = await request.json();
    const params: CombineParameters = body.parameters;

    if (!params.leagues || params.leagues.length === 0) {
      return NextResponse.json({ error: 'At least one league is required' }, { status: 400 });
    }

    const minMatches = params.betType === 'single' ? 1
      : params.betType === 'double' ? 2
      : params.betType === 'triple' ? 3 : 4;

    if (!params.selectedMatches || params.selectedMatches.length < minMatches) {
      return NextResponse.json(
        { error: `Select at least ${minMatches} match(es) for ${params.betType}` },
        { status: 400 }
      );
    }

    // ── Cache lookup (Redis L1 → Supabase L2) ─────────────────────────────────
    const cacheKey    = generateCacheKey(params);
    const redisCacheKey = buildCombineCacheKey(cacheKey);

    // L1: Redis (sub-millisecond, zero DB round-trip)
    const redisCached = await cacheGet<Record<string, unknown>>(redisCacheKey);
    if (redisCached) {
      console.log(`[generate] Redis cache HIT ${cacheKey}`);

      // Update Supabase usage_count asynchronously (fire-and-forget)
      void Promise.resolve(
        supabase
          .from('generated_combines')
          .update({ usage_count: ((redisCached.usage_count as number) ?? 0) + 1 })
          .eq('cache_key', cacheKey)
      ).catch(() => {});

      if (isVisitor && anonymousSession) {
        logAnonymousEvent(anonymousSession.id, 'generation_attempted', { fromCache: true, cacheLayer: 'redis' });
      } else if (user) {
        if (!isVerified) {
          const { data: profile } = await supabase
            .from('profiles').select('daily_coupon_count, last_coupon_date').eq('id', user.id).single();
          const currentCount = isNewDay(profile?.last_coupon_date) ? 0 : (profile?.daily_coupon_count ?? 0);
          const today = getTodayDate();
          void Promise.resolve(
            supabase.from('profiles').update({
              daily_coupon_count: currentCount + 1, last_coupon_date: today,
            }).eq('id', user.id)
          ).catch(() => {});
        }
        void Promise.resolve(
          adminSupabase.from('combine_usage_log').insert({
            user_id: user.id, combine_id: redisCached.id,
            usage_type: 'from_cache', user_tier: user.tier,
          })
        ).catch(() => {});
      }

      const dailyUsage = buildDailyUsage(isVerified, 1);
      return NextResponse.json({ combine: redisCached, fromCache: true, cacheLayer: 'redis', dailyUsage });
    }

    // L2: Supabase (warm cache, handles concurrent cold-starts)
    const { data: cachedCombine } = await supabase
      .from('generated_combines')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedCombine) {
      // Backfill Redis so the next request is served at L1
      cacheSet(redisCacheKey, cachedCombine, CACHE_TTL.COMBINE).catch(() => {});

      // Increment usage count
      await supabase
        .from('generated_combines')
        .update({ usage_count: cachedCombine.usage_count + 1 })
        .eq('id', cachedCombine.id);

      // Log & increment daily count
      if (isVisitor && anonymousSession) {
        await logAnonymousEvent(anonymousSession.id, 'generation_attempted', { fromCache: true });
      } else if (user) {
        if (!isVerified) {
          const { data: profile } = await supabase
            .from('profiles').select('daily_coupon_count, last_coupon_date').eq('id', user.id).single();
          const currentCount = isNewDay(profile?.last_coupon_date) ? 0 : (profile?.daily_coupon_count ?? 0);
          const today = getTodayDate();
          await supabase.from('profiles').update({
            daily_coupon_count: currentCount + 1,
            last_coupon_date: today,
          }).eq('id', user.id);
        }
        await adminSupabase.from('combine_usage_log').insert({
          user_id: user.id, combine_id: cachedCombine.id,
          usage_type: 'from_cache', user_tier: user.tier,
        });
      }

      const dailyUsage = buildDailyUsage(isVerified, 1);
      return NextResponse.json({ combine: cachedCombine, fromCache: true, dailyUsage });
    }

    // ── Prepare match data ─────────────────────────────────────────────────────
    const matchesForAnalysis = params.selectedMatches.map(m => ({
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      league: m.league,
      country: m.country,
      date: m.date,
      time: m.time,
      // Cotes réelles du frontend (The Odds API) — null si indisponibles
      odds: isValidOdds(m.odds) ? m.odds! : null,
    }));

    // ── Fetch real stats for selected matches (API-Football predictions) ───────
    // Only fetches for apif-* fixture IDs, falls back gracefully if no API key
    const footballApiKey = process.env.API_FOOTBALL_KEY;
    const statsMap = await fetchStatsForMatches(matchesForAnalysis, footballApiKey)
      .catch(err => {
        console.error('[stats-service] Error fetching stats:', err);
        return new Map();
      });

    const statsCount = Array.from(statsMap.values()).filter(s => s.dataSource === 'api-football').length;
    console.log(`[stats-service] Real stats fetched for ${statsCount}/${matchesForAnalysis.length} matches`);

    // ── Visitor: deterministic picks only (no AI cost) ──────────────────────────
    let finalMatches: object[];
    let analysis: object;
    let totalOdds = 1.0;
    let probability = 50;

    if (isVisitor) {
      const algorithmPicks = pickBestMarkets(matchesForAnalysis, params.riskLevel, statsMap, params.oddsRange);

      if (algorithmPicks.length > 0) {
        totalOdds = Math.round(algorithmPicks.reduce((acc, p) => {
          const o = Number(p.selection.odds);
          return acc * (isNaN(o) || o < 1 ? 1 : o);
        }, 1.0) * 100) / 100;
        const avgProb = algorithmPicks.reduce((acc, p) => {
          const pct = (p.selection.modelPct && p.selection.modelPct > 0) ? p.selection.modelPct : p.selection.impliedPct;
          return acc + (isNaN(pct) || pct <= 0 ? 50 : pct);
        }, 0) / algorithmPicks.length;
        probability = Math.round(avgProb);
      }

      if (isNaN(totalOdds) || totalOdds < 1) totalOdds = 1.0;
      if (isNaN(probability) || probability <= 0) probability = 50;

      finalMatches = algorithmPicks.map(p => ({
        matchId: p.matchId,
        homeTeam: p.homeTeam,
        awayTeam: p.awayTeam,
        league: p.league,
        kickoffTime: p.kickoffTime,
        selection: {
          type: p.selection.type,
          value: p.selection.value,
          odds: Number(p.selection.odds) || 1.0,
          reasoning: null,
          impliedPct: p.selection.impliedPct,
          valueEdge: p.selection.valueEdge,
        },
      }));
      analysis = { visitor: true };

    } else {
      // Registered/verified: Venice AI selects AND explains picks
      console.log(`[generate] Calling Venice AI for AI-driven pick selection (${params.riskLevel})...`);
      const veniceResult = await selectPicksWithVenice(matchesForAnalysis, statsMap, params);

      if (veniceResult) {
        // Venice AI succeeded — use AI picks directly
        finalMatches = veniceResult.finalMatches;
        analysis = veniceResult.analysis;
        totalOdds = veniceResult.totalOdds;
        probability = veniceResult.probability;
        console.log(`[generate] Venice AI picks OK — ${finalMatches.length} picks, total odds: ${totalOdds}`);
      } else {
        // Fallback: deterministic algorithm + AI explanation
        console.warn('[generate] Venice AI failed — falling back to deterministic algorithm + Venice explanation only');
        const algorithmPicks = pickBestMarkets(matchesForAnalysis, params.riskLevel, statsMap, params.oddsRange);

        if (algorithmPicks.length > 0) {
          totalOdds = Math.round(algorithmPicks.reduce((acc, p) => {
            const o = Number(p.selection.odds);
            return acc * (isNaN(o) || o < 1 ? 1 : o);
          }, 1.0) * 100) / 100;
          const avgProb = algorithmPicks.reduce((acc, p) => {
            const pct = (p.selection.modelPct && p.selection.modelPct > 0) ? p.selection.modelPct : p.selection.impliedPct;
            return acc + (isNaN(pct) || pct <= 0 ? 50 : pct);
          }, 0) / algorithmPicks.length;
          probability = Math.round(avgProb);
        }
        if (isNaN(totalOdds) || totalOdds < 1) totalOdds = 1.0;
        if (isNaN(probability) || probability <= 0) probability = 50;

        const useOptimized = isVerified;
        const maxTokens = Math.min(600 + algorithmPicks.length * (useOptimized ? 350 : 180), useOptimized ? 4000 : 2000);
        const { system, user: userMsg } = buildExplainPrompt(algorithmPicks, statsMap, useOptimized, params.riskLevel);
        const responseText = await callAI(system, userMsg, 'venice', maxTokens);

        let aiData: any = { analyses: [], summary: '', keyFactors: [], riskAssessment: '' };
        if (responseText.length > 10) {
          try {
            const stripped = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
            const jsonMatch = stripped.match(/\{[\s\S]*\}/);
            if (jsonMatch) aiData = JSON.parse(jsonMatch[0]);
          } catch {
            console.warn('[generate] Failed to parse Venice AI JSON');
          }
        }

        const analysesMap = new Map<string, string>(
          (aiData.analyses || []).map((a: { matchId: string; reasoning: string }) => [a.matchId, a.reasoning])
        );

        finalMatches = algorithmPicks.map(p => ({
          matchId: p.matchId,
          homeTeam: p.homeTeam,
          awayTeam: p.awayTeam,
          league: p.league,
          kickoffTime: p.kickoffTime,
          selection: {
            type: p.selection.type,
            value: p.selection.value,
            odds: Number(p.selection.odds) || 1.0,
            reasoning: analysesMap.get(p.matchId) || null,
            impliedPct: p.selection.impliedPct,
            modelPct: p.selection.modelPct,
            valueEdge: p.selection.valueEdge,
          },
        }));
        analysis = {
          summary: aiData.summary || '',
          keyFactors: aiData.keyFactors || [],
          riskAssessment: aiData.riskAssessment || '',
        };
      }
    }

    // ── Save to DB ─────────────────────────────────────────────────────────────
    const combineId = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h cache

    const generatedCombine = {
      id: combineId,
      cache_key: cacheKey,
      parameters: params,
      matches: finalMatches,
      total_odds: totalOdds,
      estimated_probability: probability,
      analysis,
      usage_count: 1,
      first_generated_by: user?.id || null,
      expires_at: expiresAt.toISOString(),
      status: 'pending' // Explicitly set status from migration 006
    };

    console.log('[generate] DB Payload:', JSON.stringify(generatedCombine, null, 2));

    // Delete any expired record with same cache_key to avoid UNIQUE constraint conflict
    await adminSupabase
      .from('generated_combines')
      .delete()
      .eq('cache_key', cacheKey)
      .lt('expires_at', new Date().toISOString());

    // Also evict stale Redis entry for this key (if any)
    cacheDel(redisCacheKey).catch(() => {});

    console.log(`[generate] Attempting UPSERT to generated_combines for cache_key: ${cacheKey}`);
    const { error: insertError } = await adminSupabase
      .from('generated_combines')
      .upsert(generatedCombine, { onConflict: 'cache_key' });

    if (insertError) {
      console.error('Failed to save combine to DB:', insertError);
      return NextResponse.json(
        { 
          error: 'Erreur lors de la sauvegarde du combiné [E_SAVE_V2].',
          diagnostic: insertError.message,
          code: insertError.code
        }, 
        { status: 500 }
      );
    }

    // Populate Redis L1 cache immediately after successful DB write
    cacheSet(redisCacheKey, generatedCombine, CACHE_TTL.COMBINE).catch(() => {});

    // ── Update daily count ─────────────────────────────────────────────────────
    let usedToday = 1;
    const today = getTodayDate();

    if (isVisitor && anonymousSession) {
      await logAnonymousEvent(anonymousSession.id, 'generation_attempted', {
        combineId, fromCache: false,
      });
    } else if (user) {
      console.log(`[generate] Logging usage for user: ${user.id}`);
      const { error: logError } = await adminSupabase.from('combine_usage_log').insert({
        user_id: user.id, 
        combine_id: combineId,
        usage_type: 'generated', 
        user_tier: user.tier || 'verified', // Fallback to 'verified' to avoid NOT NULL error
      });
      if (logError) console.error('[generate] combine_usage_log insert error:', logError);
      if (!isVerified) {
        const { data: profile } = await supabase
          .from('profiles').select('daily_coupon_count, last_coupon_date').eq('id', user.id).single();
        const currentCount = isNewDay(profile?.last_coupon_date) ? 0 : (profile?.daily_coupon_count ?? 0);
        usedToday = currentCount + 1;
        await supabase.from('profiles').update({
          daily_coupon_count: usedToday,
          last_coupon_date: today,
        }).eq('id', user.id);
      }
    }

    // Set HttpOnly trial cookie for visitors after successful generation
    const jsonResponse = NextResponse.json({
      combine: generatedCombine,
      fromCache: false,
      isVisitor,
      dailyUsage: buildDailyUsage(isVerified, usedToday),
    });

    if (isVisitor) {
      jsonResponse.cookies.set('algopronos_v_trial', '1', {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
      });
    }

    return jsonResponse;

  } catch (error) {
    console.error('Error generating combine:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildDailyUsage(isVerified: boolean, used: number) {
  if (isVerified) {
    return { used, limit: null, remaining: null }; // unlimited
  }
  return {
    used,
    limit: DAILY_LIMIT_REGISTERED,
    remaining: Math.max(0, DAILY_LIMIT_REGISTERED - used),
  };
}
