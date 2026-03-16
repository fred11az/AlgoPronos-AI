
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCache() {
  const { data, error } = await supabase.from('matches_cache').select('date, matches');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Dates in cache:', data.map(d => d.date));
  data.forEach(d => {
    console.log(`- ${d.date}: ${d.matches?.length || 0} matches`);
  });
}

checkCache();
