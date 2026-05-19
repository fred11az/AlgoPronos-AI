import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/diagnose
 * Teste API-Football + The Odds API et retourne un rapport complet.
 */
export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  const report: Record<string, any> = {
    date: today,
    timestamp: new Date().toISOString(),
    supabase_ref: supabaseRef,
  };

  // ── 1. API-Football ─────────────────────────────────────────────────────
  const apifKey = process.env.API_FOOTBALL_KEY;
  report.api_football = { key_present: !!apifKey, key_prefix: apifKey?.slice(0, 6) + '...' };

  if (apifKey) {
    try {
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
        headers: { 'x-apisports-key': apifKey },
      });
      const json = await res.json();
      report.api_football.http_status = res.status;
      report.api_football.remaining_requests = res.headers.get('x-ratelimit-requests-remaining');
      report.api_football.fixtures_count = json?.response?.length ?? 0;
      report.api_football.errors = json?.errors ?? null;
      report.api_football.sample = (json?.response ?? []).slice(0, 3).map((f: any) => ({
        id: f.fixture?.id,
        home: f.teams?.home?.name,
        away: f.teams?.away?.name,
        league: f.league?.name,
        date: f.fixture?.date,
      }));
    } catch (err: any) {
      report.api_football.error = err.message;
    }
  }

  // ── 2. The Odds API ────────────────────────────────────────────────────
  const oddsKey = process.env.THE_ODDS_API_KEY;
  report.the_odds_api = { key_present: !!oddsKey, key_prefix: oddsKey?.slice(0, 6) + '...' };

  if (oddsKey) {
    try {
      const url = new URL('https://api.the-odds-api.com/v4/sports/soccer_epl/odds/');
      url.searchParams.set('apiKey', oddsKey);
      url.searchParams.set('regions', 'eu');
      url.searchParams.set('markets', 'h2h');
      url.searchParams.set('oddsFormat', 'decimal');
      url.searchParams.set('commenceTimeFrom', `${today}T00:00:00Z`);
      url.searchParams.set('commenceTimeTo', `${today}T23:59:59Z`);

      const res = await fetch(url.toString());
      const json = await res.json();
      report.the_odds_api.http_status = res.status;
      report.the_odds_api.remaining_requests = res.headers.get('x-requests-remaining');
      report.the_odds_api.used_requests = res.headers.get('x-requests-used');
      report.the_odds_api.events_count = Array.isArray(json) ? json.length : 0;
      report.the_odds_api.sample = Array.isArray(json) ? json.slice(0, 3).map((e: any) => ({
        home: e.home_team,
        away: e.away_team,
        date: e.commence_time,
      })) : json;
    } catch (err: any) {
      report.the_odds_api.error = err.message;
    }
  }

  // ── 3. Venice AI ───────────────────────────────────────────────────────
  const veniceKey = process.env.VENICE_API_KEY;
  report.venice_ai = { key_present: !!veniceKey, key_prefix: veniceKey ? veniceKey.slice(0, 8) + '...' : null };

  if (veniceKey) {
    try {
      const res = await fetch('https://api.venice.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${veniceKey}` },
        signal: AbortSignal.timeout(8000),
      });
      report.venice_ai.http_status = res.status;
      report.venice_ai.ok = res.ok;
      if (res.ok) {
        const json = await res.json();
        report.venice_ai.models_available = Array.isArray(json?.data) ? json.data.length : 'unknown';
      }
    } catch (err: any) {
      report.venice_ai.error = err.message;
    }
  }

  // ── 4. Groq ─────────────────────────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  report.groq = { key_present: !!groqKey, key_prefix: groqKey ? groqKey.slice(0, 8) + '...' : null };

  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${groqKey}` },
        signal: AbortSignal.timeout(8000),
      });
      report.groq.http_status = res.status;
      report.groq.ok = res.ok;
    } catch (err: any) {
      report.groq.error = err.message;
    }
  }

  // ── 6. Cache DB ────────────────────────────────────────────────────────
  try {
    const supabase = createAdminClient();
    const { count: matchesCount } = await supabase
      .from('matches_cache').select('*', { count: 'exact', head: true }).eq('date', today);
    const { count: predsCount } = await supabase
      .from('match_predictions').select('*', { count: 'exact', head: true }).eq('match_date', today);
    const { data: tickets } = await supabase
      .from('daily_ticket').select('type, status, total_odds').eq('date', today);

    report.database = {
      matches_cache_today: matchesCount ?? 0,
      match_predictions_today: predsCount ?? 0,
      daily_tickets_today: tickets ?? [],
    };
  } catch (err: any) {
    report.database = { error: err.message };
  }

  // ── Verdict ────────────────────────────────────────────────────────────
  report.verdict = {
    venice_ai_ok: report.venice_ai?.ok === true,
    groq_ok: report.groq?.ok === true,
    api_football_ok: report.api_football.fixtures_count > 0,
    odds_api_ok: report.the_odds_api.events_count > 0,
    has_matches_cached: (report.database?.matches_cache_today ?? 0) > 0,
    has_predictions: (report.database?.match_predictions_today ?? 0) > 0,
    tickets_today: (report.database?.daily_tickets_today ?? []).length,
    all_systems_go:
      report.venice_ai?.ok === true &&
      report.api_football.fixtures_count > 0 &&
      (report.database?.daily_tickets_today ?? []).length >= 3,
  };

  return NextResponse.json(report, { status: 200 });
}
