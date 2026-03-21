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

  // ?refetch=true → call RapidAPI directly and store result in api_cache
  const refetch = searchParams.get('refetch') === 'true';
  let refetchResult: any = null;
  if (refetch) {
    const rapidKey = process.env.RAPIDAPI_KEY;
    if (!rapidKey) {
      refetchResult = { error: 'RAPIDAPI_KEY not set' };
    } else {
      try {
        const res = await fetch(matchesKey, {
          headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': host },
        });
        const status = res.status;
        const contentType = res.headers.get('content-type') ?? 'unknown';
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder('utf-8').decode(buffer);
        let json: any = null;
        try { json = JSON.parse(text); } catch { /* not JSON */ }
        if (res.ok && json) {
          await adminSb.from('api_cache').upsert({
            cache_key: matchesKey,
            data: json,
            fetched_at: new Date().toISOString(),
          });
          refetchResult = { status, contentType, matches: json?.response?.matches?.length ?? 0, apiStatus: json?.status };
        } else {
          refetchResult = { status, contentType, body: text.substring(0, 500) };
        }
      } catch (e: any) {
        refetchResult = { error: String(e?.message ?? e) };
      }
    }
  }

  const [leaguesRes, matchesRes] = await Promise.all([
    adminSb.from('api_cache').select('data, fetched_at').eq('cache_key', leaguesKey).single(),
    adminSb.from('api_cache').select('data, fetched_at').eq('cache_key', matchesKey).single(),
  ]);

  const leaguesData = leaguesRes.data?.data;
  const matchesData = matchesRes.data?.data;

  // All unique leagueIds with match count and sample teams
  const allFixtures: any[] = Array.isArray(matchesData?.response?.matches)
    ? matchesData.response.matches
    : [];

  const leagueIdMap: Record<number, { count: number; teams: string[] }> = {};
  for (const f of allFixtures) {
    const lid = f.leagueId;
    if (!leagueIdMap[lid]) leagueIdMap[lid] = { count: 0, teams: [] };
    leagueIdMap[lid].count++;
    if (leagueIdMap[lid].teams.length < 4) {
      leagueIdMap[lid].teams.push(`${f.home?.longName ?? f.home?.name} vs ${f.away?.longName ?? f.away?.name}`);
    }
  }

  // ?purge=true → delete matches_cache + api_cache for this date so next request re-fetches with correct encoding
  const purge = searchParams.get('purge') === 'true';
  let purgeResult: string | null = null;
  if (purge) {
    const [mc, ac] = await Promise.all([
      adminSb.from('matches_cache').delete().eq('date', date),
      adminSb.from('api_cache').delete().eq('cache_key', matchesKey),
    ]);
    const errors = [mc.error?.message, ac.error?.message].filter(Boolean);
    purgeResult = errors.length
      ? `error: ${errors.join('; ')}`
      : `matches_cache + api_cache for ${date} deleted`;
  }

  return NextResponse.json({
    date,
    api_cache_key: matchesKey,
    api_cache_hit: !!matchesRes.data,
    api_cache_fetched_at: matchesRes.data?.fetched_at ?? null,
    leagues_api_status: leaguesData?.status,
    matches_count: allFixtures.length,
    league_ids: leagueIdMap,
    ...(purge ? { purge: purgeResult } : {}),
    ...(refetch ? { refetch: refetchResult } : {}),
  });
}
