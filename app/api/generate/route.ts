import { NextResponse } from 'next/server';
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

const WEEKLY_LIMITS = {
  visitor: 2,    // anonymous session
  registered: 3, // has AlgoPronos account but no 1xBet verification
  verified: 999, // 1xBet account verified → effectively unlimited
} as const;

// ─── Week helpers ─────────────────────────────────────────────────────────────

/** Returns the date (YYYY-MM-DD) of the Monday that started the current week */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().split('T')[0];
}

function isNewWeek(resetAt: string | null | undefined): boolean {
  if (!resetAt) return true;
  return resetAt < getWeekStart();
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

// ─── Groq call ($0 cost) ──────────────────────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,   // plus déterministe = moins d'hallucinations
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
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

// Odds min/max réels selon le niveau de risque (complète la plage choisie par l'user)
const RISK_ODDS_PROFILE = {
  safe:     { minOdds: 1.20, maxOdds: 2.00, targetOdds: 1.55 },
  balanced: { minOdds: 1.55, maxOdds: 3.50, targetOdds: 2.00 },
  risky:    { minOdds: 2.00, maxOdds: 8.00, targetOdds: 3.00 },
} as const;

function pickForMatch(
  match: { id: string; homeTeam: string; awayTeam: string; league: string; date: string; time: string; odds: { home: number; draw: number; away: number } },
  riskLevel: 'safe' | 'balanced' | 'risky',
  stats: MatchStats | undefined,
  oddsRange: { min: number; max: number },
): AlgoPick {
  const { home: ho, draw: dr, away: aw } = stats?.realOdds ?? match.odds;
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

  // Merge user odds range with risk profile: prend le range le plus restrictif
  const riskProfile = RISK_ODDS_PROFILE[riskLevel];
  const effectiveMin = Math.max(oddsRange.min, riskProfile.minOdds);
  const effectiveMax = Math.min(oddsRange.max, riskProfile.maxOdds);

  // Filtre par plage effective; si vide, fallback sur plage user, puis sur tout
  let pool = candidates.filter(c => c.odds >= effectiveMin && c.odds <= effectiveMax);
  if (pool.length === 0) pool = candidates.filter(c => c.odds >= oddsRange.min && c.odds <= oddsRange.max);
  if (pool.length === 0) pool = candidates;

  let best = pool[0];

  if (riskLevel === 'safe') {
    // Préférer les cotes basses (prob. haute), bonus Double Chance et value positive
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        -c.odds
        + (c.type === 'Double Chance' ? 0.5 : 0)        // forte préférence DC
        + ((c.valueEdge ?? 0) > 0 ? 0.3 : 0)
        - (c.odds > riskProfile.targetOdds ? 0.4 : 0);  // pénalise cotes trop hautes
      return score(b) > score(a) ? b : a;
    });
  } else if (riskLevel === 'balanced') {
    // Value edge positif prioritaire, puis cotes proches de 2.0
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        (c.valueEdge ?? 0) * 4
        - Math.abs(c.odds - riskProfile.targetOdds) * 0.8
        + (c.type === '1X2' ? 0.2 : 0);  // léger bonus 1X2 (plus lisible pour l'user)
      return score(b) > score(a) ? b : a;
    });
  } else {
    // Risky: maximiser value edge puis cotes hautes, exclure Double Chance (trop prudent)
    best = pool.reduce((a, b) => {
      const score = (c: PickCandidate) =>
        (c.valueEdge ?? 0) * 3
        + (c.odds > riskProfile.targetOdds ? c.odds * 0.5 : 0)
        - (c.type === 'Double Chance' ? 2.0 : 0);  // pénalise DC en mode risky
      return score(b) > score(a) ? b : a;
    });
  }

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
- Ne JAMAIS modifier ni contredire les sélections fournies
- Langage journalistique naturel — jamais robotique ni générique
- 2-3 phrases par match MAXIMUM — concis, précis, percutant
- Cite la forme, le contexte (derby, enjeux, fatigue, avantage terrain), les statistiques fournies
- ${isOptimized ? '⚡ Mets en avant les VALUE BETS identifiés (avantage modèle vs bookmaker)' : 'Explique la logique algorithmique de façon accessible'}
- INTERDITS: "les statistiques indiquent", "les cotes suggèrent", "il est difficile de prédire"
- ${riskContext}
- Tu réponds EXCLUSIVEMENT en JSON valide. Zéro texte avant ou après.`;

  const matchesText = picks.map((p, i) => {
    const stats = statsMap.get(p.matchId);
    const lines = [
      `Match ${i + 1}: ${p.homeTeam} vs ${p.awayTeam} (${p.league})`,
      `  ► Sélection CONFIRMÉE: "${p.selection.value}" @ ${p.selection.odds} [${p.selection.type}]`,
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
    if (stats?.advice) {
      lines.push(`  Analyse API-Football: "${stats.advice}"`);
    }
    return lines.join('\n');
  }).join('\n\n');

  const totalOdds = Math.round(picks.reduce((acc, p) => acc * p.selection.odds, 1) * 100) / 100;
  const riskLabel = riskLevel === 'safe' ? 'SÉCURISÉ' : riskLevel === 'risky' ? 'RISQUÉ' : 'ÉQUILIBRÉ';

  const analysesSchema = picks.map(p =>
    `{"matchId": "${p.matchId}", "reasoning": "2-3 phrases percutantes, journalistiques, spécifiques à CE match"}`
  ).join(',\n    ');

  const user = `Analyse ce coupon ${riskLabel} de ${picks.length} sélections (cote totale: ${totalOdds}).

