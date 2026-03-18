import fs from 'fs';

const text = fs.readFileSync('sports_response.bin', 'utf8');
const json = JSON.parse(text);

// Find football
const football = json.Value?.find((s: any) => s.I === 1);
if (!football) { console.log('No football'); process.exit(1); }

console.log('Football keys:', Object.keys(football));
console.log('L (leagues) count:', football.L?.length);

if (football.L && football.L.length > 0) {
  const league = football.L[0];
  console.log('\nFirst league:', JSON.stringify(league, null, 2));
  
  if (league.G) {
    console.log('\nGames in first league:', league.G.length);
    console.log('Sample game:', JSON.stringify(league.G[0], null, 2));
  } else {
    console.log('\nNo G (games) in league. League subkeys:', Object.keys(league));
  }
}
