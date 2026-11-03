// Acquire once at development time; future scene data will be bundled for offline use.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { overpassQuery, convertOSM } from './city-data.mjs';

const input = process.argv[2];
let raw;
if (input === '--download') {
  // curl respects the environment's HTTPS proxy and CA trust; no bypass or TLS override.
  raw = JSON.parse(execFileSync('curl', ['--fail', '--silent', '--show-error', '--max-time', '240', '--retry', '1', '--data-urlencode', `data=${overpassQuery()}`, 'https://overpass-api.de/api/interpreter'], { maxBuffer: 160 * 1024 * 1024, encoding: 'utf8' }));
} else if (input) raw = JSON.parse(await readFile(input, 'utf8'));
else throw new Error('Usage: node scripts/import-city.mjs --download | path/to/overpass.json');
const data = convertOSM(raw);
if (!data.statistics.buildings || !data.statistics.roads) throw new Error('Refusing incomplete city data without buildings and roads');
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/quebec-city.json', import.meta.url), JSON.stringify(data));
console.log(JSON.stringify(data.statistics));
console.log(`${data.warnings.length} geometry warnings; see data/quebec-city.json.`);
