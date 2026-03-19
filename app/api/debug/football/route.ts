/**
 * GET /api/debug/football?date=YYYY-MM-DD
 * Diagnostic: raw API-Football (RapidAPI) response to check key + data
 */
import { NextRequest, NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/services/api/footballApi';

export async function GET(req: NextRequest) {
  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY not set' }, { status: 500 });
  }

  const date = new URL(req.url).searchParams.get('date') || new Date().toISOString().split('T')[0];
  const apiDate = date.replace(/-/g, '');

  try {
    const fixturesData = await cachedFetch<any>('/football-get-matches-by-date', { date: apiDate }, 3600);

    const total = fixturesData?.response?.matches?.length ?? 0;
    const sampleFixtures = (fixturesData?.response?.matches ?? []).slice(0, 5).map((f: any) => ({
      id: f.id,
      time: f.time,
      home: f.home?.name,
      away: f.away?.name,
      leagueId: f.leagueId,
    }));

    return NextResponse.json({
      api_key_preview: process.env.RAPIDAPI_KEY.slice(0, 6) + '...',
      date_tested: date,
      total_fixtures_returned: total,
      sample_fixtures: sampleFixtures,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
