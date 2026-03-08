// Debug endpoint — vérifie que l'API-Football répond correctement
// Usage: GET /api/debug-stats?fixture=1035071
// Retire ce fichier en production une fois validé

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const fixtureId = request.nextUrl.searchParams.get('fixture');
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const result: Record<string, unknown> = {
    apiKeyPresent: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 6) + '...' : null,
    fixtureId,
    date,
  };

  if (!apiKey) {
    return NextResponse.json({ ...result, error: 'FOOTBALL_API_KEY manquante dans les variables d\'environnement' }, { status: 500 });
  }

  // ── Test 1: /status (vérifie que la clé est valide) ────────────────────────
  try {
    const statusRes = await fetch('https://v3.football.api-sports.io/status', {
      headers: { 'x-apisports-key': apiKey },
    });
    const statusData = await statusRes.json();
    result.apiStatus = {
      httpStatus: statusRes.status,
      account: statusData.response?.account,
      subscription: statusData.response?.subscription,
      requests: statusData.response?.requests,
    };
  } catch (e) {
    result.apiStatus = { error: String(e) };
  }

  // ── Test 2: /fixtures?date=... (matchs du jour) ────────────────────────────
  try {
    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${date}&league=78&season=2025`,
      { headers: { 'x-apisports-key': apiKey } }
    );
    const fixturesData = await fixturesRes.json();
    result.fixtures = {
      httpStatus: fixturesRes.status,
      totalResults: fixturesData.results,
      sample: fixturesData.response?.slice(0, 3).map((f: {
        fixture: { id: number; date: string };
        teams: { home: { name: string }; away: { name: string } };
        league: { name: string };
      }) => ({
        fixtureId: f.fixture.id,
        match: `${f.teams.home.name} vs ${f.teams.away.name}`,
        league: f.league.name,
        date: f.fixture.date,
      })),
    };
  } catch (e) {
    result.fixtures = { error: String(e) };
  }

  // ── Test 3: /predictions (si fixture fourni) ───────────────────────────────
  if (fixtureId) {
    try {
      const predRes = await fetch(
        `https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`,
        { headers: { 'x-apisports-key': apiKey } }
      );
      const predData = await predRes.json();
      const pred = predData.response?.[0];
      result.predictions = {
        httpStatus: predRes.status,
        totalResults: predData.results,
        winner: pred?.predictions?.winner?.name,
        percent: pred?.predictions?.percent,
        advice: pred?.predictions?.advice,
        goalsExpected: pred?.predictions?.goals,
        homeForm: pred?.teams?.home?.last_5?.form,
        awayForm: pred?.teams?.away?.last_5?.form,
        homeGoalsFor: pred?.teams?.home?.last_5?.goals?.for?.average,
        awayGoalsFor: pred?.teams?.away?.last_5?.goals?.for?.average,
      };
    } catch (e) {
      result.predictions = { error: String(e) };
    }

    // ── Test 4: /odds (si fixture fourni) ─────────────────────────────────────
    try {
      const oddsRes = await fetch(
        `https://v3.football.api-sports.io/odds?fixture=${fixtureId}&bookmaker=8&bet=1`,
        { headers: { 'x-apisports-key': apiKey } }
      );
      const oddsData = await oddsRes.json();
      const values = oddsData.response?.[0]?.bookmakers?.[0]?.bets?.[0]?.values;
      result.odds = {
        httpStatus: oddsRes.status,
        totalResults: oddsData.results,
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
