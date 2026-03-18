import { spawnSync } from 'child_process';

const baseUrls = [
  'https://1xbet.bj/service-api/LineFeed/Get1x2_VZip?sports=1&lng=fr&tf=255&tz=3&mode=4&partner=1014',
  'https://1xbet.bj/service-api/LiveFeed/GetSportsZip?sports=1&getGames=1&lng=fr&tf=255&tz=3&mode=1&partner=1014',
  'https://1xbet.bj/service-api/LiveFeed/WebGetTopChampsZip?sportId=1&lng=fr&partner=1014',
  'https://1xbet.bj/service-api/LineFeed/GetExpressDayExtendedZip?sportId=1&lng=fr&partner=1014',
  'https://1xbet.bj/service-api/LiveFeed/GetLiveExpressExtendedZip?sportId=1&lng=fr&partner=1014'
];

async function test() {
  for (const url of baseUrls) {
    console.log(`Testing: ${url.split('?')[0].split('/').slice(-2).join('/')}`);
    const isVZip = url.includes('Zip');
    const r = spawnSync('curl.exe', [
      '-s', '-L', '--ssl-no-revoke',
      ...(isVZip ? ['--compressed'] : []),
      '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '-H', 'X-Requested-With: XMLHttpRequest',
      '--max-time', '15',
      url
    ], { maxBuffer: 50 * 1024 * 1024, timeout: 20000 });

    console.log(`  Status: ${r.status}, Size: ${r.stdout.length} bytes`);
    if (r.stdout.length > 50) {
      const text = r.stdout.toString('utf8');
      if (text.startsWith('{')) {
        const d = JSON.parse(text);
        console.log(`  Success: ${d.Success}`);
        const findGames = (n: any): any[] | null => {
          if (n.G && n.G.length > 0) return n.G;
          if (n.L && Array.isArray(n.L)) {
            for (let s of n.L) {
              let g = findGames(s);
              if (g) return g;
            }
          }
          if (n.Value && Array.isArray(n.Value)) {
            for (let s of n.Value) {
              let g = findGames(s);
              if (g) return g;
            }
          }
          if (n.Value && n.Value.E) return n.Value.E; // Express format
          return null;
        };
        const games = findGames(d);
        if (games) {
          console.log(`  ✅ GAMES FOUND: ${games.length}`);
          const g = games[0];
          console.log(`  Example: ${g.O1 || g.L || 'N/A'} vs ${g.O2 || 'N/A'} | ID: ${g.I || g.ID}`);
        } else {
          console.log('  ❌ No games in JSON tree');
        }
      } else {
        console.log(`  ❌ Not JSON: ${text.substring(0, 100)}`);
      }
    }
    console.log('---');
  }
}

test();
