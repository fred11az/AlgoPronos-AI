import { spawnSync } from 'child_process';
import fs from 'fs';

const text = fs.readFileSync('entry.js', 'utf8');

// Find all strings that look like API endpoint paths
const paths = new Set<string>();
const rx = /['"`](\/service-api\/LineFeed\/[^'"`?&\s]{3,50})/g;
let m;
while ((m = rx.exec(text)) !== null) {
  paths.add(m[1]);
}

console.log('All LineFeed paths found in JS:');
Array.from(paths).forEach(p => console.log(' ', p));
