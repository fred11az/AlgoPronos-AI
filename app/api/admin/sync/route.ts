import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { matchService } from '@/lib/services/match-service';
import { generatePrediction } from '@/lib/services/openclaw-generator';

export async function POST() {
  const supabase = await createClient();

  // 1. Verify admin session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    console.log('[Admin Sync] Starting manual trigger...');
    
    // We run the sync logic from sync-matches.ts but inside the API
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

    // 1. Fetch matches
    const results = await matchService.getMatchesForRange(todayStr, tomorrowStr);
    
    if (Object.keys(results.byDate).length === 0) {
      return NextResponse.json({ error: 'No matches found' }, { status: 404 });
    }

    // 2. Cache matches
    const records = Object.entries(results.byDate).map(([date, matches]) => ({
      date: date,
      leagues: Array.from(new Set(matches.map(m => m.leagueCode))),
      matches: matches,
      expires_at: new Date(new Date(date).getTime() + 3 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }));

    const dates = Object.keys(results.byDate);
    await supabase.from('matches_cache').delete().in('date', dates);
    const { error: matchError } = await supabase.from('matches_cache').insert(records);
    if (matchError) throw matchError;

    // 3. Phase 2: SEO Pages (Background-ish)
    // We'll process a few matches immediately and the rest could be cron-ed, 
    // but for the admin button, we'll try to do it all (or at least acknowledge receipt)
    const allMatchesBatch = Object.values(results.byDate).flat();
    
    // Return early to the UI to avoid 120s timeout, but the process continues 
    // (Note: Vercel serverless might kill it if not properly handled, but for local/self-hosted it's fine)
    
    // For now, let's do a meaningful subset or everything if possible
    const predictionsToUpsert: any[] = [];
    for (const match of allMatchesBatch.slice(0, 20)) { // Limit to top 20 for immediate response
      try {
        const pred = await generatePrediction({
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          leagueCode: match.leagueCode,
          date: match.date,
          time: match.time,
          odds: {
              home: match.odds?.home || 1.8,
              draw: match.odds?.draw || 3.3,
              away: match.odds?.away || 4.0
          }
        });
        if (pred) predictionsToUpsert.push(pred);
      } catch (e) {
        console.error(e);
      }
    }

    if (predictionsToUpsert.length > 0) {
      await supabase.from('match_predictions').upsert(predictionsToUpsert, { onConflict: 'slug' });
    }

    return NextResponse.json({ 
      status: 'ok', 
      message: `Sync successful. ${allMatchesBatch.length} matches cached. ${predictionsToUpsert.length} SEO pages generated/updated.`,
      count: allMatchesBatch.length
    });

  } catch (err: any) {
    console.error('[Admin Sync] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
