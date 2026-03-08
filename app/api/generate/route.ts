import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentAnonymousSession, getAnonymousSessionId, logAnonymousEvent } from '@/lib/anonymous';
import { fetchStatsForMatches, formatStatsForPrompt, type MatchStats } from '@/lib/services/stats-service';
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
const PROMPT_VERSION = 4;

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

function formatMatchesForPrompt(
  matches: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    country: string;
    date: string;
    time: string;
    odds: { home: number; draw: number; away: number };
  }[],
  statsMap?: Map<string, MatchStats>,
): string {
  return matches.map((m, i) => {
    const stats = statsMap?.get(m.id);
    // Use real Bet365 odds if available, otherwise use provided odds
    const odds = stats?.realOdds ?? m.odds;
    const dc1X = Math.round(odds.home * odds.draw / (odds.home + odds.draw) * 100) / 100;
    const dcX2 = Math.round(odds.draw * odds.away / (odds.draw + odds.away) * 100) / 100;

    const lines = [
      `MATCH ${i + 1}:`,
      `  matchId: "${m.id}"`,
      `  Championnat: ${m.league} (${m.country})`,
      `  Date/Heure: ${m.date} ${m.time}`,
      `  └─ DOMICILE: ${m.homeTeam}  →  Cote victoire "1" = ${odds.home}`,
      `  └─ EXTÉRIEUR: ${m.awayTeam}  →  Cote victoire "2" = ${odds.away}`,
      `  └─ NUL: Cote "X" = ${odds.draw}`,
      `  └─ Double Chance 1X (${m.homeTeam} gagne ou nul) = ${dc1X}`,
      `  └─ Double Chance X2 (nul ou ${m.awayTeam} gagne) = ${dcX2}`,
      `  RAPPEL: value "1" = ${m.homeTeam} gagne | value "X" = nul | value "2" = ${m.awayTeam} gagne`,
    ];

    if (stats) {
      lines.push(`  STATISTIQUES RÉELLES:`);
      lines.push(formatStatsForPrompt(stats));
    }

    return lines.join('\n');
  }).join('\n\n');
}

function buildMatchIdList(matches: { id: string; homeTeam: string; awayTeam: string }[]): string {
  return matches.map((m, i) =>
    `  - Match ${i + 1} → matchId OBLIGATOIRE: "${m.id}" (${m.homeTeam} vs ${m.awayTeam})`
  ).join('\n');
}

