import { spawnSync } from 'child_process';

// Direct test of spawnSync in project context
const url = 'https://1xbet.bj/service-api/LineFeed/GetSportsZip?sports=1&lng=fr&tf=255&tz=3&mode=4&partner=1014';

const r = spawnSync('curl.exe', [
  '-s', '-L', '--ssl-no-revoke',
  '--compressed',
  '-H', 'User-Agent: Mozilla/5.0',
  '-H', 'X-Requested-With: XMLHttpRequest',
  '--max-time', '20',
  url
], { maxBuffer: 50 * 1024 * 1024, timeout: 25000 });

console.log('status:', r.status);
console.log('error:', r.error);
console.log('stdout bytes:', r.stdout?.length ?? 'null');
console.log('stderr:', r.stderr?.toString()?.substring(0, 200));

if (r.stdout && r.stdout.length > 0) {
  const text = r.stdout.toString('utf8');
  console.log('First 300:', text.substring(0, 300));
  const json = JSON.parse(text);
  const football = json.Value?.find((s: any) => s.I === 1);
  console.log('Football matches:', football?.L?.reduce((acc: number, l: any) => acc + (l.GC || 0), 0));
}
