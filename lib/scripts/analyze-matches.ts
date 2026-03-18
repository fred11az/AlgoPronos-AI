import fs from 'fs';

function main() {
  try {
    const content = fs.readFileSync('get1x2.json', 'utf8');
    const d = JSON.parse(content);

    if (!d.Value) {
      console.log('No Value in JSON');
      return;
    }

    const matches: any[] = [];

    const processLeague = (league: any) => {
      // Direct games in league
      if (league.G) {
        league.G.forEach((g: any) => {
          matches.push({
            id: g.I,
            home: g.O1,
            away: g.O2,
            league: league.L || league.LE,
            score: g.SC?.FS?.S1 !== undefined ? `${g.SC.FS.S1}-${g.SC.FS.S2}` : null,
            time: g.ST,
            odds: g.E?.filter((e: any) => [1, 2, 3].includes(e.T)).map((e: any) => ({ t: e.T, c: e.C }))
          });
        });
      }
      // Sub-leagues
      if (league.L && Array.isArray(league.L)) {
        league.L.forEach(processLeague);
      }
    };

    d.Value.forEach(processLeague);

    console.log(`Extracted ${matches.length} matches.`);
    if (matches.length > 0) {
      console.log('Sample Matches:');
      matches.slice(0, 10).forEach(m => {
        console.log(`- ${m.home} vs ${m.away} (${m.league}) | ID: ${m.id} | Score: ${m.score || 'N/A'}`);
      });
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

main();