function getJsonSchema(tier: 'free' | 'optimized', matchCount: number): string {
  const extraMarkets = tier === 'optimized' ? ' | BTTS Oui | BTTS Non | Handicap -1 | Handicap +1' : '';

  return `RÉPONDS UNIQUEMENT AVEC CE JSON VALIDE — aucun texte avant ou après, aucun markdown:
{
  "selectedMatches": [
    {
      "matchId": "STRING — id exact de MATCHIDS OBLIGATOIRES",
      "homeTeam": "STRING — nom exact copié des données",
      "awayTeam": "STRING — nom exact copié des données",
      "league": "STRING — championnat exact copié des données",
      "kickoffTime": "STRING — date et heure du match",
      "selection": {
        "type": "STRING — 1X2 | Over/Under | Double Chance${extraMarkets}",
        "value": "STRING — 1 | X | 2 | Over 2.5 | Under 2.5 | 1X | X2${extraMarkets}",
        "odds": NUMBER — cote décimale exacte du résultat choisi,
        "reasoning": "STRING — explication avec noms d'équipes et cotes numériques"
      }
    }
  ],
  "totalOdds": NUMBER — produit multiplié de toutes les odds,
  "probability": NUMBER — estimation % du billet entier,
  "analysis": {
    "summary": "STRING — résumé de la logique du billet",
    "keyFactors": ["STRING — facteur 1", "STRING — facteur 2"],
    "matchAnalyses": [
      {
        "matchId": "STRING — id exact du match",
        "tacticalAnalysis": "STRING — analyse tactique",
        "formAnalysis": "STRING — analyse de forme",
        "keyPlayers": "STRING — joueurs clés ou Non disponible",
        "prediction": "STRING — prédiction avec nom d'équipe",
        "confidenceLevel": NUMBER — entre 38 et 88
      }
    ],
    "riskAssessment": "STRING — évaluation des risques"
  }
}

RÈGLES DE CONTENU — chaque champ STRING doit contenir du vrai texte, pas des mots génériques:
- reasoning: cite le nom exact des équipes + les cotes numériques. Ex: "Villarreal (cote 1.35) est largement favori face à Elche (cote 7.50). L'écart de 6.15 indique une domination attendue."
- summary: 2 phrases décrivant la logique réelle du billet. Ex: "Ce triplé mise sur trois favoris nets avec des cotes entre 1.35 et 2.49. Le risque principal est le match St. Pauli (cote 2.49, 40% de probabilité implicite)."
- keyFactors: facteurs observés dans les vraies données. Ex: "Écart de cote Villarreal/Elche = 6.15 → favori très net"
- tacticalAnalysis: observation basée sur la position des cotes. Ex: "Villarreal à domicile à 1.35 vs Elche à 7.50 indique un favori quasi certain."
- formAnalysis: inférence logique. Ex: "Une cote aussi basse suggère une forme domicile solide et un adversaire affaibli."
- prediction: phrase directe avec nom d'équipe. Ex: "Villarreal devrait s'imposer à domicile."
- riskAssessment: identifie le maillon faible. Ex: "Le billet dépend du match AS Roma (cote 3.18 = 31% de probabilité), le plus risqué des trois."
- confidenceLevel: calcule depuis la cote choisie. Cote 1.40→80, 1.70→72, 2.00→62, 2.50→50, 3.00→42, 3.50→38

RÈGLES TECHNIQUES:
1. selectedMatches: EXACTEMENT ${matchCount} objets, chaque matchId UNIQUE
2. matchIds: exactement ceux de MATCHIDS OBLIGATOIRES, rien d'autre
3. odds: si value="1" → cote home | si value="X" → cote draw | si value="2" → cote away
4. totalOdds: calcule toi-même le produit (ex: 1.35 × 2.49 × 3.18 = 10.69)
5. Ne jamais inventer une cote absente des données`;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

type MatchInput = Parameters<typeof formatMatchesForPrompt>[0];

function buildFreePrompt(
  params: CombineParameters,
  matches: MatchInput,
  statsMap?: Map<string, MatchStats>,
): { system: string; user: string } {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  const hasRealStats = statsMap && Array.from(statsMap.values()).some(s => s.dataSource === 'api-football');

  const system = `Tu es AlgoPronos AI, un assistant d'analyse de paris sportifs rigoureux.
${hasRealStats
    ? 'Tu as accès à des STATISTIQUES RÉELLES (API-Football) pour chaque match. Tes prédictions DOIVENT être basées sur ces données.'
    : 'Tu génères des pronostics basés sur les cotes bookmaker. Tu n\'inventes aucune statistique.'}
Cote basse = forte probabilité implicite (1.40 ≈ 71%). Cote haute = faible probabilité (5.00 ≈ 20%).
RÈGLE ABSOLUE: "1" = victoire DOMICILE | "X" = nul | "2" = victoire EXTÉRIEUR.
Si value="1" → odds = cote home. Si "X" → odds = cote draw. Si "2" → odds = cote away.
Tu réponds EXCLUSIVEMENT en JSON valide. Zéro texte, zéro markdown en dehors.`;

  const user = `Génère un ${betLabel} — MODE DÉCOUVERTE.

${getRiskStrategy(params.riskLevel)}

MATCHIDS OBLIGATOIRES (un par match, sans doublon):
${buildMatchIdList(matches)}

DONNÉES DES MATCHS${hasRealStats ? ' + STATISTIQUES RÉELLES API-Football' : ''}:
${formatMatchesForPrompt(matches, statsMap)}

${hasRealStats ? `INSTRUCTIONS: Utilise les probabilités statistiques et value bets fournis pour justifier chaque sélection.
Le reasoning DOIT citer les chiffres de probabilité (ex: "L'API donne 68% à [équipe]").` : ''}
Marchés autorisés: 1X2, Over 2.5, Under 2.5, Double Chance.
Fourchette cotes totale: ${params.oddsRange.min} – ${params.oddsRange.max}. UN pari par match.

${getJsonSchema('free', matches.length)}`;

  return { system, user };
}

function buildOptimizedPrompt(
  params: CombineParameters,
  matches: MatchInput,
  statsMap?: Map<string, MatchStats>,
): { system: string; user: string } {
  const betLabel = params.betType === 'single' ? 'pari simple' :
    params.betType === 'double' ? 'doublé' :
    params.betType === 'triple' ? 'triplé' :
    `combiné de ${matches.length} matchs`;

  const hasRealStats = statsMap && Array.from(statsMap.values()).some(s => s.dataSource === 'api-football');

  const system = `Tu es AlgoPronos AI Premium, conseiller en paris sportifs professionnel.
${hasRealStats
    ? 'Tu as accès à des STATISTIQUES RÉELLES API-Football: forme, buts attendus, probabilités statistiques, value bets. Ces données sont ta VÉRITÉ — ne les contredis jamais.'
    : 'Tu analyses les cotes comme un trader pour identifier la valeur.'}
Règles fondamentales:
1. Probabilité implicite cote C = 1/C×100%. Ex: 2.50 → 40%.
2. Value bet = probabilité modèle > probabilité implicite. Si écart >7% → VALUE BET FORT.
3. "1"=DOMICILE, "X"=nul, "2"=EXTÉRIEUR — sans exception.
4. odds réponse = cote exacte du résultat choisi.
Tu réponds EXCLUSIVEMENT en JSON valide. Zéro texte, zéro markdown.`;

  const user = `Génère un ${betLabel} — MODE PREMIUM (tous marchés).

${getRiskStrategy(params.riskLevel)}

MATCHIDS OBLIGATOIRES (un par match, sans doublon):
${buildMatchIdList(matches)}

DONNÉES DES MATCHS${hasRealStats ? ' + STATISTIQUES RÉELLES API-Football' : ''}:
${formatMatchesForPrompt(matches, statsMap)}

${hasRealStats ? `INSTRUCTIONS ANALYSE:
- UTILISE les probabilités statistiques pour justifier chaque choix
- VALUE BET FORT (>7%): priorise ce pari, explique l'écart modèle vs bookmaker
- Buts attendus > 3.0 → Over 2.5/3.5 candidats. Les deux équipes > 1.2 buts → BTTS candidat
- Domicile goalsFor > 2.0 ET défense extérieure faible → Handicap -1 domicile possible
- reasoning DOIT citer: probabilité statistique, cote, et calcul valeur si applicable
  Ex: "API-Football donne 67% à [équipe] vs 47% implicite (cote 2.10) → value +20%"` : '- Cite les cotes numériques dans chaque reasoning.'}
Marchés: 1X2, Over/Under (1.5/2.5/3.5), BTTS, Double Chance, Handicap.
Fourchette: ${params.oddsRange.min} – ${params.oddsRange.max}. UN pari par match.

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

    // ── Choose model & prompt based on tier ────────────────────────────────────
    const useOptimized = isVerified;
    const groqModel = useOptimized ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
    // Scale tokens: stats add ~200 tokens per match to the prompt
    const baseTokens = useOptimized ? 2000 : 900;
    const perMatchTokens = useOptimized ? 600 : 280;
    const maxTokens = Math.min(baseTokens + matchesForAnalysis.length * perMatchTokens, useOptimized ? 6000 : 3000);
    const { system, user: userMsg } = useOptimized
      ? buildOptimizedPrompt(params, matchesForAnalysis, statsMap)
      : buildFreePrompt(params, matchesForAnalysis, statsMap);

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
