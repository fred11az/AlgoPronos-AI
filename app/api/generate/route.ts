import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAnonymousSession, getAnonymousSessionId, logAnonymousEvent } from '@/lib/anonymous';
import { fetchStatsForMatches, type MatchStats } from '@/lib/services/stats-service';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { cacheGet, cacheSet, cacheDel, buildCombineCacheKey, CACHE_TTL } from '@/lib/services/redis-cache';

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
const PROMPT_VERSION = 5;

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

// ─── AI Call Selector (Groq or OpenClaw) ──────────────────────────────────────
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number,
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const ocUrl = process.env.OPENCLAW_GATEWAY_URL;
  const ocToken = process.env.OPENCLAW_GATEWAY_TOKEN;

  // PRIORITY: Groq first (fast, reliable <5s), OpenClaw as fallback (slow local model)
  // OpenClaw is reserved for match SEARCH (in match-service.ts), not analysis here.
  async function tryGroq(): Promise<string> {
    if (!groqKey) throw new Error('No GROQ_API_KEY');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s max
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq error ${response.status}: ${err.substring(0, 100)}`);
      }
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Groq timeout (30s)');
      throw err;
    }
  }

  async function tryOpenClaw(): Promise<string> {
    if (!ocUrl) throw new Error('No OPENCLAW_GATEWAY_URL');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s max
    try {
      const response = await fetch(ocUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ocToken ? { 'Authorization': `Bearer ${ocToken}` } : {}),
        },
        body: JSON.stringify({
          model: 'openclaw',
          messages: [
            { role: 'system', content: systemPrompt + '\nIMPORTANT: All data is provided. DO NOT PERFORM ANY EXTERNAL SEARCH. Use only provided context.' },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenClaw error ${response.status}: ${err.substring(0, 100)}`);
      }
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('OpenClaw timeout (30s)');
      throw err;
    }
  }

  // Try Groq first, then OpenClaw, then give up gracefully
  if (groqKey) {
    try {
      console.log('[callAI] Trying Groq...');
      const result = await tryGroq();
      console.log('[callAI] Groq OK');
      return result;
    } catch (err: any) {
      console.warn('[callAI] Groq failed:', err.message, '— Trying OpenClaw fallback...');
    }
  }
  
  if (ocUrl) {
    try {
      console.log('[callAI] Trying OpenClaw...');
      const result = await tryOpenClaw();
      console.log('[callAI] OpenClaw OK');
      return result;
    } catch (err: any) {
      console.warn('[callAI] OpenClaw also failed:', err.message);
    }
  }

  // Both AI services failed — return empty to allow coupon without analysis
  console.error('[callAI] All AI services failed. Returning empty analysis.');
  return '';
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

// Odds min/max réels selon le niveau de risque — alignés avec les descriptions UI
const RISK_ODDS_PROFILE = {
  safe:     { minOdds: 1.10, maxOdds: 2.10, targetOdds: 1.55 },
  balanced: { minOdds: 1.80, maxOdds: 4.00, targetOdds: 2.30 },
  risky:    { minOdds: 3.00, maxOdds: 20.0, targetOdds: 5.00 },
} as const;

function isValidOdds(odds: any) {
  return odds && Number(odds.home) > 0 && Number(odds.draw) > 0 && Number(odds.away) > 0;
}

function generateRandomOdds(): { home: number; draw: number; away: number } {
  const home = 1.4 + Math.random() * 2.5;
  const draw = 2.8 + Math.random() * 1.8;
  const away = 2.0 + Math.random() * 4.0;
  return {
    home: Math.round(home * 100) / 100,
    draw: Math.round(draw * 100) / 100,
    away: Math.round(away * 100) / 100,
  };
}

function pickForMatch(
  match: { id: string; homeTeam: string; awayTeam: string; league: string; date: string; time: string; odds: { home: number; draw: number; away: number } },
  riskLevel: 'safe' | 'balanced' | 'risky',
  stats: MatchStats | undefined,
  oddsRange: { min: number; max: number },
): AlgoPick {
  const finalOdds = isValidOdds(stats?.realOdds) 
    ? stats!.realOdds!
    : (isValidOdds(match.odds) ? match.odds : generateRandomOdds());
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

  // Filtre basé uniquement sur le profil de risque backend (source de vérité)
  // On n'utilise plus oddsRange du front pour le filtrage afin d'éviter des plages trop restrictives
  const riskProfile = RISK_ODDS_PROFILE[riskLevel];

  let pool = candidates.filter(c => c.odds >= riskProfile.minOdds && c.odds <= riskProfile.maxOdds);
  // Fallback : si aucun candidat dans la plage, on prend tout (le scoring reste fidèle au niveau)
  if (pool.length === 0) pool = candidates;

  let best = pool[0];

  if (riskLevel === 'safe') {
    // Sécurisé : préférer les cotes basses (haute prob.), bonus Double Chance
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        -c.odds * 2                                     // cotes basses fortement favorisées
        + (c.type === 'Double Chance' ? 1.0 : 0)        // forte préférence DC
        + ((c.valueEdge ?? 0) > 0 ? 0.3 : 0)
        - (c.odds > riskProfile.targetOdds ? 1.0 : 0)
        + (Math.random() * 0.1); // Add slight variety
      return score(b) > score(a) ? b : a;
    });
  } else if (riskLevel === 'balanced') {
    // Équilibré : value edge positif + cotes proches de la cible
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        (c.valueEdge ?? 0) * 3
        - Math.abs(c.odds - riskProfile.targetOdds) * 1.2
        + (c.type === '1X2' ? 0.2 : 0);  // léger bonus 1X2 (plus lisible)
      return score(b) > score(a) ? b : a;
    });
  } else {
    // Risqué : cotes élevées en priorité absolue, value edge secondaire, Double Chance exclue
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        c.odds * 2.0                                    // priorité absolue : cotes hautes
        + (c.valueEdge ?? 0) * 0.4                     // value edge secondaire (poids réduit)
        - (c.type === 'Double Chance' ? 5.0 : 0);      // exclusion pratique du Double Chance
      return score(b) > score(a) ? b : a;
    });
  }

  if (pool.length === 0) {
    return {
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      kickoffTime: `${match.date} ${match.time}`.trim(),
      selection: {
        type: 'Double Chance',
        value: '1X',
        odds: computeDCOdds(ho, dr) || 1.25,
        impliedPct: 80,
        modelPct: null,
        valueEdge: null,
      },
    };
  }

  // Already assigned in the risk blocks above
  return {
    matchId: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
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
  matches: { id: string; homeTeam: string; awayTeam: string; league: string; date: string; time: string; odds: { home: number; draw: number; away: number } }[],
  riskLevel: 'safe' | 'balanced' | 'risky',
  statsMap: Map<string, MatchStats>,
  oddsRange: { min: number; max: number },
): AlgoPick[] {
  return matches.map(m => pickForMatch(m, riskLevel, statsMap.get(m.id), oddsRange));
}