${matchesText}

RÉPONDS UNIQUEMENT avec ce JSON valide:
{
  "analyses": [
    ${analysesSchema}
  ],
  "summary": "2 phrases max: logique globale du coupon + angle ${riskLabel}",
  "keyFactors": ["facteur décisif 1", "facteur décisif 2", "facteur décisif 3"],
  "riskAssessment": "Nomme le match le plus incertain et explique le risque en 1 phrase"
}`;

  return { system, user };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

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

    const weekStart = getWeekStart();
    const isVerified = user?.tier === 'verified';
    const isRegistered = !!user && !isVerified;
    // isVisitor = anonymous cookie present (with or without DB session)
    const isVisitor = !user && !!anonymousCookieId;

    const limit = isVerified ? WEEKLY_LIMITS.verified
      : isRegistered ? WEEKLY_LIMITS.registered
      : WEEKLY_LIMITS.visitor;

    // ── Weekly quota check ─────────────────────────────────────────────────────
    if (isVisitor && anonymousSession) {
      const meta = anonymousSession.metadata || {};
      const currentCount = isNewWeek(meta.weeklyAiResetAt) ? 0 : (meta.weeklyAiCount ?? 0);

      if (currentCount >= limit) {
        await logAnonymousEvent(anonymousSession.id, 'generation_attempted', {
          blocked: true, reason: 'WEEKLY_LIMIT', count: currentCount,
        });
        return NextResponse.json(
          {
            error: 'Weekly limit reached',
            code: 'WEEKLY_LIMIT',
            isAnonymous: true,
            limit,
            remaining: 0,
            message: 'Tu as atteint ta limite d\'analyses IA pour cette semaine. Crée un compte AlgoPronos AI pour 2 analyses/semaine ou un compte 1xBet optimisé IA pour un accès illimité.',
          },
          { status: 429 }
        );
      }
    } else if (isRegistered && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('weekly_ai_count, weekly_ai_reset_at')
        .eq('id', user.id)
        .single();

      const currentCount = isNewWeek(profile?.weekly_ai_reset_at) ? 0 : (profile?.weekly_ai_count ?? 0);

      if (currentCount >= limit) {
        return NextResponse.json(
          {
            error: 'Weekly limit reached',
            code: 'WEEKLY_LIMIT',
            limit,
            remaining: 0,
            message: 'Tu as atteint ta limite d\'analyses IA pour cette semaine. Crée un compte 1xBet optimisé IA pour un accès illimité.',
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
        const meta = anonymousSession.metadata || {};
        const currentCount = isNewWeek(meta.weeklyAiResetAt) ? 0 : (meta.weeklyAiCount ?? 0);
        void Promise.resolve(
          adminSupabase.from('anonymous_sessions').update({
            metadata: { ...meta, weeklyAiCount: currentCount + 1, weeklyAiResetAt: weekStart },
          }).eq('id', anonymousSession.id)
        ).catch(() => {});
        logAnonymousEvent(anonymousSession.id, 'generation_attempted', { fromCache: true, cacheLayer: 'redis' });
      } else if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('weekly_ai_count, weekly_ai_reset_at').eq('id', user.id).single();
        const currentCount = isNewWeek(profile?.weekly_ai_reset_at) ? 0 : (profile?.weekly_ai_count ?? 0);
        if (!isVerified) {
          void Promise.resolve(
            supabase.from('profiles').update({
              weekly_ai_count: currentCount + 1, weekly_ai_reset_at: weekStart,
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

      const weeklyUsage = buildWeeklyUsage(limit, 1);
      return NextResponse.json({ combine: redisCached, fromCache: true, cacheLayer: 'redis', weeklyUsage });
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

      // Log & increment weekly count
      if (isVisitor && anonymousSession) {
        const meta = anonymousSession.metadata || {};
        const currentCount = isNewWeek(meta.weeklyAiResetAt) ? 0 : (meta.weeklyAiCount ?? 0);
        await adminSupabase.from('anonymous_sessions').update({
          metadata: { ...meta, weeklyAiCount: currentCount + 1, weeklyAiResetAt: weekStart },
        }).eq('id', anonymousSession.id);
        await logAnonymousEvent(anonymousSession.id, 'generation_attempted', { fromCache: true });
      } else if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('weekly_ai_count, weekly_ai_reset_at').eq('id', user.id).single();
        const currentCount = isNewWeek(profile?.weekly_ai_reset_at) ? 0 : (profile?.weekly_ai_count ?? 0);
        if (!isVerified) {
          await supabase.from('profiles').update({
            weekly_ai_count: currentCount + 1,
            weekly_ai_reset_at: weekStart,
          }).eq('id', user.id);
        }
        await adminSupabase.from('combine_usage_log').insert({
          user_id: user.id, combine_id: cachedCombine.id,
          usage_type: 'from_cache', user_tier: user.tier,
        });
      }

      const weeklyUsage = buildWeeklyUsage(limit, 1);
      return NextResponse.json({ combine: cachedCombine, fromCache: true, weeklyUsage });
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
      odds: m.odds || { home: 1.5, draw: 3.5, away: 5.0 },
    }));

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

    // ── Build coupon (visitor = coupon only; user = Groq explanation) ───────────
    let finalMatches: object[];
    let totalOdds: number;
    let probability: number;
    let analysis: object;

    if (isVisitor) {
      // Visitor: return coupon without calling Groq (save quota + cost)
      const coupon = buildVisitorCoupon(algorithmPicks);
      finalMatches = coupon.selectedMatches;
      totalOdds = coupon.totalOdds;
      probability = coupon.probability;
      analysis = coupon.analysis;
    } else {
      // Registered/verified: Groq explains pre-selected picks
      const useOptimized = isVerified;
      const groqModel = useOptimized ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
      const maxTokens = Math.min(600 + algorithmPicks.length * (useOptimized ? 350 : 180), useOptimized ? 4000 : 2000);
      const { system, user: userMsg } = buildExplainPrompt(algorithmPicks, statsMap, useOptimized, params.riskLevel);

      const responseText = await callGroq(system, userMsg, groqModel, maxTokens);
      const stripped = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`Groq response not in expected format: ${responseText.substring(0, 200)}`);

      const groqAnalysis = JSON.parse(jsonMatch[0]);
      const analysesMap = new Map<string, string>(
        (groqAnalysis.analyses || []).map((a: { matchId: string; reasoning: string }) => [a.matchId, a.reasoning])
      );

      totalOdds = Math.round(algorithmPicks.reduce((acc, p) => acc * p.selection.odds, 1) * 100) / 100;
      probability = Math.round(algorithmPicks.reduce((acc, p) => acc * (p.selection.impliedPct / 100), 1) * 100);
      finalMatches = algorithmPicks.map(p => ({
        matchId: p.matchId,
        homeTeam: p.homeTeam,
        awayTeam: p.awayTeam,
        league: p.league,
        kickoffTime: p.kickoffTime,
        selection: {
          type: p.selection.type,
          value: p.selection.value,
          odds: p.selection.odds,
          reasoning: analysesMap.get(p.matchId) || null,
          // Données crédibilité (probability & value edge)
          impliedPct: p.selection.impliedPct,
          modelPct: p.selection.modelPct,
          valueEdge: p.selection.valueEdge,
        },
      }));
      analysis = {
        summary: groqAnalysis.summary || '',
        keyFactors: groqAnalysis.keyFactors || [],
        riskAssessment: groqAnalysis.riskAssessment || '',
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
    };

    // Delete any expired record with same cache_key to avoid UNIQUE constraint conflict
    await adminSupabase
      .from('generated_combines')
      .delete()
      .eq('cache_key', cacheKey)
      .lt('expires_at', new Date().toISOString());

    // Also evict stale Redis entry for this key (if any)
    cacheDel(redisCacheKey).catch(() => {});

    const { error: insertError } = await adminSupabase.from('generated_combines').insert(generatedCombine);
    if (insertError) {
      console.error('Failed to save combine to DB:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde du combiné. Veuillez réessayer.' }, { status: 500 });
    }

    // Populate Redis L1 cache immediately after successful DB write
    cacheSet(redisCacheKey, generatedCombine, CACHE_TTL.COMBINE).catch(() => {});

    // ── Update weekly count ────────────────────────────────────────────────────
    let usedThisWeek = 1;

    if (isVisitor && anonymousSession) {
      const meta = anonymousSession.metadata || {};
      const currentCount = isNewWeek(meta.weeklyAiResetAt) ? 0 : (meta.weeklyAiCount ?? 0);
      usedThisWeek = currentCount + 1;
      await adminSupabase.from('anonymous_sessions').update({
        metadata: { ...meta, weeklyAiCount: usedThisWeek, weeklyAiResetAt: weekStart },
      }).eq('id', anonymousSession.id);
      await logAnonymousEvent(anonymousSession.id, 'generation_attempted', {
        combineId, fromCache: false,
      });
    } else if (user) {
      await adminSupabase.from('combine_usage_log').insert({
        user_id: user.id, combine_id: combineId,
        usage_type: 'generated', user_tier: user.tier,
      });
      if (!isVerified) {
        const { data: profile } = await supabase
          .from('profiles').select('weekly_ai_count, weekly_ai_reset_at').eq('id', user.id).single();
        const currentCount = isNewWeek(profile?.weekly_ai_reset_at) ? 0 : (profile?.weekly_ai_count ?? 0);
        usedThisWeek = currentCount + 1;
        await supabase.from('profiles').update({
          weekly_ai_count: usedThisWeek,
          weekly_ai_reset_at: weekStart,
        }).eq('id', user.id);
      }
    }

    return NextResponse.json({
      combine: generatedCombine,
      fromCache: false,
      isVisitor,
      weeklyUsage: buildWeeklyUsage(limit, usedThisWeek),
    });

  } catch (error) {
    console.error('Error generating combine:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildWeeklyUsage(limit: number, used: number) {
  return {
    used,
    limit: limit >= 999 ? null : limit, // null = unlimited for verified users
    remaining: limit >= 999 ? null : Math.max(0, limit - used),
  };
}
