import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAnonymousSession, getAnonymousSessionId, logAnonymousEvent } from '@/lib/anonymous';
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

function getRiskStrategy(riskLevel: 'safe' | 'balanced' | 'risky'): string {
  switch (riskLevel) {
    case 'safe':
      return `STRATÉGIE PRUDENTE (risque minimum):
- Sélectionne UNIQUEMENT les paris avec une forte probabilité implicite (cote ≤ 1.80)
- Favorise les favoris nets: équipe à domicile avec cote < 1.70 OU écart de cote > 1.50 face à l'adversaire
- Types autorisés: 1X2 (vote 1 ou 2 seulement si cote < 1.80), Double Chance (1X ou X2), Under 2.5 (si les deux équipes ont une défense solide)
- ÉVITE ABSOLUMENT: les nuls (imprévisibles), les cotes > 2.00, les marchés exotiques
- Calibre confidenceLevel entre 72 et 88 selon la clarté de la cote
- Si une cote de favori est 1.30, confidence = 85%. Si 1.65, confidence = 74%
- totalOdds cible: 1.20 - 2.50 pour le billet complet
- probability globale: 65-80%`;

    case 'balanced':
      return `STRATÉGIE ÉQUILIBRÉE (rapport risque/gain optimal):
- Cherche la valeur (value bet): paris où la cote proposée semble supérieure à la probabilité réelle
- Cote cible par sélection: 1.70 - 3.00
- Types autorisés: 1X2 (toutes options), Over/Under 2.5, BTTS (Les deux équipes marquent)
- Logique de valeur: si un match est équilibré (cotes proches) mais une équipe a clairement l'avantage à domicile, c'est de la valeur
- Pour les Over 2.5: choisir si au moins une équipe marque beaucoup OU si les deux équipes ont une défense poreuse (cote de l'Over < 1.90)
- Pour BTTS: si les deux équipes marquent régulièrement (cote BTTS < 1.80)
- Calibre confidenceLevel entre 55 et 72
- totalOdds cible: 2.50 - 7.00
- probability globale: 45-65%`;

    case 'risky':
      return `STRATÉGIE RISQUÉE (maximiser le gain potentiel):
- Cherche les outsiders avec le meilleur potentiel de surprise
- Cote cible par sélection: 2.50 - 6.00 (ne sélectionne pas de cotes > 7.00, trop aléatoire)
- Types autorisés: tous (handicap, BTTS, Over 3.5, buteurs, double chance inversée)
- Logique outsider: choisir l'équipe extérieure si elle est en meilleure forme récente, ou si l'équipe à domicile est en crise
- Handicap asiatique: envisage si un favori net joue contre un outsider mais que la cote 1X2 est trop basse
- Over 3.5: uniquement si les deux équipes sont très offensives ET la défense est faible (cote Over 3.5 < 2.50)
- BTTS à cote élevée: si les deux équipes ont tendance à marquer mais aussi à encaisser
- Calibre confidenceLevel entre 38 et 58 (sois honnête sur le risque élevé)
- totalOdds cible: 5.00 - 30.00
- probability globale: 25-45%`;
  }
}

