// Debug endpoint — vérifie que l'API-Football (RapidAPI) répond correctement
// Usage: GET /api/debug-stats?fixture=1035071
// Retire ce fichier en production une fois validé

import { NextRequest, NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/services/api/footballApi';

export async function GET(request: NextRequest) {
  const fixtureId = request.nextUrl.searchParams.get('fixture');
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const result: Record<string, unknown> = {
    apiKeyPresent: !!process.env.RAPIDAPI_KEY,
    apiKeyPrefix: process.env.RAPIDAPI_KEY ? process.env.RAPIDAPI_KEY.substring(0, 6) + '...' : null,
    fixtureId,
    date,
  };

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ ...result, error: 'RAPIDAPI_KEY manquante dans les variables d\'environnement' }, { status: 500 });
  }

  // ── Test 1: /football-get-matches-by-date ─────────────────────────────────
  try {
    const apiDate = date.replace(/-/g, '');
    const fixturesData = await cachedFetch<any>('/football-get-matches-by-date', { date: apiDate }, 3600);
    result.fixtures = {
      status: fixturesData?.status,
      totalResults: fixturesData?.response?.matches?.length ?? 0,
      sample: (fixturesData?.response?.matches ?? []).slice(0, 5).map((f: any) => ({
        id: f.id,
        time: f.time,
        home: f.home?.name,
        away: f.away?.name,
        leagueId: f.leagueId,
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
