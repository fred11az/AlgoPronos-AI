
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const orApiKey = process.env.OPENROUTER_API_KEY;

async function fetchAI(regionalPrompt) {
  const today = new Date().toISOString().split('T')[0];
  const fullPrompt = `MISSION : Liste exhaustive des matchs de football RÉELS pour le ${today} dans cette zone : ${regionalPrompt}.
INSTRUCTIONS :
1. UTILISE TON OUTIL DE RECHERCHE WEB.
2. Réponds UNIQUEMENT avec un tableau JSON d'objets : [{"homeTeam": "...", "awayTeam": "...", "league": "...", "time": "HH:mm", "odds": {"home": 2.1, "draw": 3.2, "away": 3.5}}].
3. Ne mets AUCUN texte avant ou après.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${orApiKey}`,
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.1,
      }),
    });
    
    const data = await res.json();
    console.log('OpenRouter Response Status:', res.status);
    if (!data.choices) {
      console.log('OpenRouter Error Data:', JSON.stringify(data));
      return [];
    }
    
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (err) {
    console.error(`Error in segment:`, err.message);
    return [];
  }
}

async function runTestSync() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[TestSync] Executing pure AI synchronization for ${today}...`);
  
  const segments = [
    'Europe Élite (Premier League, LaLiga, Serie A, Bundesliga, Ligue 1)',
    'Afrique de l\'Ouest (Bénin, Côte d\'Ivoire, Sénégal, Cameroun)',
    'Afrique (Nord, Sud) & Continental (CAF)',
    'Amériques & Reste du monde'
  ];

  let allMatches = [];
  for (const seg of segments) {
    console.log(`Querying: ${seg}...`);
    const matches = await fetchAI(seg);
    console.log(`Found ${matches.length} matches.`);
    allMatches = [...allMatches, ...matches];
  }

  // Deduplicate
  const unique = [];
  const keys = new Set();
  allMatches.forEach(m => {
    const key = `${m.homeTeam}-${m.awayTeam}-${m.time}`.toLowerCase().replace(/\s/g, '');
    if (!keys.has(key)) {
      keys.add(key);
      unique.push({
        id: `ai-sync-${today}-${Math.random().toString(36).substr(2, 5)}`,
        ...m,
        leagueCode: 'TOP',
        date: today,
        status: 'scheduled'
      });
    }
  });

  console.log(`Total Unique Matches: ${unique.length}`);
  
  if (unique.length > 0) {
    const record = {
      date: today,
      leagues: Array.from(new Set(unique.map(m => m.leagueCode))),
      matches: unique,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`Upserting to matches_cache...`);
    const { error } = await supabase.from('matches_cache').upsert(record, { onConflict: 'date' });
    if (error) console.error('DB Error:', error);
    else console.log('SUCCESS: Database updated.');
  }
}

runTestSync();
