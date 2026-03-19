import { createClient } from '@supabase/supabase-js';
import { generatePrediction } from '../services/openclaw-generator';
import { matchService } from '../services/match-service';
import 'dotenv/config';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Bypass SSL errors if necessary
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function syncMatches() {
  console.log('[Sync] Starting EXHAUSTIVE global match sync (Pure AI Search)...');
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

  console.log(`[Sync] Target dates: ${todayStr} and ${tomorrowStr}`);

  // 1. Fetch matches for today and tomorrow using MatchService (Flashscore/OpenClaw/API-Football)
  const results = await matchService.getMatchesForRange(todayStr, tomorrowStr);
  
  if (Object.keys(results.byDate).length === 0) {
    console.error('[Sync] Critical Error: No matches found for the requested range.');
    return;
  }

  try {
    console.log(`[Sync] Success: ${Object.values(results.byDate).flat().length} matches found.`);

    // 3. Phase 2: Generate SEO Landing Pages (Pronostics)
    console.log('[Sync] Phase 2: Generating AI Predictions for SEO pages...');
    const allMatchesBatch = Object.values(results.byDate).flat();
    console.log(`[Sync] Total matches to analyze: ${allMatchesBatch.length}`);

    const predictionsToUpsert: any[] = [];
    
    // Process in batches of 3 to remain efficient but stable
    const BATCH_SIZE = 3;
    for (let i = 0; i < allMatchesBatch.length; i += BATCH_SIZE) {
      const batch = allMatchesBatch.slice(i, i + BATCH_SIZE);
      console.log(`[Sync] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allMatchesBatch.length/BATCH_SIZE)}...`);
      
      const batchResults = await Promise.all(batch.map(async (match) => {
        try {
          console.log(`[Sync] AI Analysis: ${match.homeTeam} vs ${match.awayTeam} (${match.league})...`);
          const realOdds = match.odds;

          const pred = await generatePrediction({
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            leagueCode: match.leagueCode,
            date: match.date,
            time: match.time,
            odds: {
              home: realOdds?.home || 1.85,
              draw: realOdds?.draw || 3.40,
              away: realOdds?.away || 3.80
            }
          });
          if (pred) console.log(`[Sync] OK: ${match.homeTeam} analyzed.`);
          return pred;
        } catch (e) {
          console.error(`[Sync] Failed AI for ${match.homeTeam}:`, e);
          return null;
        }
      }));

      const validBatch = batchResults.filter(p => p !== null);
      if (validBatch.length > 0) {
        console.log(`[Sync] Saving ${validBatch.length} analyses to DB...`);
        const { error: predError } = await supabase
          .from('match_predictions')
          .upsert(validBatch, { onConflict: 'slug' });

        if (predError) {
          console.error(`[Sync] Batch save error: ${predError.message}`);
        } else {
          console.log(`[Sync] Batch ${Math.floor(i/BATCH_SIZE) + 1} saved successfully.`);
        }
        predictionsToUpsert.push(...validBatch);
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < allMatchesBatch.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`[Sync] Phase 2 Done! ${predictionsToUpsert.length} SEO pages populated.`);

  } catch (err) {
    console.error('[Sync] Fatal error:', err);
    process.exit(1);
  }
}

syncMatches();
