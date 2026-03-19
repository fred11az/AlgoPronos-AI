/**
 * Seed Script: Initial Dixon-Coles Parameters from Web Research (March 2026)
 * Period: 2025/2026 Season (Current Stats)
 */
import { createClient } from '@supabase/supabase-js';

console.log('Environment check:');
console.log('- URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING');
console.log('- KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables. Make sure --env-file=.env is used or variables are set.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEASON = 2025;

// Formula: Param = (Team Avg / League Avg Per Team)
// League Averages (per match, shared between 2 teams):
// PL: 2.73 / 2 = 1.365
// LL: 2.68 / 2 = 1.34
// SA: 2.56 / 2 = 1.28
// BL: 3.14 / 2 = 1.57
// L1: 2.76 / 2 = 1.38

const SEED_DATA = [
  // --- PREMIER LEAGUE ---
  { team: 'Manchester City', league: 'PL', attack: 2.0 / 1.365, defense: 0.93 / 1.365 },
  { team: 'Arsenal', league: 'PL', attack: 1.97 / 1.365, defense: 0.71 / 1.365 },
  { team: 'Chelsea', league: 'PL', attack: 1.77 / 1.365, defense: 1.17 / 1.365 },
  { team: 'Liverpool', league: 'PL', attack: 1.66 / 1.365, defense: 1.34 / 1.365 },
  { team: 'Manchester United', league: 'PL', attack: 1.76 / 1.365, defense: 1.38 / 1.365 },

  // --- LA LIGA ---
  { team: 'Barcelona', league: 'LL', attack: 2.75 / 1.34, defense: 1.0 / 1.34 },
  { team: 'Real Madrid', league: 'LL', attack: 2.14 / 1.34, defense: 0.81 / 1.34 },
  { team: 'Atletico Madrid', league: 'LL', attack: 1.67 / 1.34, defense: 0.89 / 1.34 },

  // --- SERIE A ---
  { team: 'Inter', league: 'SA', attack: 2.37 / 1.28, defense: 0.92 / 1.28 },
  { team: 'Juventus', league: 'SA', attack: 1.70 / 1.28, defense: 0.92 / 1.28 },
  { team: 'Napoli', league: 'SA', attack: 1.55 / 1.28, defense: 0.71 / 1.28 },

  // --- BUNDESLIGA ---
  { team: 'Bayern Munich', league: 'BL', attack: 3.67 / 1.57, defense: 0.73 / 1.57 },
  { team: 'Bayer Leverkusen', league: 'BL', attack: 2.20 / 1.57, defense: 1.33 / 1.57 },
  { team: 'Borussia Dortmund', league: 'BL', attack: 1.73 / 1.57, defense: 0.80 / 1.57 },

  // --- LIGUE 1 ---
  { team: 'Paris Saint-Germain', league: 'L1', attack: 2.2 / 1.38, defense: 1.0 / 1.38 },
  { team: 'Marseille', league: 'L1', attack: 2.2 / 1.38, defense: 1.27 / 1.38 },
  { team: 'Lens', league: 'L1', attack: 1.68 / 1.38, defense: 0.84 / 1.38 },
];

async function seed() {
  console.log('Seeding Dixon-Coles parameters...');
  
  for (const row of SEED_DATA) {
    const { error } = await supabase.from('model_params').upsert({
      team_id: row.team,
      league_id: row.league,
      attack: Math.round(row.attack * 100) / 100,
      defense: Math.round(row.defense * 100) / 100,
      season: SEASON,
      updated_at: new Date().toISOString()
    }, { onConflict: 'team_id,league_id,season' });

    if (error) console.error(`Error for ${row.team}:`, error.message);
    else console.log(`Seeded ${row.team} (A: ${row.attack.toFixed(2)}, D: ${row.defense.toFixed(2)})`);
  }
}

seed();
