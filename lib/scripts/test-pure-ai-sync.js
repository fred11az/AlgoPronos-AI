
require('dotenv').config();
const { matchService } = require('../services/match-service');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  } catch (err) {
    console.error('[TestSync] ERROR:', err.message);
  }
}

runTestSync();
