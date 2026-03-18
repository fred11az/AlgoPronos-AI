
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countEverythingIndexable() {
  const staticCount = 19;
  const countryCount = 12;

  // matches (all)
  const { count: matchCount } = await supabase
    .from('match_predictions')
    .select('*', { count: 'exact', head: true });

  // Leagues (all)
  const { data: leagues } = await supabase
    .from('match_predictions')
    .select('league_slug');
  const uniqueLeagues = new Set(leagues?.map(l => l.league_slug)).size;

  // Teams (all)
  const { data: teams1 } = await supabase.from('match_predictions').select('home_team_slug');
  const { data: teams2 } = await supabase.from('match_predictions').select('away_team_slug');
  const teamSlugs = new Set([...(teams1?.map(t => t.home_team_slug) || []), ...(teams2?.map(t => t.away_team_slug) || [])]);
  const uniqueTeams = teamSlugs.size;

  // Spotlights
  const { data: spotlights } = await supabase.from('weekly_spotlights').select('slug');
  const spotlightCount = spotlights?.length || 0;

  console.log('--- RECENSEMENT GLOBAL (HISTORIQUE INCLUS) ---');
  console.log(`Pages Statiques: ${staticCount}`);
  console.log(`Landing Pages Pays (1xBet): ${countryCount}`);
  console.log(`Matchs (Tous): ${matchCount}`);
  console.log(`Ligues (Toutes): ${uniqueLeagues}`);
  console.log(`Équipes (Toutes): ${uniqueTeams}`);
  console.log(`Grandes Affiches: ${spotlightCount}`);
  
  const total = staticCount + countryCount + (matchCount || 0) + uniqueLeagues + uniqueTeams + spotlightCount;
  console.log(`\nTOTAL INDEXABLE SITEMAP: ${total} pages`);
}

countEverythingIndexable();