function getJsonSchema(tier: 'free' | 'optimized', betType: string, matchCount: number): string {
  const betLabel = betType === 'single' ? 'pari simple' :
    betType === 'double' ? 'doublé' :
    betType === 'triple' ? 'triplé' :
    `combiné de ${matchCount} matchs`;

  const matchSchema = tier === 'free'
    ? `{
      "matchId": "id exact du match fourni",
      "homeTeam": "nom exact",
      "awayTeam": "nom exact",
      "league": "championnat exact",
      "kickoffTime": "YYYY-MM-DD HH:MM",
      "selection": {
        "type": "1X2|Over/Under|Double Chance",
        "value": "1|X|2|Over 2.5|Under 2.5|1X|X2",
        "odds": 1.75,
        "reasoning": "1 phrase factuelle basée sur les cotes fournies"
      }
    }`
    : `{
      "matchId": "id exact du match fourni",
      "homeTeam": "nom exact",
      "awayTeam": "nom exact",
      "league": "championnat exact",
      "kickoffTime": "YYYY-MM-DD HH:MM",
      "selection": {
        "type": "1X2|Over/Under|BTTS|Double Chance|Handicap",
        "value": "valeur précise (ex: Over 2.5, BTTS Oui, Handicap -1)",
        "odds": 1.85,
        "reasoning": "2-3 phrases avec raisonnement basé sur les cotes et la logique de risque"
      }
    }`;

  const analysisSchema = tier === 'free'
    ? `"summary": "2 phrases max. Résume pourquoi ces paris sont sécurisés/intéressants. Mentionne qu'un compte 1xBet optimisé IA donne accès à des analyses complètes.",
    "keyFactors": ["facteur 1 tiré des cotes", "facteur 2"],
    "matchAnalyses": [
      {
        "matchId": "id",
        "tacticalAnalysis": "1 phrase",
        "formAnalysis": "1 phrase basée sur la position des cotes",
        "keyPlayers": "N/A (données non disponibles en mode découverte)",
        "prediction": "1 phrase claire",
        "confidenceLevel": 70
      }
    ],
    "riskAssessment": "1 phrase sur le niveau de risque global du billet"`
    : `"summary": "3-4 phrases percutantes expliquant la logique globale du billet",
    "keyFactors": ["Facteur 1 (ex: cote domicile attractive)", "Facteur 2", "Facteur 3"],
    "matchAnalyses": [
      {
        "matchId": "id",
        "tacticalAnalysis": "Analyse tactique basée sur les données disponibles (2-3 phrases)",
        "formAnalysis": "Analyse de forme inférée depuis les cotes (2 phrases)",
        "keyPlayers": "Joueurs clés pertinents si connus",
        "prediction": "Prédiction claire et argumentée (2 phrases)",
        "confidenceLevel": 75
      }
    ],
    "riskAssessment": "Évaluation honnête des risques (2 phrases). Mentionne les scénarios d'échec possibles."`;

  return `RÉPONDS UNIQUEMENT AVEC CE JSON (aucun texte avant ou après, aucun markdown):
{
  "selectedMatches": [${matchSchema}],
  "totalOdds": 3.20,
  "probability": 58,
  "analysis": {
    ${analysisSchema}
  }
}

RÈGLES ABSOLUES:
- matchId doit être l'id EXACT fourni dans les données
- odds dans selectedMatches doit être une des cotes fournies dans les données match (home/draw/away)
- Ne jamais inventer une cote qui n'existe pas dans les données
- totalOdds = produit de toutes les cotes sélectionnées (arrondi à 2 décimales)
- probability = estimation honnête en % du billet entier (pas par match)
- Si tu ne peux pas justifier un pari, ne le mets pas`;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildFreePrompt(params: CombineParameters, matches: object[]): {
  system: string;
  user: string;
} {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  const system = `Tu es AlgoPronos AI, un assistant d'analyse sportive rationnel et honnête.
Tu génères des pronostics basés sur les cotes bookmaker fournies.
Tu ne prétends JAMAIS avoir accès à des données en temps réel (blessures, compositions d'équipe) sauf si elles sont explicitement fournies.
Tu bases tes analyses sur la logique des cotes: une cote basse = forte probabilité implicite selon le marché.

IMPORTANT: Tu réponds TOUJOURS en JSON pur, jamais de texte ou de markdown autour.`;

  const user = `Génère un ${betLabel} (mode découverte - analyse simplifiée).

${getRiskStrategy(params.riskLevel)}

DONNÉES DES MATCHS:
${JSON.stringify(matches, null, 2)}

CONTRAINTES:
- Sélectionne EXACTEMENT ${matches.length} match(s) parmi ceux fournis
- Types de paris autorisés en mode découverte: 1X2, Over/Under 2.5, Double Chance uniquement
- Fourchette de cotes globale visée: ${params.oddsRange.min} - ${params.oddsRange.max}

${getJsonSchema('free', params.betType, matches.length)}`;

  return { system, user };
}

function buildOptimizedPrompt(params: CombineParameters, matches: object[]): {
  system: string;
  user: string;
} {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  const system = `Tu es AlgoPronos AI Premium, un conseiller en paris sportifs expert et rigoureux.
Tu analyses les matchs comme un professionnel: tu lis les cotes, tu identifies la valeur, tu choisis le marché le plus adapté au profil de risque.

PRINCIPES FONDAMENTAUX:
1. Les cotes bookmaker reflètent la probabilité du marché. Cote 2.00 = ~50% de probabilité implicite.
2. Une "value bet" existe quand tu penses que la probabilité réelle > probabilité implicite de la cote.
3. Tu ne prétends jamais avoir des infos secrètes. Tu raisonnes depuis les cotes et les logiques football.
4. Tu es honnête sur l'incertitude: tu ne dis pas "certaine victoire", tu dis "forte probabilité de".
5. Tu adaptes STRICTEMENT ta sélection au niveau de risque demandé.

IMPORTANT: Tu réponds TOUJOURS en JSON pur, jamais de texte ou de markdown autour.`;

  const user = `Génère un ${betLabel} optimisé pour un utilisateur compte 1xBet IA vérifié.

${getRiskStrategy(params.riskLevel)}

DONNÉES DES MATCHS (utilise ces cotes comme base d'analyse):
${JSON.stringify(matches, null, 2)}

CONTRAINTES:
- Sélectionne EXACTEMENT ${matches.length} match(s) parmi ceux fournis
- Tous types de marchés autorisés: 1X2, Over/Under, BTTS, Double Chance, Handicap
- Fourchette de cotes globale visée: ${params.oddsRange.min} - ${params.oddsRange.max}
- Chaque reasoning doit mentionner la cote choisie et pourquoi elle représente de la valeur selon la stratégie

${getJsonSchema('optimized', params.betType, matches.length)}`;

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
    const groqModel = useOptimized ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
    const maxTokens = useOptimized ? 4096 : 1500;
    const { system, user: userMsg } = useOptimized
      ? buildOptimizedPrompt(params, matchesForAnalysis)
      : buildFreePrompt(params, matchesForAnalysis);

    // ── Call Groq (0€) ─────────────────────────────────────────────────────────
    const responseText = await callGroq(system, userMsg, groqModel, maxTokens);

    // Strip markdown code blocks if present, then extract JSON object
    const stripped = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Groq response not in expected JSON format: ${responseText.substring(0, 200)}`);

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

    const { error: insertError } = await adminSupabase.from('generated_combines').insert(generatedCombine);
    if (insertError) console.error('Failed to save combine to DB:', insertError);

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
