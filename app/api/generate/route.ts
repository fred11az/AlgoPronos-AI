import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

// Generate cache key from parameters
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

  const str = JSON.stringify(normalized);
  const hash = createHash('sha256').update(str).digest('hex');
  return hash.substring(0, 16);
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

    // Validate match count based on bet type
    const minMatches = params.betType === 'single' ? 1 : params.betType === 'double' ? 2 : params.betType === 'triple' ? 3 : 4;

    if (params.matchCount < minMatches) {
      return NextResponse.json(
        { error: `At least ${minMatches} match(es) required for ${params.betType}` },
        { status: 400 }
      );
    }

    // Check if we have selected matches
    if (!params.selectedMatches || params.selectedMatches.length === 0) {
      return NextResponse.json(
        { error: 'No matches selected' },
        { status: 400 }
      );
    }

    if (params.selectedMatches.length < minMatches) {
      return NextResponse.json(
        { error: `Select at least ${minMatches} match(es) for ${params.betType}` },
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

    // Prepare match data for Claude
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

    // Determine bet type label
    const betTypeLabel = params.betType === 'single' ? 'pari simple' :
                         params.betType === 'double' ? 'doublé' :
                         params.betType === 'triple' ? 'triplé' :
                         `combiné de ${params.selectedMatches.length} matchs`;

    // Call Claude Sonnet for analysis
    const prompt = `Tu es AlgoPronos AI, l'analyste sportif le plus précis d'Afrique de l'Ouest.

# MISSION
Génère un ${betTypeLabel} optimal basé sur une analyse approfondie des ${params.selectedMatches.length} match(s) sélectionné(s) par l'utilisateur.

# MATCHS À ANALYSER
${JSON.stringify(matchesForAnalysis, null, 2)}

# PARAMÈTRES DU PARI
- Type de pari : ${betTypeLabel}
- Nombre de matchs : ${params.selectedMatches.length}
- Niveau de risque : ${params.riskLevel === 'safe' ? 'Prudent (cotes 1.2-2.0)' : params.riskLevel === 'balanced' ? 'Équilibré (cotes 2.0-4.0)' : 'Risqué (cotes 4.0+)'}
- Fourchette de cotes visée : ${params.oddsRange.min} - ${params.oddsRange.max}

# TON TRAVAIL
1. Analyse chaque match en profondeur
2. Pour chaque match, choisis le meilleur pronostic (1X2, Over/Under, etc.)
3. Fournis une analyse détaillée et professionnelle
4. Calcule la cote totale et la probabilité estimée

# FORMAT DE RÉPONSE (JSON STRICT)
{
  "selectedMatches": [
    {
      "matchId": "id du match",
      "homeTeam": "Équipe domicile",
      "awayTeam": "Équipe extérieur",
      "league": "Championnat",
      "kickoffTime": "Date et heure au format: 2025-01-15 20:00",
      "selection": {
        "type": "1X2|Over/Under|BTTS",
        "value": "1|X|2|Over 2.5|Under 2.5|Oui|Non",
        "odds": 1.85,
        "reasoning": "Raison du choix en 1-2 phrases"
      }
    }
  ],
  "totalOdds": 8.50,
  "probability": 72,
  "analysis": {
    "summary": "Résumé global du ${betTypeLabel} (2-3 phrases percutantes)",
    "keyFactors": [
      "Facteur clé 1",
      "Facteur clé 2",
      "Facteur clé 3"
    ],
    "matchAnalyses": [
      {
        "matchId": "id du match",
        "tacticalAnalysis": "Analyse tactique approfondie (3-4 phrases)",
        "formAnalysis": "Analyse de forme des équipes (2-3 phrases)",
        "keyPlayers": "Joueurs clés à surveiller",
        "prediction": "Prédiction détaillée (2-3 phrases)",
        "confidenceLevel": 85
      }
    ],
    "riskAssessment": "Évaluation des risques du ${betTypeLabel} (2-3 phrases)"
  }
}

# RÈGLES CRITIQUES
- Analyse TOUS les ${params.selectedMatches.length} match(s) fournis
- Sois PRÉCIS et PROFESSIONNEL dans tes analyses
- Utilise des données CONCRÈTES (forme récente, confrontations, etc.)
- La probabilité doit refléter le niveau de risque choisi
- Pour un pari simple, sois particulièrement approfondi dans l'analyse
- Si ${params.riskLevel} = 'safe', privilégie les favoris clairs
- Si ${params.riskLevel} = 'balanced', mix équilibré
- Si ${params.riskLevel} = 'risky', ose des pronostics audacieux

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
