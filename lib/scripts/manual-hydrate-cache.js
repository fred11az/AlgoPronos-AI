
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const matchesM16 = [
  // European / Global (Previously Hydrated)
  { "homeTeam": "Brentford", "awayTeam": "Wolverhampton", "league": "Premier League", "time": "20:00", "odds": { "home": 1.60, "draw": 4.47, "away": 6.05 }, "leagueCode": "PL" },
  { "homeTeam": "Portsmouth", "awayTeam": "Derby County", "league": "Championship", "time": "20:00", "odds": { "home": 2.18, "draw": 3.35, "away": 3.49 }, "leagueCode": "TOP" },
  { "homeTeam": "Rayo Vallecano", "awayTeam": "Levante", "league": "La Liga", "time": "21:00", "odds": { "home": 1.70, "draw": 3.60, "away": 5.00 }, "leagueCode": "LA" },
  { "homeTeam": "Cremonese", "awayTeam": "Fiorentina", "league": "Serie A", "time": "18:30", "odds": { "home": 3.95, "draw": 3.69, "away": 2.04 }, "leagueCode": "SA" },
  { "homeTeam": "Annecy FC", "awayTeam": "Troyes", "league": "Ligue 2", "time": "19:00", "odds": { "home": 2.97, "draw": 3.25, "away": 2.45 }, "leagueCode": "TOP" },
  
  // African Matches - March 16
  { "homeTeam": "Fauve Azur", "awayTeam": "Victoria United", "league": "Elite One (Cameroun)", "time": "15:00", "odds": { "home": 2.55, "draw": 3.10, "away": 2.60 }, "leagueCode": "TOP" },
  { "homeTeam": "Olympique Safi", "awayTeam": "Wydad Casablanca", "league": "Botola (Maroc)", "time": "20:00", "odds": { "home": 5.25, "draw": 3.10, "away": 1.78 }, "leagueCode": "TOP" },
  { "homeTeam": "ASC Jaraaf", "awayTeam": "US Ouakam", "league": "Ligue 1 (Sénégal)", "time": "16:30", "odds": { "home": 4.00, "draw": 3.10, "away": 6.50 }, "leagueCode": "TOP" },
  { "homeTeam": "Guediawaye FC", "awayTeam": "US Goree", "league": "Ligue 1 (Sénégal)", "time": "16:30", "odds": { "home": 5.50, "draw": 3.30, "away": 4.50 }, "leagueCode": "TOP" },
  { "homeTeam": "Ikorodu City", "awayTeam": "Rivers United", "league": "NPFL (Nigeria)", "time": "16:00", "odds": { "home": 2.10, "draw": 3.20, "away": 3.30 }, "leagueCode": "TOP" },
  { "homeTeam": "Don Bosco", "awayTeam": "Blessing", "league": "Ligue 1 (RDC)", "time": "15:30", "odds": { "home": 1.95, "draw": 3.15, "away": 3.70 }, "leagueCode": "TOP" }
].map(m => ({ ...m, date: '2026-03-16', status: 'scheduled', id: `sync-16-${Math.random().toString(36).substr(2, 5)}` }));

const matchesM17 = [
  // European / CL (Previously Hydrated)
  { "homeTeam": "Manchester City", "awayTeam": "Real Madrid", "league": "Champions League", "time": "20:00", "odds": { "home": 1.53, "draw": 5.74, "away": 5.50 }, "leagueCode": "CL" },
  { "homeTeam": "Sporting", "awayTeam": "Bodø/Glimt", "league": "Champions League", "time": "17:45", "odds": { "home": 1.57, "draw": 4.75, "away": 4.50 }, "leagueCode": "CL" },
  { "homeTeam": "Arsenal", "awayTeam": "Bayer 04", "league": "Champions League", "time": "20:00", "odds": { "home": 1.29, "draw": 5.50, "away": 9.50 }, "leagueCode": "CL" },
  { "homeTeam": "Chelsea", "awayTeam": "Paris SG", "league": "Champions League", "time": "20:00", "odds": { "home": 2.05, "draw": 4.20, "away": 2.88 }, "leagueCode": "CL" },

  // Championship + Serie B - March 17
  { "homeTeam": "Watford", "awayTeam": "Wrexham", "league": "Championship", "time": "19:45", "odds": { "home": 2.15, "draw": 3.40, "away": 3.32 }, "leagueCode": "TOP" },
  { "homeTeam": "Palermo", "awayTeam": "Juve Stabia", "league": "Serie B", "time": "18:00", "odds": { "home": 1.56, "draw": 3.60, "away": 4.60 }, "leagueCode": "SA" },
  { "homeTeam": "Reggiana", "awayTeam": "Monza", "league": "Serie B", "time": "18:00", "odds": { "home": 4.20, "draw": 3.40, "away": 1.89 }, "leagueCode": "SA" },
  { "homeTeam": "Catanzaro", "awayTeam": "Modena", "league": "Serie B", "time": "18:00", "odds": { "home": 2.20, "draw": 3.10, "away": 2.80 }, "leagueCode": "SA" },
  { "homeTeam": "Venezia", "awayTeam": "Padova", "league": "Serie B", "time": "18:00", "odds": { "home": 1.33, "draw": 4.90, "away": 8.40 }, "leagueCode": "SA" },

  // African Matches - March 17
  { "homeTeam": "Cotonsport", "awayTeam": "Dynamo Douala", "league": "Elite One (Cameroun)", "time": "15:00", "odds": { "home": 1.75, "draw": 3.20, "away": 4.50 }, "leagueCode": "TOP" },
  { "homeTeam": "Gazelle", "awayTeam": "Aigle Royal", "league": "Elite One (Cameroun)", "time": "15:00", "odds": { "home": 2.10, "draw": 3.10, "away": 3.20 }, "leagueCode": "TOP" },
  { "homeTeam": "Mamelodi Sundowns", "awayTeam": "Marumo Gallants", "league": "PSL (South Africa)", "time": "17:30", "odds": { "home": 1.17, "draw": 10.0, "away": 5.00 }, "leagueCode": "TOP" },
  { "homeTeam": "Côte d'Ivoire (W)", "awayTeam": "Burkina Faso (W)", "league": "WAFCON Qualif.", "time": "17:00", "odds": { "home": 1.36, "draw": 4.10, "away": 7.50 }, "leagueCode": "TOP" }
].map(m => ({ ...m, date: '2026-03-17', status: 'scheduled', id: `sync-17-${Math.random().toString(36).substr(2, 5)}` }));

async function insert(date, matches) {
  const record = {
    date,
    leagues: Array.from(new Set(matches.map(m => m.leagueCode))),
    matches,
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log(`Cleaning old data and inserting ${matches.length} matches for ${date}...`);
  await supabase.from('matches_cache').delete().eq('date', date);
  const { error } = await supabase.from('matches_cache').insert(record);
  if (error) console.error('Error:', error);
  else console.log('Success.');
}

async function run() {
  await insert('2026-03-16', matchesM16);
  await insert('2026-03-17', matchesM17);
  console.log('DONE.');
}

run();
