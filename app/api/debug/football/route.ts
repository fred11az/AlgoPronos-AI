/**
 * GET /api/debug/football?date=YYYY-MM-DD
 * Diagnostic: raw API-Football response to check key + data
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_API_KEY not set' }, { status: 500 });
  }

  const date = new URL(req.url).searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    // Test 1: fixtures for the date
    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${date}`,
      { headers: { 'x-apisports-key': apiKey } }
    );

    const fixturesData = await fixturesRes.json();

    const total = fixturesData.results ?? 0;
    const errors = fixturesData.errors ?? {};
    const sampleFixtures = (fixturesData.response ?? []).slice(0, 5).map((f: {
      fixture: { id: number; date: string };
      league: { id: number; name: string; country: string };
      teams: { home: { name: string }; away: { name: string } };
    }) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      league_id: f.league.id,
      league: f.league.name,
      country: f.league.country,
      home: f.teams.home.name,
      away: f.teams.away.name,
    }));

    // Test 2: account status
    const statusRes = await fetch(
      'https://v3.football.api-sports.io/status',
      { headers: { 'x-apisports-key': apiKey } }
    );
    const statusData = await statusRes.json();

    return NextResponse.json({
      api_key_preview: `${apiKey.slice(0, 6)}...`,
      account: statusData.response ?? statusData.errors,
      date_tested: date,
      total_fixtures_returned: total,
      api_errors: errors,
      sample_fixtures: sampleFixtures,
      all_league_ids: Array.from(new Set(
        (fixturesData.response ?? []).map((f: { league: { id: number } }) => f.league.id)
      )).slice(0, 30),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
