import { createClient, checkIsAdmin } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/debug?date=2026-03-21
 * Shows raw api_cache entries for leagues + today's matches to diagnose leagueMap issues.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = await checkIsAdmin(user?.id ?? '');
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const apiDate = date.replace(/-/g, '');

  const host = process.env.RAPIDAPI_HOST || 'free-api-live-football-data.p.rapidapi.com';
  const leaguesKey = `https://${host}/football-get-all-leagues`;
  const matchesKey = `https://${host}/football-get-matches-by-date?date=${apiDate}`;

  const { createClient: createAdmin } = await import('@supabase/supabase-js');
  const adminSb = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [leaguesRes, matchesRes] = await Promise.all([
    adminSb.from('api_cache').select('data, fetched_at').eq('cache_key', leaguesKey).single(),
    adminSb.from('api_cache').select('data, fetched_at').eq('cache_key', matchesKey).single(),
  ]);

  const leaguesData = leaguesRes.data?.data;
  const matchesData = matchesRes.data?.data;

  // Sample first 3 fixtures to see their fields
  const sampleFixtures = Array.isArray(matchesData?.response?.matches)
    ? matchesData.response.matches.slice(0, 3)
    : null;

  // Sample first 3 leagues
  const sampleLeagues = Array.isArray(leaguesData?.response?.leagues)
    ? leaguesData.response.leagues.slice(0, 3)
    : null;

  return NextResponse.json({
    date,
    leagues_cache: {
      found: !!leaguesData,
      fetched_at: leaguesRes.data?.fetched_at,
      status: leaguesData?.status,
      leagues_count: leaguesData?.response?.leagues?.length ?? 0,
      sample: sampleLeagues,
      raw_keys: leaguesData ? Object.keys(leaguesData) : null,
    },
    matches_cache: {
      found: !!matchesData,
      fetched_at: matchesRes.data?.fetched_at,
      status: matchesData?.status,
      matches_count: matchesData?.response?.matches?.length ?? 0,
      sample_fixtures: sampleFixtures,
      raw_keys: matchesData ? Object.keys(matchesData) : null,
    },
  });
}
