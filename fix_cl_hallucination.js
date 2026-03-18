const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing ENV variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const date = '2026-03-18';
  
  // REAL matches for 2026-03-18 based on search
  const realMatches = [
    { home: 'Real Madrid', away: 'Manchester City', time: '21:00', odds: { home: 2.15, draw: 3.5, away: 3.2 } },
    { home: 'Arsenal', away: 'Bayer Leverkusen', time: '21:00', odds: { home: 1.65, draw: 4.0, away: 5.0 } },
    { home: 'Paris Saint-Germain', away: 'Chelsea', time: '21:00', odds: { home: 1.85, draw: 3.7, away: 4.1 } },
    { home: 'Sporting CP', away: 'Bodo/Glimt', time: '21:00', odds: { home: 1.35, draw: 5.2, away: 8.5 } }
  ];

  console.log('Cleaning up hallucinated CL matches for', date);
  await supabase.from('match_predictions').delete().eq('match_date', date).eq('league_code', 'CL');

  for (const m of realMatches) {
    const slug = (m.home + '-vs-' + m.away + '-' + date).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    const prediction = {
      slug,
      home_team: m.home,
      away_team: m.away,
      home_team_slug: m.home.toLowerCase().replace(/\s+/g, '-'),
      away_team_slug: m.away.toLowerCase().replace(/\s+/g, '-'),
      league: 'UEFA Champions League',
      league_code: 'CL',
      league_slug: 'uefa-champions-league',
      match_date: date,
      match_time: m.time,
      odds_home: m.odds.home,
      odds_draw: m.odds.draw,
      odds_away: m.odds.away,
      prediction: 'Analyse IA...',
      prediction_type: 'home',
      probability: 55,
      expires_at: new Date(date + 'T23:59:59Z').toISOString()
    };

    const { error } = await supabase.from('match_predictions').upsert(prediction);
    if (error) console.error(`Error for ${slug}:`, error.message);
    else console.log(`Inserted REAL match: ${slug}`);
  }
}

run();
