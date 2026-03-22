// Debug endpoint — vérifie que l'API-Football v3 répond correctement
// Usage: GET /api/debug-stats?fixture=1035071
// Retire ce fichier en production une fois validé

import { NextRequest, NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/services/api/footballApi';

export async function GET(request: NextRequest) {
  const fixtureId = request.nextUrl.searchParams.get('fixture');
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const result: Record<string, unknown> = {
    apiKeyPresent: !!process.env.API_FOOTBALL_KEY,
    apiKeyPrefix: process.env.API_FOOTBALL_KEY ? process.env.API_FOOTBALL_KEY.substring(0, 6) + '...' : null,
    fixtureId,
    date,
  };

  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ ...result, error: 'API_FOOTBALL_KEY manquante dans les variables d\'environnement' }, { status: 500 });
  }

  // ── Test 1: /fixtures ─────────────────────────────────────────────────────
  try {
    const fixturesData = await cachedFetch<any>('/fixtures', { date }, 3600);
    result.fixtures = {
      totalResults: fixturesData?.response?.length ?? 0,
      sample: (fixturesData?.response ?? []).slice(0, 5).map((f: any) => ({
        id: f.fixture?.id,
        date: f.fixture?.date,
        status: f.fixture?.status?.short,
        home: f.teams?.home?.name,
        away: f.teams?.away?.name,
        league: f.league?.name,
        country: f.league?.country,
      })),
    };
  } catch (e) {
    result.fixtures = { error: String(e) };
  }

  // ── Test 2: /predictions (si fixture fourni) ──────────────────────────────
  if (fixtureId) {
    try {
      const predData = await cachedFetch<any>('/predictions', { fixture: fixtureId });
      const pred = predData?.response?.[0];
      result.predictions = {
        totalResults: predData?.results,
        winner: pred?.predictions?.winner?.name,
        percent: pred?.predictions?.percent,
        advice: pred?.predictions?.advice,
        goalsExpected: pred?.predictions?.goals,
        homeForm: pred?.teams?.home?.last_5?.form,
        awayForm: pred?.teams?.away?.last_5?.form,
      };
    } catch (e) {
      result.predictions = { error: String(e) };
    }

    // ── Test 3: /odds ─────────────────────────────────────────────────────────
    try {
      const oddsData = await cachedFetch<any>('/odds', { fixture: fixtureId, bookmaker: '8', bet: '1' });
      const values = oddsData?.response?.[0]?.bookmakers?.[0]?.bets?.[0]?.values;
      result.odds = {
        totalResults: oddsData?.results,
        home: values?.find((v: { value: string }) => v.value === 'Home')?.odd,
        draw: values?.find((v: { value: string }) => v.value === 'Draw')?.odd,
        away: values?.find((v: { value: string }) => v.value === 'Away')?.odd,
      };
    } catch (e) {
      result.odds = { error: String(e) };
    }
  }

  return NextResponse.json(result, { status: 200 });
}
