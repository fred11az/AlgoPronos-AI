
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  const { data: latest, error } = await supabase
    .from('match_predictions')
    .select('*')
    .limit(5)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log('--- DERNIÈRES PRÉDICTIONS ---');
  if (latest.length === 0) {
    console.log('Aucune donnée trouvée dans match_predictions.');
  } else {
    latest.forEach(p => {
      console.log(`- ${p.match_date} | ${p.home_team} vs ${p.away_team} | Slug: ${p.slug}`);
    });
  }

  const { data: allData } = await supabase.from('match_predictions').select('match_date');
  console.log('\nToutes les dates présentes:', [...new Set(allData?.map(d => d.match_date))]);
}

checkData();
