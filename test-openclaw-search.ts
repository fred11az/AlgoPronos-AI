import { matchService } from './lib/services/match-service';
import { createAdminClient } from './lib/supabase/server';

process.env.FOOTBALL_API_KEY = 'invalid_key_to_force_fallback';

async function testOpenClawSearch() {
  console.log('--- Start Test: OpenClaw Autonomous Search ---');
  
  const from = new Date().toISOString().split('T')[0];
  const to = from;

  try {
    const result = await matchService.getMatchesForRange(from, to);
    
    console.log('Results Found:', Object.keys(result.byDate).length, 'days');
    for (const [date, matches] of Object.entries(result.byDate)) {
      console.log(`Date: ${date}, Matches: ${matches.length}`);
      matches.forEach((m, i) => {
        console.log(`  [${i+1}] ${m.homeTeam} vs ${m.awayTeam} (${m.league}) - Time: ${m.time}`);
        console.log(`      Odds: Home=${m.odds?.home}, Draw=${m.odds?.draw}, Away=${m.odds?.away}`);
      });
    }

    if (Object.keys(result.byDate).length > 0) {
      console.log('SUCCESS: OpenClaw successfully found and returned matches.');
    } else {
      console.log('FAILURE: No matches returned.');
    }
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

testOpenClawSearch();
