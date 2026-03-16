
import 'dotenv/config';
import { matchService } from '../services/match-service';
import { createAdminClient } from '../supabase/server';

async function runTestSync() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[TestSync] Executing pure AI synchronization for ${today}...`);
  
  try {
    const results = await matchService.getMatchesForRange(today, today);
    const matches = results.byDate[today] || [];
    
    console.log(`[TestSync] DISCOVERY COMPLETED: Found ${matches.length} matches.`);
    
    if (matches.length > 0) {
      console.log('[TestSync] Sample matches found:');
      matches.slice(0, 5).forEach(m => {
        console.log(` - ${m.homeTeam} vs ${m.awayTeam} (${m.league}) @ ${m.time}`);
      });

      const supabase = createAdminClient();

      // Saving to DB
      const record = {
        date: today,
        leagues: Array.from(new Set(matches.map(m => m.leagueCode))),
        matches: matches,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`[TestSync] Upserting to matches_cache...`);
      const { error } = await supabase.from('matches_cache').upsert(record, { onConflict: 'date' });
      if (error) throw error;
      console.log('[TestSync] SUCCESS: Database updated.');
    } else {
      console.error('[TestSync] FAILURE: No matches discovered via AI search.');
    }
  } catch (err: any) {
    console.error('[TestSync] ERROR:', err.message);
  }
}

runTestSync();
