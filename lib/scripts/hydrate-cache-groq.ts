
import 'dotenv/config';
import { createAdminClient } from '../supabase/server';

const geminiKey = process.env.GEMINI_API_KEY;
const baseUrl = geminiKey
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
  : '';

async function extractMatches(searchText: string, date: string) {
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

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
  });

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

async function run() {
  const supabase = createAdminClient();
  
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
  
  Football Matches: Tuesday, March 17, 2026 (Champions League & More)
  - Manchester City vs. Real Madrid: Home 1.53, Draw 5.74, Away 5.50.
  - Sporting vs. Bodø/Glimt: Home 1.57, Draw 4.75, Away 4.50.
  - Arsenal vs. Bayer 04: Home 1.29, Draw 5.50, Away 9.50.
  - Chelsea vs. Paris SG: Home 2.05, Draw 4.20, Away 2.88.
  - Stockport County vs. Northampton Town: Home 1.49, Draw 4.10, Away 5.73.
  - Palermo vs. Juve Stabia: Home 1.74, Draw 3.55, Away 4.58.
  - Venezia vs. Padova: Home 1.33, Draw 4.90, Away 8.40.
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
      const formatted = item.matches.map((m: any) => ({
        id: `groq-sync-${item.date}-${Math.random().toString(36).substr(2, 5)}`,
        ...m,
        leagueCode: m.league.includes('Premier League') ? 'PL' : 
                    m.league.includes('Champions League') ? 'CL' : 'TOP',
        date: item.date,
        status: 'scheduled'
      }));

      const record = {
        date: item.date,
        leagues: Array.from(new Set(formatted.map((m: any) => m.leagueCode))),
        matches: formatted,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`Updating cache for ${item.date}...`);
      await supabase.from('matches_cache').upsert(record, { onConflict: 'date' });
    }
  }
  console.log('DONE.');
}

run();
