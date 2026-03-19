import { matchService } from './lib/services/match-service';
import { createAdminClient } from './lib/supabase/server';
import { createMatchSlug } from './lib/utils/slugify';

async function run() {
  const s = createAdminClient();
  const date = '2026-03-18';
  console.log('Targeted CL Sync for', date);
  
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error('GEMINI_API_KEY missing');
    return;
  }

  const prompt = `MISSION : Liste exhaustive des matchs de UEFA Champions League RÉELS pour le ${date}.
  Retourne UNIQUEMENT un tableau JSON avec homeTeam, awayTeam, league:"UEFA Champions League", time, odds:{home, draw, away}.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{role: 'user', parts: [{text: prompt}]}],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonStr = content.match(/\[[\s\S]*\]/)[0];
    const matches = JSON.parse(jsonStr);

    console.log(`Found ${matches.length} matches. Upserting...`);

    for (const m of matches) {
      const slug = createMatchSlug(m.homeTeam, m.awayTeam, date);
      const prediction = {
        slug,
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        league: 'UEFA Champions League',
        league_code: 'CL',
        match_date: date,
        match_time: m.time || '20:00',
        odds_home: m.odds?.home || 2.0,
        odds_draw: m.odds?.draw || 3.3,
        odds_away: m.odds?.away || 3.5,
        prediction: 'Analyse IA...',
        prediction_type: 'home',
        probability: 55,
        expires_at: new Date(date + 'T23:59:59Z').toISOString(),
        sport: 'football'
      };
      await s.from('match_predictions').upsert(prediction);
      console.log(`Upserted: ${slug}`);
    }
    console.log('Sync complete');
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

run();
