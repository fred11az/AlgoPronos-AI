
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectAll() {
  const { data: all, error } = await supabase
    .from('match_predictions')
    .select('match_date, home_team, away_team, slug')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total records in match_predictions: ${all.length} (sample)`);
  all.forEach(p => {
    console.log(`- ${p.match_date} | ${p.home_team} vs ${p.away_team} | ${p.slug}`);
  });

  const { data: cache } = await supabase.from('matches_cache').select('date, matches');
  console.log('\nDates in matches_cache:', cache?.map(c => c.date));
}

inspectAll();
