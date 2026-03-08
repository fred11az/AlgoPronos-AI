import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAnonymousSession, logAnonymousEvent } from '@/lib/anonymous';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

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
  visitor: 1,    // anonymous session
  registered: 2, // has AlgoPronos account but no 1xBet verification
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

function generateCacheKey(params: CombineParameters): string {
  const normalized = {
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

async function callGroq(prompt: string, model: string, maxTokens: number): Promise<string> {
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
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
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

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildFreePrompt(params: CombineParameters, matches: object[]): string {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  return `Tu es AlgoPronos AI en mode découverte. Génère un ${betLabel} court et simple.

MATCHS:
${JSON.stringify(matches)}

PARAMÈTRES: risque=${params.riskLevel}, cotes visées=${params.oddsRange.min}-${params.oddsRange.max}

RÈGLES:
- 1 à 2 types de paris simples uniquement (1X2 ou Over/Under basique)
- Analyse courte: 1 phrase max par match
- Pas de combinés complexes ni de stratégie de mise
- Rappelle en fin de summary que l'accès complet est disponible avec un compte 1xBet optimisé IA

FORMAT JSON STRICT (rien d'autre):
{
  "selectedMatches": [
    {
      "matchId": "id",
      "homeTeam": "Équipe dom",
      "awayTeam": "Équipe ext",
      "league": "Championnat",
      "kickoffTime": "YYYY-MM-DD HH:MM",
      "selection": {
        "type": "1X2|Over/Under",
        "value": "1|X|2|Over 2.5|Under 2.5",
        "odds": 1.75,
        "reasoning": "1 phrase"
      }
    }
  ],
  "totalOdds": 3.20,
  "probability": 65,
  "analysis": {
    "summary": "Résumé court (2 phrases). Avec un compte 1xBet optimisé IA, accède à des analyses avancées.",
    "keyFactors": ["facteur 1", "facteur 2"],
    "matchAnalyses": [
      {
        "matchId": "id",
        "tacticalAnalysis": "1 phrase",
        "formAnalysis": "1 phrase",
        "keyPlayers": "noms",
        "prediction": "1 phrase",
        "confidenceLevel": 70
      }
    ],
    "riskAssessment": "1 phrase"
  }
}`;
}

function buildOptimizedPrompt(params: CombineParameters, matches: object[]): string {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  return `Tu es AlgoPronos AI en mode optimisé IA. L'utilisateur possède un compte 1xBet optimisé IA.
Génère un ${betLabel} avec une analyse complète et des marchés avancés si pertinents.

MATCHS À ANALYSER:
${JSON.stringify(matches, null, 2)}

PARAMÈTRES:
- Type: ${betLabel}
- Risque: ${params.riskLevel === 'safe' ? 'Prudent (cotes 1.2-2.0)' : params.riskLevel === 'balanced' ? 'Équilibré (cotes 2.0-4.0)' : 'Risqué (cotes 4.0+)'}
- Fourchette: ${params.oddsRange.min} - ${params.oddsRange.max}

OBJECTIFS:
- Analyse approfondie (forme, confrontations directes, contexte)
- Marchés avancés autorisés: handicaps, buteurs, multi-buts, BTTS
- Stratégie de mise si pertinent (ex: mise à valeur sur outsider)
- Tu parles comme un conseiller rationnel, pas comme un vendeur de rêve
- Mentionne que ces marchés sont disponibles sur leur compte 1xBet optimisé IA

FORMAT JSON STRICT (rien d'autre):
{
  "selectedMatches": [
    {
      "matchId": "id",
      "homeTeam": "Équipe dom",
      "awayTeam": "Équipe ext",
      "league": "Championnat",
      "kickoffTime": "YYYY-MM-DD HH:MM",
      "selection": {
        "type": "1X2|Over/Under|BTTS|Handicap|Buteur",
        "value": "valeur précise",
        "odds": 1.85,
        "reasoning": "Raison du choix en 1-2 phrases avec données concrètes"
      }
    }
  ],
  "totalOdds": 8.50,
  "probability": 72,
  "analysis": {
    "summary": "Résumé global percutant (2-3 phrases)",
    "keyFactors": ["Facteur clé 1", "Facteur clé 2", "Facteur clé 3"],
    "matchAnalyses": [
      {
        "matchId": "id",
        "tacticalAnalysis": "Analyse tactique approfondie (3-4 phrases)",
        "formAnalysis": "Analyse de forme (2-3 phrases)",
        "keyPlayers": "Joueurs clés à surveiller",
        "prediction": "Prédiction détaillée (2-3 phrases)",
        "confidenceLevel": 85
      }
    ],
    "riskAssessment": "Évaluation des risques (2-3 phrases)"
  }
}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // ── Identify user ──────────────────────────────────────────────────────────
    const user = await getCurrentUser();
    const anonymousSession = !user ? await getCurrentAnonymousSession() : null;

    if (!user && !anonymousSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weekStart = getWeekStart();
    const isVerified = user?.tier === 'verified';
    const isRegistered = !!user && !isVerified;
    const isVisitor = !user && !!anonymousSession;

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

    // ── Cache lookup ───────────────────────────────────────────────────────────
    const cacheKey = generateCacheKey(params);

    const { data: cachedCombine } = await supabase
      .from('generated_combines')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedCombine) {
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
        await supabase.from('combine_usage_log').insert({
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

    // ── Choose model & prompt based on tier ────────────────────────────────────
    // Verified users get full analysis with Groq 70b
    // Visitors and registered users get concise analysis with Groq 8b
    const useOptimized = isVerified;
    const groqModel = useOptimized ? 'llama-3.1-70b-versatile' : 'llama-3.1-8b-instant';
    const maxTokens = useOptimized ? 4096 : 1200;
    const prompt = useOptimized
      ? buildOptimizedPrompt(params, matchesForAnalysis)
      : buildFreePrompt(params, matchesForAnalysis);

    // ── Call Groq (0€) ─────────────────────────────────────────────────────────
    const responseText = await callGroq(prompt, groqModel, maxTokens);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Groq response not in expected JSON format');

    const groqResponse = JSON.parse(jsonMatch[0]);

    // ── Save to DB ─────────────────────────────────────────────────────────────
    const combineId = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h cache

    const generatedCombine = {
      id: combineId,
      cache_key: cacheKey,
      parameters: params,
      matches: groqResponse.selectedMatches,
      total_odds: groqResponse.totalOdds,
      estimated_probability: groqResponse.probability,
      analysis: groqResponse.analysis,
      usage_count: 1,
      first_generated_by: user?.id || null,
      expires_at: expiresAt.toISOString(),
    };

    await supabase.from('generated_combines').insert(generatedCombine);

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
      await supabase.from('combine_usage_log').insert({
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
      isOptimized: useOptimized,
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
