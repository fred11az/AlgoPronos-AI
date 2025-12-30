import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CombineParameters {
  date: string | string[];
  leagues: string[];
  oddsRange: { min: number; max: number };
  matchCount: number;
  riskLevel: 'safe' | 'balanced' | 'risky';
}

// Generate cache key from parameters
function generateCacheKey(params: CombineParameters): string {
  const normalized = {
    date: Array.isArray(params.date)
      ? params.date.map((d) => new Date(d).toISOString().split('T')[0]).sort()
      : new Date(params.date).toISOString().split('T')[0],
    leagues: [...params.leagues].sort(),
    oddsMin: params.oddsRange.min,
    oddsMax: params.oddsRange.max,
    matchCount: params.matchCount,
    riskLevel: params.riskLevel,
  };

  const str = JSON.stringify(normalized);
  const hash = createHash('sha256').update(str).digest('hex');
  return hash.substring(0, 16);
}

// Mock match data (in production, this would come from a sports API)
function getMockMatches(leagues: string[]) {
  const allMatches = [
    {
      id: 'match_1',
      homeTeam: 'Manchester City',
      awayTeam: 'Liverpool',
      league: 'Premier League',
      leagueCode: 'PL',
      kickoffTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Etihad Stadium',
      homeForm: ['W', 'W', 'D', 'W', 'W'],
      awayForm: ['W', 'D', 'W', 'W', 'L'],
      odds: { home: 1.85, draw: 3.6, away: 4.2, over25: 1.65, under25: 2.2 },
    },
    {
      id: 'match_2',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      league: 'La Liga',
      leagueCode: 'LA',
      kickoffTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      venue: 'Santiago Bernabéu',
      homeForm: ['W', 'W', 'W', 'D', 'W'],
      awayForm: ['W', 'W', 'D', 'W', 'W'],
      odds: { home: 2.1, draw: 3.4, away: 3.5, over25: 1.55, under25: 2.4 },
    },
    {
      id: 'match_3',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      league: 'Bundesliga',
      leagueCode: 'BL',
      kickoffTime: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      venue: 'Allianz Arena',
      homeForm: ['W', 'W', 'W', 'W', 'D'],
      awayForm: ['W', 'D', 'W', 'L', 'W'],
      odds: { home: 1.6, draw: 4.0, away: 5.5, over25: 1.45, under25: 2.7 },
    },
    {
      id: 'match_4',
      homeTeam: 'Inter Milan',
      awayTeam: 'AC Milan',
      league: 'Serie A',
      leagueCode: 'SA',
      kickoffTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      venue: 'San Siro',
      homeForm: ['W', 'W', 'D', 'W', 'W'],
      awayForm: ['D', 'W', 'L', 'W', 'D'],
      odds: { home: 1.9, draw: 3.5, away: 4.0, over25: 1.7, under25: 2.1 },
    },
    {
      id: 'match_5',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      league: 'Ligue 1',
      leagueCode: 'FL',
      kickoffTime: new Date(Date.now() + 60 * 60 * 60 * 1000).toISOString(),
      venue: 'Parc des Princes',
      homeForm: ['W', 'W', 'W', 'W', 'W'],
      awayForm: ['W', 'D', 'W', 'D', 'L'],
      odds: { home: 1.45, draw: 4.5, away: 7.0, over25: 1.5, under25: 2.5 },
    },
    {
      id: 'match_6',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      league: 'Premier League',
      leagueCode: 'PL',
      kickoffTime: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
      venue: 'Emirates Stadium',
      homeForm: ['W', 'D', 'W', 'W', 'W'],
      awayForm: ['W', 'W', 'D', 'L', 'W'],
      odds: { home: 1.75, draw: 3.8, away: 4.5, over25: 1.6, under25: 2.3 },
    },
    {
      id: 'match_7',
      homeTeam: 'Senegal',
      awayTeam: 'Cameroon',
      league: 'CAN',
      leagueCode: 'CAN',
      kickoffTime: new Date(Date.now() + 84 * 60 * 60 * 1000).toISOString(),
      venue: 'Stade Abdoulaye Wade',
      homeForm: ['W', 'W', 'D', 'W', 'D'],
      awayForm: ['W', 'D', 'W', 'W', 'L'],
      odds: { home: 2.0, draw: 3.2, away: 3.8, over25: 1.85, under25: 1.95 },
    },
    {
      id: 'match_8',
      homeTeam: 'Atletico Madrid',
      awayTeam: 'Sevilla',
      league: 'La Liga',
      leagueCode: 'LA',
      kickoffTime: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(),
      venue: 'Wanda Metropolitano',
      homeForm: ['D', 'W', 'W', 'D', 'W'],
      awayForm: ['L', 'W', 'D', 'W', 'D'],
      odds: { home: 1.7, draw: 3.6, away: 5.0, over25: 1.9, under25: 1.9 },
    },
  ];

  return allMatches.filter((m) => leagues.includes(m.leagueCode));
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check tier
    if (!user.tier) {
      return NextResponse.json(
        { error: 'Subscription required', code: 'NO_TIER' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const params: CombineParameters = body.parameters;

    // Validate parameters
    if (!params.leagues || params.leagues.length === 0) {
      return NextResponse.json(
        { error: 'At least one league is required' },
        { status: 400 }
      );
    }

    if (params.matchCount < 2 || params.matchCount > 10) {
      return NextResponse.json(
        { error: 'Match count must be between 2 and 10' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = generateCacheKey(params);

    // Check cache first
    const supabase = await createClient();
    const { data: cachedCombine } = await supabase
      .from('generated_combines')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedCombine) {
      // Log cache hit
      await supabase.from('combine_usage_log').insert({
        user_id: user.id,
        combine_id: cachedCombine.id,
        usage_type: 'from_cache',
        user_tier: user.tier,
      });

      // Increment usage count
      await supabase
        .from('generated_combines')
        .update({ usage_count: cachedCombine.usage_count + 1 })
        .eq('id', cachedCombine.id);

      return NextResponse.json({
        combine: cachedCombine,
        fromCache: true,
      });
    }

    // Get available matches
    const availableMatches = getMockMatches(params.leagues);

    if (availableMatches.length < params.matchCount) {
      return NextResponse.json(
        {
          error: 'Not enough matches available',
          available: availableMatches.length,
          requested: params.matchCount,
        },
        { status: 400 }
      );
    }

    // Call Claude Sonnet for analysis
    const prompt = `Tu es AlgoPronos AI, l'analyste sportif le plus précis d'Afrique de l'Ouest.

# MISSION
Génère un combiné de paris sportifs optimal basé sur une analyse approfondie.

# DONNÉES FOURNIES
${availableMatches.length} matchs disponibles :

${JSON.stringify(availableMatches, null, 2)}

# PARAMÈTRES DU COMBINÉ
- Nombre de matchs à sélectionner : ${params.matchCount}
- Fourchette de cotes : ${params.oddsRange.min} - ${params.oddsRange.max}
- Niveau de risque : ${params.riskLevel}
- Championnats : ${params.leagues.join(', ')}

# TON TRAVAIL
1. Analyse chaque match en profondeur (statistiques, forme, etc.)
2. Sélectionne exactement ${params.matchCount} matchs
3. Choisis les paris les plus sûrs pour atteindre la fourchette de cotes
4. Fournis une analyse détaillée pour chaque match

# FORMAT DE RÉPONSE (JSON STRICT)
{
  "selectedMatches": [
    {
      "matchId": "match_id_ici",
      "homeTeam": "Nom équipe domicile",
      "awayTeam": "Nom équipe extérieur",
      "league": "Championnat",
      "kickoffTime": "ISO datetime",
      "selection": {
        "type": "1X2",
        "value": "1",
        "odds": 1.85,
        "reasoning": "Raison courte du choix (1 phrase)"
      }
    }
  ],
  "totalOdds": 8.50,
  "probability": 72,
  "analysis": {
    "summary": "Résumé global du combiné (2-3 phrases)",
    "keyFactors": [
      "Facteur clé 1",
      "Facteur clé 2",
      "Facteur clé 3"
    ],
    "matchAnalyses": [
      {
        "matchId": "match_id_ici",
        "tacticalAnalysis": "Analyse tactique approfondie (3-4 phrases)",
        "formAnalysis": "Analyse de forme des équipes (2-3 phrases)",
        "refereeImpact": "Impact de l'arbitre (1-2 phrases)",
        "keyPlayers": "Joueurs clés à surveiller (2-3 joueurs)",
        "prediction": "Prédiction détaillée du résultat (2-3 phrases)",
        "confidenceLevel": 85
      }
    ],
    "riskAssessment": "Évaluation globale des risques (2-3 phrases)"
  }
}

# RÈGLES CRITIQUES
- La cote totale DOIT être entre ${params.oddsRange.min} et ${params.oddsRange.max}
- Sois PRÉCIS et PROFESSIONNEL dans tes analyses
- Utilise des DONNÉES CONCRÈTES, pas de généralités
- Si ${params.riskLevel} = 'safe', privilégie cotes basses (1.5-2.5)
- Si ${params.riskLevel} = 'balanced', mix de cotes (1.8-3.5)
- Si ${params.riskLevel} = 'risky', cotes plus élevées acceptables (2.5+)

RÉPONDS UNIQUEMENT AVEC LE JSON, RIEN D'AUTRE.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude response not in expected JSON format');
    }

    const claudeResponse = JSON.parse(jsonMatch[0]);

    // Create combine record
    const combineId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const generatedCombine = {
      id: combineId,
      cache_key: cacheKey,
      parameters: params,
      matches: claudeResponse.selectedMatches,
      total_odds: claudeResponse.totalOdds,
      estimated_probability: claudeResponse.probability,
      analysis: claudeResponse.analysis,
      usage_count: 1,
      first_generated_by: user.id,
      expires_at: expiresAt.toISOString(),
    };

    // Save to database
    const { error: insertError } = await supabase
      .from('generated_combines')
      .insert(generatedCombine);

    if (insertError) {
      console.error('Error saving combine:', insertError);
    }

    // Log usage
    await supabase.from('combine_usage_log').insert({
      user_id: user.id,
      combine_id: combineId,
      usage_type: 'generated',
      user_tier: user.tier,
    });

    return NextResponse.json({
      combine: generatedCombine,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error generating combine:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
