
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countPages() {
  const today = new Date().toISOString().split('T')[0];
  
  const { count: matchCount } = await supabase
    .from('match_predictions')
    .select('*', { count: 'exact', head: true })
    .gte('match_date', today);

  const { data: leagues } = await supabase
    .from('match_predictions')
    .select('league_slug')
    .gte('match_date', today);
  
  const uniqueLeagues = new Set(leagues?.map(l => l.league_slug));

  const { data: homeTeams } = await supabase
    .from('match_predictions')
    .select('home_team_slug')
    .gte('match_date', today);
  
  const { data: awayTeams } = await supabase
    .from('match_predictions')
    .select('away_team_slug')
    .gte('match_date', today);

  const uniqueTeams = new Set([...(homeTeams?.map(t => t.home_team_slug) || []), ...(awayTeams?.map(t => t.away_team_slug) || [])]);

  console.log('--- STATISTIQUES PAGES DYNAMIQUES ---');
  console.log(`Match Predictions (Pages de pronostics): ${matchCount || 0}`);
  console.log(`Ligues actives: ${uniqueLeagues.size}`);
  console.log(`Équipes actives: ${uniqueTeams.size}`);
  console.log(`Total Pages dynamiques (Pronos + Ligues + Équipes): ${(matchCount || 0) + uniqueLeagues.size + uniqueTeams.size}`);
}

countPages();
