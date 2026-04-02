/**
 * GET /api/matchs/refresh
 *
 * Cron endpoint: purges stale api_cache + matches_cache entries for today and
 * tomorrow, then triggers a fresh fetch from The Odds API so the /matchs page
 * always shows up-to-date fixtures.
 *
 * Called every hour via Vercel Cron: "0 * * * *"
 * Protected by CRON_SECRET header (Authorization: Bearer <secret>).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { matchService } from '@/lib/services/match-service';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = createAdminClient();

    // Build today + tomorrow dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 1. Purge api_cache entries older than 1h for today & tomorrow
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    await supabase
      .from('api_cache')
      .delete()
      .or(
        `cache_key.like.the-odds-api:soccer:full:${todayStr}%,cache_key.like.the-odds-api:soccer:full:${tomorrowStr}%`
      )
      .lt('fetched_at', oneHourAgo);

    // 2. Purge matches_cache entries older than 1h for today & tomorrow
    await supabase
      .from('matches_cache')
      .delete()
      .in('date', [todayStr, tomorrowStr])
      .lt('expires_at', new Date(Date.now() + 11 * 3600 * 1000).toISOString()); // entries with < 11h left are stale

    console.log(`[Refresh] Purged cache for ${todayStr} and ${tomorrowStr}`);

    // 3. Trigger fresh fetch for today (warms the cache)
    const { byDate, rawFixturesCount } = await matchService.getMatchesForRange(
      todayStr,
      tomorrowStr,
      'football'
    );

    const totalFetched = Object.values(byDate).flat().length;
    console.log(`[Refresh] Fetched ${totalFetched} matches (rawFixturesCount=${rawFixturesCount})`);

    // 4. Revalidate the /matchs ISR page
    revalidatePath('/matchs');
    revalidatePath('/');

    return NextResponse.json({
      ok: true,
      refreshed: [todayStr, tomorrowStr],
      matchesFound: totalFetched,
    });
  } catch (err) {
    console.error('[Refresh] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
