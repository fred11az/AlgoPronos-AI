/**
 * GET /api/debug/football?date=YYYY-MM-DD
 * Diagnostic: raw API-Football v3 response to check key + data
 *
 * Test en production:
 * https://algopronos.com/api/debug/football?date=2026-03-22
 */
import { NextRequest, NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/services/api/footballApi';

export async function GET(req: NextRequest) {
  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY not set' }, { status: 500 });
  }

  const date = new URL(req.url).searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const fixturesData = await cachedFetch<any>('/fixtures', { date }, 3600);

    const total = fixturesData?.response?.length ?? 0;
    const sampleFixtures = (fixturesData?.response ?? []).slice(0, 5).map((f: any) => ({
      id: f.fixture?.id,
      date: f.fixture?.date,
      status: f.fixture?.status?.short,
      home: f.teams?.home?.name,
      away: f.teams?.away?.name,
      league: f.league?.name,
      country: f.league?.country,
    }));

    return NextResponse.json({
      api_key_preview: process.env.API_FOOTBALL_KEY.slice(0, 6) + '...',
      date_tested: date,
      total_fixtures_returned: total,
      sample_fixtures: sampleFixtures,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
