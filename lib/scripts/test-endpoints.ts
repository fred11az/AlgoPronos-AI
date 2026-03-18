import { spawnSync } from 'child_process';

const baseParams = 'lng=fr&tf=255&tz=3&mode=4&partner=1014';
const leagueId = 119599;

const tests = [
  `service-api/LineFeed/GetChampZip?champId=${leagueId}&${baseParams}`,
  `service-api/LineFeed/GetSportsShortZip?sports=1&${baseParams}`,
  `service-api/restcore/api/External/v1/Web/Sports?sports=1&${baseParams}`,
  `api/external/web/sportSection/v1/topChamps?sportId=1&${baseParams}`,
  `service-api/main-line-feed/betbuilder/v2/events?sportId=1&${baseParams}`,
];

tests.forEach(path => {
  const url = `https://1xbet.bj/${path}`;
  const r = spawnSync('curl.exe', [
    '-s', '-L', '--ssl-no-revoke',
    '-H', 'User-Agent: Mozilla/5.0',
    '-H', 'X-Requested-With: XMLHttpRequest',
    '-H', 'Accept: application/json',
    '--max-time', '8',
    url
  ], { maxBuffer: 10 * 1024 * 1024, timeout: 10000 });
  
  const out = r.stdout.toString('utf8');
  const name = path.split('/').slice(-1)[0].split('?')[0];
  const isHTML = out.includes('<?xml') || out.includes('<!DOCTYPE');
  console.log(`[${r.stdout.length}b] ${name}: ${isHTML ? '❌ HTML error' : '✅ ' + out.substring(0, 200)}`);
  console.log('---');
});
