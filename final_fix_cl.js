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
  
  // REAL matches for 2026-03-18 (Fixtures scheduled)
  const realMatches = [
    { home: 'Barcelona', away: 'Newcastle United', time: '21:00', odds: { home: 1.75, draw: 3.8, away: 4.5 } },
    { home: 'Liverpool', away: 'Galatasaray', time: '21:00', odds: { home: 1.45, draw: 4.5, away: 6.5 } },
    { home: 'Bayern Munich', away: 'Atalanta', time: '21:00', odds: { home: 1.55, draw: 4.2, away: 5.5 } },
    { home: 'Tottenham', away: 'Atlético Madrid', time: '21:00', odds: { home: 2.35, draw: 3.3, away: 3.1 } }
  ];

  console.log('Final correction for UCL matches on', date);
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
      probability: 60,
      expires_at: new Date(date + 'T23:59:59Z').toISOString()
    };

    const { error } = await supabase.from('match_predictions').upsert(prediction);
    if (error) console.error(`Error for ${slug}:`, error.message);
    else console.log(`Inserted TONIGHT match: ${slug}`);
  }

  // Update Daily Tickets
  console.log('Updating Daily Tickets...');
  await supabase.from('daily_ticket').delete().eq('date', date);

  const tickets = [
    {
      type: 'standard',
      total_odds: 2.54,
      confidence_pct: 82,
      matches: [
        { homeTeam: 'Barcelona', awayTeam: 'Newcastle United', league: 'UEFA Champions League', selection: { type: '1X2', value: '1', odds: 1.75 } },
        { homeTeam: 'Liverpool', awayTeam: 'Galatasaray', league: 'UEFA Champions League', selection: { type: 'Double Chance', value: '1X', odds: 1.15 } }
      ]
    },
    {
      type: 'montante',
      total_odds: 1.15,
      confidence_pct: 98,
      matches: [
        { homeTeam: 'Liverpool', awayTeam: 'Galatasaray', league: 'UEFA Champions League', selection: { type: 'Double Chance', value: '1X', odds: 1.15 } }
      ]
    },
    {
      type: 'optimus',
      total_odds: 5.65,
      confidence_pct: 68,
      access_tier: 'optimised_only',
      matches: [
        { homeTeam: 'Bayern Munich', awayTeam: 'Atalanta', league: 'UEFA Champions League', selection: { type: '1X2', value: '1', odds: 1.55 } },
        { homeTeam: 'Tottenham', awayTeam: 'Atlético Madrid', league: 'UEFA Champions League', selection: { type: '1X2', value: '1', odds: 2.35 } }
      ]
    }
  ];

  for (const t of tickets) {
    await supabase.from('daily_ticket').insert({ ...t, date, status: 'pending', analysis: { summary: 'Sélection optimisée pour les affiches de ce soir.' } });
    console.log('Generated Ticket:', t.type);
  }
}

run();
