
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const groqKey = process.env.GROQ_API_KEY;

function generateSlug(match) {
  const dateStr = match.date.replace(/-/g, '');
  const home = match.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const away = match.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `${dateStr}-${home}-vs-${away}`;
}

async function callAI(match) {
  const systemPrompt = `Tu es AlgoPronos AI, expert en analyse de football et paris sportifs.
RÈGLES:
- Génère une analyse journalistique de 3-4 phrases en Français.
- Détermine la probabilité (0-100) pour le résultat le plus probable.
- Formate le résultat en JSON uniquement.
- prediction_type doit être: home, draw, away, btts, ou over25.
- home_form et away_form doivent être une chaîne de 5 caractères comme "WDWLL" (W=Victoire, D=Nul, L=Défaite).`;

  const userPrompt = `Analyse ce match: ${match.homeTeam} vs ${match.awayTeam} (${match.league}) le ${match.date} à ${match.time}.
Cotes réelles: 1=${match.odds.home}, N=${match.odds.draw}, 2=${match.odds.away}

Réponds avec ce JSON exact:
{
  "prediction": "Libellé court du pronostic",
  "prediction_type": "home|draw|away|btts|over25",
  "probability": 65,
  "odds": { "home": 1.8, "draw": 3.4, "away": 4.5 },
  "ai_analysis": "Ton analyse journalistique ici...",
  "home_form": "WWDLW",
  "away_form": "LLDWW"
}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const aiData = JSON.parse(jsonMatch[0]);

    return {
      slug: generateSlug(match),
      match_date: match.date,
      match_time: match.time,
      home_team: match.homeTeam,
      away_team: match.awayTeam,
      league: match.league,
      league_code: match.leagueCode,
      league_slug: match.league.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      home_team_slug: match.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      away_team_slug: match.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      prediction: aiData.prediction,
      prediction_type: aiData.prediction_type,
      probability: aiData.probability,
      odds_home: aiData.odds?.home || match.odds.home,
      odds_draw: aiData.odds?.draw || match.odds.draw,
      odds_away: aiData.odds?.away || match.odds.away,
      ai_analysis: aiData.ai_analysis,
      home_form: aiData.home_form,
      away_form: aiData.away_form,
      created_at: new Date().toISOString()
    };
  } catch (err) {
    console.error(`AI Error for ${match.homeTeam}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('--- STARTING FULL AI SYNC (GROQ) ---');
  const today = new Date().toISOString().split('T')[0];
  
  // 1. Get cached matches
  const { data: cacheEntries } = await supabase
    .from('matches_cache')
    .select('*')
    .gte('date', today);

  if (!cacheEntries || cacheEntries.length === 0) {
    console.log('No matches found in cache for today onwards.');
    return;
  }

  const allMatches = cacheEntries.flatMap(entry => entry.matches);
  console.log(`Processing ${allMatches.length} matches...`);

  const results = [];
  const BATCH_SIZE = 3; // Keep it low to avoid timeout or rate limits

  for (let i = 0; i < allMatches.length; i += BATCH_SIZE) {
    const batch = allMatches.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allMatches.length/BATCH_SIZE)}...`);
    
    const batchResults = await Promise.all(batch.map(m => callAI(m)));
    const validResults = batchResults.filter(r => r !== null);
    
    if (validResults.length > 0) {
      console.log(`Saving ${validResults.length} predictions... Sample slug: ${validResults[0].slug}`);
      const { error } = await supabase.from('match_predictions').upsert(validResults, { onConflict: 'slug' });
      if (error) {
        console.error('Save error:', error.message);
      } else {
        console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1} saved successfully.`);
      }
      results.push(...validResults);
    }

    // Delay to avoid overwhelming the AI or DB
    if (i + BATCH_SIZE < allMatches.length) {
      console.log('Waiting 2s before next batch...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`--- DONE: Created/Updated ${results.length} prediction pages ---`);
}

run();