// ─── Visitor coupon (no AI call) ─────────────────────────────────────────────

function buildVisitorCoupon(picks: AlgoPick[]): {
  selectedMatches: object[];
  totalOdds: number;
  probability: number;
  analysis: { visitor: true };
} {
  const totalOdds = Math.round(picks.reduce((acc, p) => acc * p.selection.odds, 1) * 100) / 100;
  const probability = Math.round(picks.reduce((acc, p) => acc * (p.selection.impliedPct / 100), 1) * 100);

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
      `  Prob. implicite bookmaker: ${p.selection.impliedPct}%`,
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
  "riskAssessment": "Nomme le match le plus incertain parmi ${picks.map(p => p.homeTeam + ' vs ' + p.awayTeam).join(', ')} et explique le risque en 1 phrase"
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
    const matchesForAnalysis = params.selectedMatches.map(m => {
      const o = isValidOdds(m.odds) ? m.odds! : generateRandomOdds();
      return {
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: m.league,
        country: m.country,
        date: m.date,
        time: m.time,
        odds: o as { home: number; draw: number; away: number },
      };
    });

    // ── Fetch real stats for selected matches (API-Football predictions) ───────
    // Only fetches for apif-* fixture IDs, falls back gracefully if no API key
    const footballApiKey = process.env.FOOTBALL_API_KEY;
    const statsMap = await fetchStatsForMatches(matchesForAnalysis, footballApiKey)
      .catch(err => {
        console.error('[stats-service] Error fetching stats:', err);
        return new Map();
      });

    const statsCount = Array.from(statsMap.values()).filter(s => s.dataSource === 'api-football').length;
    console.log(`[stats-service] Real stats fetched for ${statsCount}/${matchesForAnalysis.length} matches`);

    // ── Algorithm: deterministic pick selection ─────────────────────────────────
    const algorithmPicks = pickBestMarkets(
      matchesForAnalysis,
      params.riskLevel,
      statsMap,
      params.oddsRange,
    );

    // ── Safe totals calculation (Common for both Visitor and Member) ─────────────
    let totalOdds = 1.0;
    let probability = 50;

    if (algorithmPicks.length > 0) {
      totalOdds = algorithmPicks.reduce((acc, p) => {
        const o = Number(p.selection.odds);
        return acc * (isNaN(o) || o < 1 ? 1 : o);
      }, 1.0);
      
      const combinedProb = algorithmPicks.reduce((acc, p) => {
        const pr = Number(p.selection.impliedPct);
        return acc * (isNaN(pr) || pr <= 0 ? 0.5 : pr / 100);
      }, 1.0);
      
      totalOdds = Math.round(totalOdds * 100) / 100;
      probability = Math.round(combinedProb * 100);
    }

    // Safety final fallback
    if (isNaN(totalOdds) || totalOdds < 1) totalOdds = 1.0;
    if (isNaN(probability) || probability <= 0) probability = 1;

    // ── Build coupon ─────────────────────────────────────────────────────────────
    let finalMatches: object[];
    let analysis: object;

    if (isVisitor) {
      // Visitor: return coupon without calling Groq (save quota + cost)
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
      // Registered/verified: AI explains pre-selected picks
      const useOptimized = isVerified;
      const groqModel = useOptimized ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
      const maxTokens = Math.min(600 + algorithmPicks.length * (useOptimized ? 350 : 180), useOptimized ? 4000 : 2000);
      const { system, user: userMsg } = buildExplainPrompt(algorithmPicks, statsMap, useOptimized, params.riskLevel);

      console.log(`[generate] Calling AI (${groqModel}) for reasoning...`);
      const responseText = await callAI(system, userMsg, groqModel, maxTokens);
      console.log(`[generate] AI response received (${responseText.length} chars)`);
      
      // Graceful parse — if AI returned nothing or invalid JSON, build coupon without analysis
      let aiData: any = { analyses: [], summary: '', keyFactors: [], riskAssessment: '' };
      if (responseText.length > 10) {
        try {
          const stripped = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
          const jsonMatch = stripped.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiData = JSON.parse(jsonMatch[0]);
          } else {
            console.warn('[generate] Could not extract JSON from AI response. Using empty analysis.');
          }
        } catch (parseErr) {
          console.warn('[generate] Failed to parse AI JSON. Using empty analysis.', parseErr);
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
