import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { EXTENT, ORIGIN } from '../src/geo.js';
import { TERRAIN_ZOOM, TERRAIN_STEP, terrainGrid, terrariumHeight, sampleHeight } from './terrain-data.mjs';

const grid = terrainGrid(), required = new Set(), tiles = new Map();
for (const p of grid.coordinates) for (const dx of [0, 1]) for (const dy of [0, 1]) required.add(`${Math.floor((Math.floor(p.x) + dx) / 256)}/${Math.floor((Math.floor(p.y) + dy) / 256)}`);
const local = process.argv[2];
if (!local) throw new Error('Usage: node scripts/import-terrain.mjs --download | /path/to/terrarium-tiles');
for (const key of required) {
  const bytes = local === '--download'
    ? execFileSync('curl', ['--fail', '--silent', '--show-error', '--max-time', '60', `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${TERRAIN_ZOOM}/${key}.png`], { maxBuffer: 2 * 1024 * 1024 })
    : await readFile(`${local}/${TERRAIN_ZOOM}/${key}.png`);
  const png = PNG.sync.read(bytes, { checkCRC: true });
  if (png.width !== 256 || png.height !== 256) throw new Error(`Invalid terrain tile dimensions: ${key}`);
  tiles.set(key, png);
  console.log(`Validated terrain tile ${TERRAIN_ZOOM}/${key}`);
}
function pixelHeight(x, y) {
  const tileX = Math.floor(x / 256), tileY = Math.floor(y / 256);
  const tile = tiles.get(`${tileX}/${tileY}`);
  if (!tile) throw new Error(`Missing elevation tile ${tileX}/${tileY}`);
  const offset = ((y - tileY * 256) * 256 + (x - tileX * 256)) * 4;
  if (tile.data[offset + 3] !== 255) throw new Error('Terrain tile contains missing elevation data');
  return terrariumHeight(...tile.data.subarray(offset, offset + 3));
}
const heights = grid.coordinates.map(p => Math.round(sampleHeight(p, pixelHeight) * 10) / 10);
if (heights.some(h => !Number.isFinite(h) || h < -500 || h > 2000)) throw new Error('Elevation values outside plausible regional range');
const terrain = {
  version: 1, origin: ORIGIN, extent: EXTENT, units: 'metres', verticalExaggeration: 1,
  columns: grid.columns, rows: grid.rows, step: TERRAIN_STEP, heights,
  source: { name: 'Mapzen Terrain Tiles / AWS Open Data', url: 'https://registry.opendata.aws/terrain-tiles/', attribution: 'Mapzen; terrain data sources and licenses: https://github.com/tilezen/joerd/blob/master/docs/attribution.md', zoom: TERRAIN_ZOOM, importedAt: new Date().toISOString() },
  limitations: 'Elevation raster sampled at 50 m; interpolated terrain, not a cadastral or survey-grade surface. Grid spacing is not source accuracy.',
};
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/quebec-terrain.json', import.meta.url), JSON.stringify(terrain));
console.log(`Saved ${grid.columns} × ${grid.rows} elevations, range ${Math.min(...heights)}–${Math.max(...heights)} m.`);
