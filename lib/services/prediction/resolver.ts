/**
 * Prediction Resolver Service
 */
import { createClient } from '@supabase/supabase-js';
import { cachedFetch } from '../api/footballApi';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Scans PENDING predictions and resolves them using real match results.
 */
export async function resolvePendingPredictions() {
  const supabase = getSupabase();
  console.log('[resolver] Starting resolution of pending predictions...');

  // 1. Fetch pending predictions from Supabase
  const { data: pending, error: fetchError } = await supabase
    .from('predictions_log')
    .select('*')
    .eq('result', 'PENDING');

  if (fetchError || !pending || pending.length === 0) {
    console.log('[resolver] No pending predictions found or error occurred.');
    return;
  }

  console.log(`[resolver] Found ${pending.length} pending predictions.`);

  // 2. Group by match_id to avoid redundant API calls
  const matchIds = Array.from(new Set(pending.map(p => p.match_id)));

  for (const matchId of matchIds) {
    // API-Football fixture ID is expected to be part of the match_id
    // Example: "20260318-arsenal-vs-liverpool" might not be the ID we need.
    // If we use the API ID directly, it's easier.
    
    // We expect match_id to be something like "123456" (numeric ID from API)
    // If it's the slug, we might need a mapping.
    
    // Assuming match_id in predictions_log is the API-Football numeric ID.
    const fixtureData = await cachedFetch<any>(`/fixtures`, { id: matchId });

    if (!fixtureData || !fixtureData.response || fixtureData.response.length === 0) {
      continue;
    }

    const fixture = fixtureData.response[0];
    const status = fixture.fixture.status.short;

    // Only resolve finished matches (FT = Finished, PEN = After Penalty)
    if (['FT', 'AET', 'PEN'].includes(status)) {
      const { goals } = fixture;
      const homeScore = goals.home;
      const awayScore = goals.away;

      const actualResult = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

      // Update all predictions for this match_id
      const matchPicks = pending.filter(p => p.match_id === matchId);
      
      for (const pick of matchPicks) {
        const isWin = pick.market === actualResult;
        
        await supabase
          .from('predictions_log')
          .update({
            result: isWin ? 'WIN' : 'LOSS',
            resolved_at: new Date().toISOString()
          })
          .eq('id', pick.id);

        console.log(`[resolver] Resolved ${pick.home_team} vs ${pick.away_team} (${pick.market}): ${isWin ? 'WIN' : 'LOSS'}`);
      }
    }
  }

  console.log('[resolver] Resolution process complete.');
}
