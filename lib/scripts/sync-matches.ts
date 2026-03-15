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
  console.log('[Sync] Starting EXHAUSTIVE global match sync (Flashscore via OpenClaw)...');
  
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

  // 2. Save matches to matches_cache
  const records = Object.entries(results.byDate).map(([date, matches]) => ({
    date: date,
    leagues: Array.from(new Set(matches.map(m => m.leagueCode))),
    matches: matches,
    expires_at: new Date(new Date(date).getTime() + 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }));

  try {
    const dates = Object.keys(results.byDate);
    console.log(`[Sync] Updating matches_cache for dates: ${dates.join(', ')}...`);
    const { error: matchError } = await supabase.from('matches_cache').upsert(records, { onConflict: 'date' });
    if (matchError) throw matchError;
    console.log(`[Sync] Success: ${Object.values(results.byDate).flat().length} matches cached.`);

    // 3. Phase 2: Generate SEO Landing Pages (Pronostics)
    console.log('[Sync] Phase 2: Generating AI Predictions for SEO pages...');
    const allMatchesBatch = Object.values(results.byDate).flat();
    console.log(`[Sync] Total matches to analyze: ${allMatchesBatch.length}`);

    const predictionsToUpsert: any[] = [];
    
    // Process in batches or sequential to respect AI limits
    for (const match of allMatchesBatch) {
      try {
        console.log(`[Sync] AI Analysis: ${match.homeTeam} vs ${match.awayTeam} (${match.league})...`);
        const pred = await generatePrediction({
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          leagueCode: match.leagueCode,
          date: match.date,
          time: match.time,
          odds: match.odds || { home: 1.8, draw: 3.3, away: 4.0 }
        });

        if (pred) {
          predictionsToUpsert.push(pred);
          console.log(`[Sync] OK: ${match.homeTeam} analyzed.`);
        }
      } catch (e) {
        console.error(`[Sync] Failed AI for ${match.homeTeam}:`, e);
      }
    }

    if (predictionsToUpsert.length > 0) {
      console.log(`[Sync] Saving ${predictionsToUpsert.length} analyses to DB...`);
      const { error: predError } = await supabase
        .from('match_predictions')
        .upsert(predictionsToUpsert, { onConflict: 'slug' });

      if (predError) throw predError;
      console.log('[Sync] Phase 2 Done! SEO pages populated.');
    }

  } catch (err) {
    console.error('[Sync] Fatal error:', err);
    process.exit(1);
  }
}

syncMatches();
