
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

dotenv.config();

const groqKey = process.env.GROQ_API_KEY;
const baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

async function extractMatches(searchText, date) {
  const prompt = `Extrais tous les matchs de football pour le ${date} à partir du texte suivant.
RETOURNE UNIQUEMENT UN TABLEAU JSON au format:
[
  { 
    "homeTeam": "...", 
    "awayTeam": "...", 
    "league": "...", 
    "time": "HH:mm", 
    "odds": { "home": 1.5, "draw": 3.4, "away": 4.2 } 
  }
]
Si l'heure n'est pas fournie, mets "20:00". Si les cotes ne sont pas là, mets des cotes réalistes.

TEXTE:
${searchText}`;

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    const data = await res.json();
    if (!data.choices) {
        console.error('Groq Error:', JSON.stringify(data));
        return [];
    }
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (err) {
    console.error('Extraction Error:', err.message);
    return [];
  }
}

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const searchResultsText = `
  Football Matches: Monday, March 16, 2026
  - Brentford vs. Wolverhampton Wanderers: Home 1.60, Draw 4.47, Away 6.05.
  - Portsmouth vs. Derby County: Home 2.18, Draw 3.35, Away 3.49.
  - Rayo Vallecano vs. Levante: Home 1.70, Draw 3.60, Away 5.00.
  - Cremonese vs. Fiorentina: Home 3.95, Draw 3.69, Away 2.04.
  - Chapecoense vs. Gremio RS: Home 2.97, Draw 3.27, Away 2.50.
  - Union Santa Fe vs. Boca Juniors: Home 2.88, Draw 2.93, Away 2.61.
  - Annecy FC vs. Troyes: Home 2.97, Draw 3.25, Away 2.45.
  - Ferencvarosi vs. Puskas Akademia: Home 1.40, Draw 4.60, Away 6.95.
  - CA Barracas Central vs. Atletico Tucuman: Home 2.62, Draw 3.06, Away 2.75.
  - Aldosivi vs. Atletico Huracan: Home 3.33, Draw 2.88, Away 2.42.
  - San Lorenzo vs. Defensa y Justicia: Home 2.18, Draw 2.94, Away 3.73.
  - Racing Club vs. Estudiantes Rio Cuarto: Home 1.33, Draw 4.75, Away 10.25.
  
  Football Matches: Tuesday, March 17, 2026 (Champions League & More)
  - Manchester City vs. Real Madrid: Home 1.53, Draw 5.74, Away 5.50.
  - Sporting vs. Bodø/Glimt: Home 1.57, Draw 4.75, Away 4.50.
  - Arsenal vs. Bayer 04: Home 1.29, Draw 5.50, Away 9.50.
  - Chelsea vs. Paris SG: Home 2.05, Draw 4.20, Away 2.88.
  - Stockport County vs. Northampton Town: Home 1.49, Draw 4.10, Away 5.73.
  - Palermo vs. Juve Stabia: Home 1.74, Draw 3.55, Away 4.58.
  - Venezia vs. Padova: Home 1.33, Draw 4.90, Away 8.40.
  - Peterborough United vs. Rotherham United: Home 1.89, Draw 3.55, Away 3.54.
  - Plymouth Argyle vs. Stevenage FC: Home 2.19, Draw 3.15, Away 3.15.
  - Bradford City vs. Mansfield Town: Home 1.93, Draw 3.40, Away 3.60.
  - AFC Wimbledon vs. Leyton Orient: Home 2.34, Draw 3.20, Away 2.84.
  - Huddersfield Town vs. Lincoln City: Home 2.48, Draw 3.20, Away 2.60.
  - Blackpool vs. Port Vale: Home 2.16, Draw 3.30, Away 3.04.
  - Bolton Wanderers vs. Doncaster Rovers: Home 1.68, Draw 3.80, Away 4.25.
  - Luton Town vs. Exeter City: Home 1.75, Draw 3.50, Away 4.25.
  - Cardiff City vs. Wycombe Wanderers: Home 1.88, Draw 3.55, Away 3.63.
  - Barnsley vs. Wigan Athletic: Home 2.07, Draw 3.40, Away 3.19.
  `;

  console.log('Extracting matches for 2026-03-16...');
  const m16 = await extractMatches(searchResultsText, '2026-03-16');
  console.log(`Found ${m16.length} matches for today.`);

  console.log('Extracting matches for 2026-03-17...');
  const m17 = await extractMatches(searchResultsText, '2026-03-17');
  console.log(`Found ${m17.length} matches for tomorrow.`);

  const datesToUpdate = [
    { date: '2026-03-16', matches: m16 },
    { date: '2026-03-17', matches: m17 }
  ];

  for (const item of datesToUpdate) {
    if (item.matches.length > 0) {
      const formatted = item.matches.map((m) => ({
        id: `groq-sync-${item.date}-${Math.random().toString(36).substr(2, 5)}`,
        ...m,
        leagueCode: m.league.includes('Premier League') ? 'PL' : 
                    m.league.includes('Champions League') ? 'CL' : 
                    m.league.includes('La Liga') ? 'LA' : 
                    m.league.includes('Serie A') ? 'SA' : 'TOP',
        date: item.date,
        status: 'scheduled'
      }));

      const record = {
        date: item.date,
        leagues: Array.from(new Set(formatted.map((m) => m.leagueCode))),
        matches: formatted,
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`Updating cache for ${item.date}...`);
      await supabase.from('matches_cache').upsert(record, { onConflict: 'date' });
    }
  }
  console.log('DONE.');
}

run();
