// GET /api/analyze/[matchId]
//
// Performs a full 6-signal analysis for a single match and returns structured
// data + AI-generated reasoning.  Results are cached in Redis for 12 hours so
// that a second user requesting the same match gets an instant response at
// zero additional LLM cost.
//
// Query parameters:
//   homeTeam   string   Home team name
//   awayTeam   string   Away team name
//   league     string   Competition name
//   date       string   Match date (YYYY-MM-DD or ISO)
//   riskLevel  string   "safe" | "balanced" | "risky"  (default: "balanced")
//   oddsHome   number   Home win odds
//   oddsDraw   number   Draw odds
//   oddsAway   number   Away win odds

import { NextRequest, NextResponse } from 'next/server';
import { fetchMatchStats } from '@/lib/services/stats-service';
import { analyzeMatch, type RiskLevel } from '@/lib/services/analysis-engine';

const VALID_RISK_LEVELS = new Set<string>(['safe', 'balanced', 'risky']);

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } },
) {
  try {
    const { matchId } = params;
    const sp = request.nextUrl.searchParams;

    // ── Parse query params ────────────────────────────────────────────────
    const homeTeam  = sp.get('homeTeam')  || 'Équipe Domicile';
    const awayTeam  = sp.get('awayTeam')  || 'Équipe Extérieur';
    const league    = sp.get('league')    || 'Compétition inconnue';
    const date      = sp.get('date')      || new Date().toISOString().split('T')[0];
    const riskLevel = (sp.get('riskLevel') || 'balanced') as RiskLevel;

    if (!VALID_RISK_LEVELS.has(riskLevel)) {
      return NextResponse.json(
        { error: 'riskLevel must be "safe", "balanced" or "risky"' },
        { status: 400 },
      );
    }

    const oddsHome = parseFloat(sp.get('oddsHome') || '2.0');
    const oddsDraw = parseFloat(sp.get('oddsDraw') || '3.5');
    const oddsAway = parseFloat(sp.get('oddsAway') || '4.0');

    if ([oddsHome, oddsDraw, oddsAway].some(o => isNaN(o) || o < 1.01)) {
      return NextResponse.json(
        { error: 'oddsHome / oddsDraw / oddsAway must be numbers ≥ 1.01' },
        { status: 400 },
      );
    }

    const currentOdds = { home: oddsHome, draw: oddsDraw, away: oddsAway };

    // ── Fetch match stats from API-Football (uses own cache in stats-service)
    const footballApiKey = process.env.API_FOOTBALL_KEY;
    const stats = await fetchMatchStats(
      matchId, homeTeam, awayTeam, currentOdds, footballApiKey,
    ).catch(err => {
      console.error('[analyze] fetchMatchStats error:', err);
      return null;
    });

    if (!stats) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les statistiques du match.' },
        { status: 502 },
      );
    }

    // ── Run the 6-signal analysis engine (Redis-cached) ───────────────────
    const analysis = await analyzeMatch(
      matchId, homeTeam, awayTeam, league,
      date, currentOdds, riskLevel, stats,
    );

    return NextResponse.json({
      analysis,
      meta: {
        dataSource:  stats.dataSource,
        fromCache:   analysis.fromCache,
        generatedAt: analysis.generatedAt,
        cacheInfo:   analysis.fromCache
          ? 'Analyse servie depuis le cache Redis (0 appel LLM supplémentaire)'
          : 'Analyse fraîche générée et mise en cache pour 12h',
      },
    });

  } catch (error) {
    console.error('[analyze] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur interne lors de l\'analyse. Veuillez réessayer.' },
      { status: 500 },
    );
  }
}
