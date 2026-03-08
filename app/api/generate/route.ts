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

// Increment this when prompts change significantly — forces cache invalidation
const PROMPT_VERSION = 3;

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

// ─── Match formatter ──────────────────────────────────────────────────────────

function formatMatchesForPrompt(matches: {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  date: string;
  time: string;
  odds: { home: number; draw: number; away: number };
}[]): string {
  return matches.map((m, i) => `MATCH ${i + 1}:
  matchId: "${m.id}"
  Championnat: ${m.league} (${m.country})
  Date/Heure: ${m.date} ${m.time}
  └─ DOMICILE: ${m.homeTeam}  →  Cote victoire "1" = ${m.odds.home}
  └─ EXTÉRIEUR: ${m.awayTeam}  →  Cote victoire "2" = ${m.odds.away}
  └─ NUL: Cote "X" = ${m.odds.draw}
  └─ Double Chance 1X (${m.homeTeam} gagne ou nul) = ${Math.round(m.odds.home * m.odds.draw / (m.odds.home + m.odds.draw) * 100) / 100}
  └─ Double Chance X2 (nul ou ${m.awayTeam} gagne) = ${Math.round(m.odds.draw * m.odds.away / (m.odds.draw + m.odds.away) * 100) / 100}
  └─ Over 2.5 buts ≈ calcul bookmaker | Under 2.5 buts ≈ calcul bookmaker
  RAPPEL: value "1" = ${m.homeTeam} gagne | value "X" = nul | value "2" = ${m.awayTeam} gagne`).join('\n\n');
}

function buildMatchIdList(matches: { id: string; homeTeam: string; awayTeam: string }[]): string {
  return matches.map((m, i) =>
    `  - Match ${i + 1} → matchId OBLIGATOIRE: "${m.id}" (${m.homeTeam} vs ${m.awayTeam})`
  ).join('\n');
}

