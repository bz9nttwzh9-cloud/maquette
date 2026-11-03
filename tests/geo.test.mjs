import test from 'node:test';
import assert from 'node:assert/strict';
import { ORIGIN, EXTENT, project, unproject, geographicBounds } from '../src/geo.js';
import { buildingHeight, convertOSM, metres, stitchRings } from '../scripts/city-data.mjs';

test('WGS84 origin and metric axes preserve elevation without exaggeration', () => {
  assert.deepEqual(project(ORIGIN.lat, ORIGIN.lon, 85), [0, 85, 0]);
  const north = project(ORIGIN.lat + 0.001, ORIGIN.lon);
  const east = project(ORIGIN.lat, ORIGIN.lon + 0.001);
  assert.ok(north[2] < -111 && north[2] > -111.3);
  assert.ok(east[0] > 76 && east[0] < 77);
  assert.ok(Math.abs(north[0]) < 0.001);
  assert.throws(() => project(NaN, 0));
});
test('all extent corners roundtrip between WGS84 and metric space within a millimetre', () => {
  for (const x of [EXTENT.west, 0, EXTENT.east]) for (const z of [EXTENT.north, 0, EXTENT.south]) {
    const p = unproject(x, z), q = project(p.lat, p.lon);
    assert.ok(Math.abs(q[0] - x) < 0.001);
    assert.ok(Math.abs(q[2] - z) < 0.001);
  }
  const b = geographicBounds();
  assert.ok(b.west < -71.27 && b.east > -71.18 && b.south < 46.79 && b.north > 46.84);
});
test('measured building heights are separate from levels and default estimates', () => {
  assert.equal(metres('100 ft'), 30.48);
  assert.equal(metres('unknown'), null);
  assert.deepEqual(buildingHeight({ height: '20 m', 'building:levels': '9' }), { height: 20, heightSource: 'osm-height' });
  assert.deepEqual(buildingHeight({ 'building:levels': '4' }), { height: 12, heightSource: 'levels-estimate' });
  assert.equal(buildingHeight({ building: 'house' }).heightSource, 'default-estimate');
});
const point = (lat, lon) => ({ lat, lon });
const ring = [point(46.81, -71.22), point(46.81, -71.219), point(46.811, -71.219), point(46.811, -71.22), point(46.81, -71.22)];
test('multipolygon stitching handles reversed segments and rejects open rings', () => {
  assert.equal(stitchRings([ring.slice(0, 3), ring.slice(2).reverse()]).rings.length, 1);
  assert.equal(stitchRings([ring.slice(0, 3)]).incomplete, 1);
});
test('OSM converter preserves footprints, holes, provenance and avoids relation duplicates', () => {
  const hole = ring.map(p => point(46.8103 + (p.lat - 46.81) * 0.2, -71.2197 + (p.lon + 71.22) * 0.2));
  const raw = { elements: [
    { type: 'relation', id: 1, tags: { building: 'yes', height: '20' }, members: [{ type: 'way', ref: 2, role: 'outer', geometry: ring }, { type: 'way', ref: 3, role: 'inner', geometry: hole }] },
    { type: 'way', id: 2, tags: { building: 'yes' }, geometry: ring },
    { type: 'way', id: 4, tags: { highway: 'residential' }, geometry: ring.slice(0, 2) },
    { type: 'way', id: 5, tags: { building: 'house' }, geometry: ring.slice(0, 2) },
  ] };
  const result = convertOSM(raw);
  assert.equal(result.statistics.buildings, 1);
  assert.equal(result.statistics.roads, 1);
  assert.equal(result.statistics.measuredHeights, 1);
  assert.equal(result.features[0].coordinates[0].length, 2);
  assert.equal(result.features[0].heightSource, 'osm-height');
  assert.equal(result.warnings.length, 1);
  assert.equal(result.units, 'metres');
  assert.equal(result.source.license, 'ODbL-1.0');
  assert.throws(() => convertOSM({ elements: [], remark: 'runtime timeout' }), /Incomplete/);
});

test('Terrarium decoder and interpolation preserve metric elevation', async () => {
  const { terrariumHeight, sampleHeight, terrainGrid } = await import('../scripts/terrain-data.mjs');
  assert.equal(terrariumHeight(128, 0, 0), 0);
  assert.equal(terrariumHeight(128, 85, 128), 85.5);
  assert.equal(terrariumHeight(127, 255, 0), -1);
  assert.equal(sampleHeight({ x: 0.5, y: 0.5 }, (x, y) => x * 100 + y * 20), 60);
  const grid = terrainGrid();
  assert.equal(grid.columns, 161);
  assert.equal(grid.rows, 121);
  assert.equal(grid.coordinates.length, 19481);
});
