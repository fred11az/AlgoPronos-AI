const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!supabaseUrl || !supabaseKey || !groqKey) {
    console.error('Missing ENV variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const date = '2026-03-18';
  console.log('Syncing UEFA Champions League for', date);

  const prompt = `Liste EXHAUSTIVE des matchs de UEFA Champions League RÉELS pour le ${date}. 
  Retourne UNIQUEMENT un tableau JSON: [{"homeTeam":"...","awayTeam":"...","time":"HH:mm","odds":{"home":1.5,"draw":3.5,"away":4.2}}]`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{role: 'user', content: prompt}],
        temperature: 0.1
      })
    });

    const data = await res.json();
    const content = data.choices[0].message.content;
    const jsonStr = content.match(/\[[\s\S]*\]/)[0];
    const matches = JSON.parse(jsonStr);

    console.log(`Found ${matches.length} matches.`);

    for (const m of matches) {
      // Manual slugification
      const slug = (m.homeTeam + '-vs-' + m.awayTeam + '-' + date).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      
      const prediction = {
        slug,
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        home_team_slug: m.homeTeam.toLowerCase().replace(/\s+/g, '-'),
        away_team_slug: m.awayTeam.toLowerCase().replace(/\s+/g, '-'),
        league: 'UEFA Champions League',
        league_code: 'CL',
        league_slug: 'uefa-champions-league',
        match_date: date,
        match_time: m.time || '20:00',
        odds_home: m.odds?.home || 2.0,
        odds_draw: m.odds?.draw || 3.3,
        odds_away: m.odds?.away || 3.5,
        prediction: 'Analyse IA...',
        prediction_type: 'home',
        probability: 55,
        expires_at: new Date(date + 'T23:59:59Z').toISOString()
      };

      const { error } = await supabase.from('match_predictions').upsert(prediction, { onConflict: 'slug' });
      if (error) console.error(`Error for ${slug}:`, error.message);
      else console.log(`Upserted: ${slug}`);
    }
    console.log('DONE');
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

run();