function getJsonSchema(tier: 'free' | 'optimized', matchCount: number): string {
  const matchExample = tier === 'free'
    ? `{
      "matchId": "<id exact du match — voir liste MATCHIDS OBLIGATOIRES>",
      "homeTeam": "<copie exacte du nom domicile>",
      "awayTeam": "<copie exacte du nom extérieur>",
      "league": "<copie exacte du championnat>",
      "kickoffTime": "<date> <heure>",
      "selection": {
        "type": "1X2",
        "value": "1",
        "odds": 1.75,
        "reasoning": "Phrase courte ex: Le marché donne 70% de chance à [ÉQUIPE] (cote 1.43) face à un adversaire coté à 6.50."
      }
    }`
    : `{
      "matchId": "<id exact du match — voir liste MATCHIDS OBLIGATOIRES>",
      "homeTeam": "<copie exacte du nom domicile>",
      "awayTeam": "<copie exacte du nom extérieur>",
      "league": "<copie exacte du championnat>",
      "kickoffTime": "<date> <heure>",
      "selection": {
        "type": "1X2",
        "value": "1",
        "odds": 1.75,
        "reasoning": "2-3 phrases. Ex: [ÉQUIPE] est nettement favori à domicile (cote 1.52 vs 5.20 extérieur). L'écart de cote de 3.68 indique une confiance élevée du marché. Ce choix colle avec notre stratégie équilibrée."
      }
    }`;

  const analysisExample = tier === 'free'
    ? `"summary": "Ce billet [type] vise [objectif clair]. [Phrase sur le profil de risque.]",
    "keyFactors": ["Favori net à domicile sur Match 1", "Marché offensif sur Match 2", "..."],
    "matchAnalyses": [
      {
        "matchId": "<id exact>",
        "tacticalAnalysis": "Une phrase concrète. Ex: L'écart de cote (1.35 vs 7.00) indique un favori net.",
        "formAnalysis": "Une phrase. Ex: Le marché n'a pas bougé, signal de stabilité.",
        "keyPlayers": "Non disponible en mode découverte",
        "prediction": "Une phrase directe. Ex: [ÉQUIPE DOMICILE] devrait s'imposer.",
        "confidenceLevel": 78
      }
    ],
    "riskAssessment": "Risque [niveau]: [raison concrète]. Principale menace: [scénario d'échec]"`
    : `"summary": "Ce billet [type] est construit sur [logique]. [Argument value-bet]. [Avertissement honnête si risque élevé].",
    "keyFactors": ["Valeur identifiée sur [équipe] Match 1 (cote X vs probabilité Y)", "Marché Over/Under justifié car..."],
    "matchAnalyses": [
      {
        "matchId": "<id exact>",
        "tacticalAnalysis": "2-3 phrases avec cotes citées explicitement.",
        "formAnalysis": "2 phrases. Inférence depuis les cotes et logique football.",
        "keyPlayers": "Joueurs connus si pertinents, sinon 'Données non disponibles'",
        "prediction": "Prédiction argumentée avec les cotes. Ex: Avec une cote de 1.65, le marché donne 60% de chance à [ÉQUIPE].",
        "confidenceLevel": 68
      }
    ],
    "riskAssessment": "2 phrases honnêtes. Cite le principal risque de chaque sélection. Ex: Le Match 2 est le maillon faible (cote 2.80 = seul. 36% de probabilité implicite)."`;

  return `FORMAT JSON STRICT — RÉPONDS UNIQUEMENT AVEC CE JSON (zéro texte avant ou après, zéro markdown):
{
  "selectedMatches": [
    ${matchExample}
    // ... répète pour chaque match — EXACTEMENT ${matchCount} entrées
  ],
  "totalOdds": 3.20,
  "probability": 55,
  "analysis": {
    ${analysisExample}
  }
}

RÈGLES CRITIQUES — VIOLATION = RÉPONSE INVALIDE:
1. selectedMatches doit contenir EXACTEMENT ${matchCount} objets — ni plus ni moins
2. Chaque matchId doit être UNIQUE — UN seul pari par match physique, JAMAIS deux fois le même
3. Les matchIds DOIVENT être exactement ceux listés dans MATCHIDS OBLIGATOIRES
4. odds = cote exacte du résultat choisi (ex: si value="2", alors odds = cote "away" du match)
5. Si value="1" → odds = cote home. Si value="X" → odds = cote draw. Si value="2" → odds = cote away
6. totalOdds = multiplication de toutes les odds (ex: 1.75 × 2.10 = 3.68)
7. Ne jamais inventer une cote — utilise uniquement les cotes fournies dans les données match
8. reasoning doit citer le NOM des équipes concernées, pas juste "l'équipe"`;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildFreePrompt(params: CombineParameters, matches: Parameters<typeof formatMatchesForPrompt>[0]): {
  system: string;
  user: string;
} {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  const system = `Tu es AlgoPronos AI, un assistant d'analyse de paris sportifs rigoureux.
Tu génères des pronostics basés UNIQUEMENT sur les cotes bookmaker fournies. Tu n'inventes aucune statistique.
Une cote basse = forte probabilité implicite selon le marché (ex: cote 1.40 ≈ 71% de probabilité).
Une cote haute = faible probabilité implicite (ex: cote 5.00 ≈ 20% de probabilité).

RÈGLE D'OR: Dans "1X2", le "1" désigne TOUJOURS la victoire de l'équipe à DOMICILE (homeTeam),
"X" le nul, et "2" la victoire de l'équipe à l'EXTÉRIEUR (awayTeam).

Tu réponds EXCLUSIVEMENT en JSON valide. Aucun texte, aucun markdown, aucune explication en dehors du JSON.`;

  const user = `Génère un ${betLabel} — MODE DÉCOUVERTE (marchés simples uniquement).

${getRiskStrategy(params.riskLevel)}

MATCHIDS OBLIGATOIRES — tu dois utiliser exactement ces ids, un par match, sans doublon:
${buildMatchIdList(matches)}

DONNÉES COMPLÈTES DES MATCHS:
${formatMatchesForPrompt(matches)}

CONTRAINTES:
- Marchés autorisés: 1X2 (valeurs: "1", "X" ou "2"), Over 2.5, Under 2.5, Double Chance ("1X" ou "X2")
- Fourchette de cotes totale visée: ${params.oddsRange.min} – ${params.oddsRange.max}
- UN pari par match physique (matchId unique dans le tableau)

${getJsonSchema('free', matches.length)}`;

  return { system, user };
}

function buildOptimizedPrompt(params: CombineParameters, matches: Parameters<typeof formatMatchesForPrompt>[0]): {
  system: string;
  user: string;
} {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  const system = `Tu es AlgoPronos AI Premium, conseiller en paris sportifs professionnel.
Tu analyses chaque match comme un trader: tu lis les cotes, tu identifies la valeur, tu choisis le marché optimal.

RÈGLES FONDAMENTALES:
1. Probabilité implicite d'une cote C = 1/C × 100%. Ex: cote 2.50 = 40% de probabilité implicite.
2. "Value bet" = quand tu estimes la probabilité réelle supérieure à la probabilité implicite de la cote.
3. Dans "1X2": "1" = victoire DOMICILE (homeTeam), "X" = nul, "2" = victoire EXTÉRIEUR (awayTeam).
4. Si tu choisis value="1", le champ odds DOIT être la cote "home" du match. Idem pour X et 2.
5. Tu es honnête: pas de "victoire certaine", mais "le marché donne X% de chance à...".
6. Tu adaptes STRICTEMENT chaque sélection à la stratégie de risque demandée.

Tu réponds EXCLUSIVEMENT en JSON valide. Aucun texte, aucun markdown autour.`;

  const user = `Génère un ${betLabel} — MODE PREMIUM (tous marchés disponibles).

${getRiskStrategy(params.riskLevel)}

MATCHIDS OBLIGATOIRES — tu dois utiliser exactement ces ids, un par match, sans doublon:
${buildMatchIdList(matches)}

DONNÉES COMPLÈTES DES MATCHS:
${formatMatchesForPrompt(matches)}

CONTRAINTES:
- Marchés disponibles: 1X2, Over/Under (1.5/2.5/3.5), BTTS (Oui/Non), Double Chance, Handicap asiatique
- Fourchette de cotes totale visée: ${params.oddsRange.min} – ${params.oddsRange.max}
- UN pari par match physique (matchId unique dans le tableau)
- Chaque reasoning DOIT citer les cotes numériques et les noms d'équipes exacts

${getJsonSchema('optimized', matches.length)}`;

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
    // Scale tokens with match count to avoid truncation on accumulators
    const baseTokens = useOptimized ? 2000 : 900;
    const perMatchTokens = useOptimized ? 500 : 200;
    const maxTokens = Math.min(baseTokens + matchesForAnalysis.length * perMatchTokens, useOptimized ? 6000 : 2500);
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
