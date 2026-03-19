import { createClient, checkIsAdmin, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { matchService } from '@/lib/services/match-service';
import { createMatchSlug, createLeagueSlug, createTeamSlug } from '@/lib/utils/slugify';

// ─── Same deterministic prediction logic as /api/pronostics/generate ─────────

function impliedPct(odds: number): number {
  return Math.round((1 / odds) * 100);
}

function generateForm(): string {
  const outcomes = ['W', 'D', 'L'];
  return Array.from({ length: 5 }, () => outcomes[Math.floor(Math.random() * outcomes.length)]).join('');
}

function computePrediction(oddsHome: number, oddsDraw: number, oddsAway: number) {
  const totalInverse = 1 / oddsHome + 1 / oddsDraw + 1 / oddsAway;
  const homePct = Math.round((1 / oddsHome / totalInverse) * 100);
  const drawPct = Math.round((1 / oddsDraw / totalInverse) * 100);
  const awayPct = Math.round((1 / oddsAway / totalInverse) * 100);

  const modelHome = Math.min(homePct + 4, 85);
  const modelDraw = Math.max(drawPct - 2, 8);
  const modelAway = Math.max(awayPct - 2, 8);

  const candidates = [
    { label: 'Victoire domicile', type: 'home', odds: oddsHome, impliedP: impliedPct(oddsHome), modelP: modelHome },
    { label: 'Match nul', type: 'draw', odds: oddsDraw, impliedP: impliedPct(oddsDraw), modelP: modelDraw },
    { label: 'Victoire extérieure', type: 'away', odds: oddsAway, impliedP: impliedPct(oddsAway), modelP: modelAway },
  ];

  const best = candidates.reduce((a, b) =>
    (b.modelP - b.impliedP) > (a.modelP - a.impliedP) ? b : a
  );

  return {
    prediction: best.label,
    predictionType: best.type,
    probability: best.modelP,
    impliedPct: best.impliedP,
    valueEdge: best.modelP - best.impliedP,
    recommendedOdds: best.odds,
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Verify admin session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await checkIsAdmin(session.user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    console.log('[Admin Sync] Starting manual trigger...');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

    // 2. Clear existing cache FIRST so getMatchesForRange re-fetches from API (not stale cache)
    console.log('[Admin Sync] Clearing matches_cache for today + tomorrow');
    await adminSupabase.from('matches_cache').delete().in('date', [todayStr, tomorrowStr]);

    // 3. Fetch fresh matches (cache miss → API with odds, or Gemini parallel fallback)
    const results = await matchService.getMatchesForRange(todayStr, tomorrowStr);
    const allMatches = Object.values(results.byDate).flat();

    if (allMatches.length === 0) {
      return NextResponse.json({ error: 'No matches found from API' }, { status: 404 });
    }

    console.log(`[Admin Sync] Fetched ${allMatches.length} matches. Generating predictions...`);

    // 4. Generate predictions deterministically (no AI calls = no timeout risk)
    const predictionsToUpsert: any[] = [];
    for (const match of allMatches) {
      if (!match.odds) continue;

      const oddsHome = match.odds.home;
      const oddsDraw = match.odds.draw || 3.3;
      const oddsAway = match.odds.away;

      if (!oddsHome || !oddsAway) continue;

      const pred = computePrediction(oddsHome, oddsDraw, oddsAway);
      const homeForm = generateForm();
      const awayForm = generateForm();
      const slug = createMatchSlug(match.homeTeam, match.awayTeam, match.date);

      const matchDateTime = new Date(`${match.date}T${match.time || '15:00'}:00Z`);
      matchDateTime.setHours(matchDateTime.getHours() + 3);

      predictionsToUpsert.push({
        slug,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        home_team_slug: createTeamSlug(match.homeTeam),
        away_team_slug: createTeamSlug(match.awayTeam),
        league: match.league,
        league_code: match.leagueCode,
        league_slug: createLeagueSlug(match.league),
        country: match.country || '',
        match_date: match.date,
        match_time: match.time || '15:00',
        odds_home: oddsHome,
        odds_draw: oddsDraw,
        odds_away: oddsAway,
        prediction: pred.prediction,
        prediction_type: pred.predictionType,
        probability: pred.probability,
        implied_probability: pred.impliedPct,
        value_edge: pred.valueEdge,
        recommended_odds: pred.recommendedOdds,
        ai_analysis: null,
        home_form: homeForm,
        away_form: awayForm,
        expires_at: matchDateTime.toISOString(),
        sport: 'football',
      });
    }

    // 5. Upsert predictions in batches of 50 to avoid Supabase payload limits
    let seoCount = 0;
    const upsertErrors: string[] = [];
    const BATCH = 50;
    for (let i = 0; i < predictionsToUpsert.length; i += BATCH) {
      const chunk = predictionsToUpsert.slice(i, i + BATCH);
      const { error } = await adminSupabase
        .from('match_predictions')
        .upsert(chunk, { onConflict: 'slug' });
      if (error) {
        console.error('[Admin Sync] Upsert error:', error);
        upsertErrors.push(error.message);
      } else {
        seoCount += chunk.length;
      }
    }

    return NextResponse.json({
      status: upsertErrors.length === 0 ? 'ok' : 'partial',
      message: `Sync: ${allMatches.length} matchs trouvés, ${predictionsToUpsert.length} construits, ${seoCount} sauvés en DB.`,
      count: allMatches.length,
      built: predictionsToUpsert.length,
      seoPages: seoCount,
      errors: upsertErrors,
    });

  } catch (err: any) {
    console.error('[Admin Sync] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
