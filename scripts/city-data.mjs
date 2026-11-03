import { ORIGIN, EXTENT, project, geographicBounds } from '../src/geo.js';

export function overpassQuery() {
  const b = geographicBounds();
  const bounds = `${b.south},${b.west},${b.north},${b.east}`;
  return `[out:json][timeout:180][maxsize:134217728];(
way[building](${bounds});relation[building](${bounds});
way[highway][highway!~"proposed|construction"](${bounds});
way[natural=water](${bounds});relation[natural=water](${bounds});
way[waterway=riverbank](${bounds});relation[waterway=riverbank](${bounds});
way[leisure=park](${bounds});relation[leisure=park](${bounds});
way[landuse~"forest|grass|recreation_ground"](${bounds});
);out body geom;`;
}
export function metres(value) {
  if (value == null) return null;
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*(m|metres|meters|ft|feet|')?$/i);
  if (!match) return null;
  return Number(match[1]) * (/^(ft|feet|')$/i.test(match[2] || '') ? 0.3048 : 1);
}
export function buildingHeight(tags) {
  const height = metres(tags.height);
  if (height > 0 && height < 1000) return { height, heightSource: 'osm-height' };
  const levels = Number(tags['building:levels']);
  if (levels > 0 && levels < 200) return { height: levels * 3, heightSource: 'levels-estimate' };
  const heightByType = { house: 7, detached: 7, garage: 3, shed: 3, apartments: 15, commercial: 12, industrial: 8, church: 14 };
  return { height: heightByType[tags.building] ?? 9, heightSource: 'default-estimate' };
}
function same(a, b) { return a.lat === b.lat && a.lon === b.lon; }
export function stitchRings(segments) {
  const pending = segments.filter(s => s.length > 1).map(s => [...s]), rings = [];
  let incomplete = 0;
  while (pending.length) {
    const ring = pending.pop();
    while (!same(ring[0], ring.at(-1))) {
      const i = pending.findIndex(s => same(ring.at(-1), s[0]) || same(ring.at(-1), s.at(-1)) || same(ring[0], s[0]) || same(ring[0], s.at(-1)));
      if (i < 0) break;
      let part = pending.splice(i, 1)[0];
      if (same(ring.at(-1), part[0])) ring.push(...part.slice(1));
      else if (same(ring.at(-1), part.at(-1))) ring.push(...part.reverse().slice(1));
      else { if (same(ring[0], part[0])) part.reverse(); ring.unshift(...part.slice(0, -1)); }
    }
    if (ring.length >= 4 && same(ring[0], ring.at(-1))) rings.push(ring);
    else incomplete++;
  }
  return { rings, incomplete };
}
function inside(point, ring) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}
const round = n => Math.round(n * 10) / 10;
function metricRing(ring) { return ring.map(p => { const [x, , z] = project(p.lat, p.lon); return [round(x), round(z)]; }); }
function kind(tags) {
  if (tags.building && tags.building !== 'no') return 'building';
  if (tags.highway) return 'road';
  if (tags.natural === 'water' || tags.waterway === 'riverbank') return 'water';
  if (tags.leisure === 'park' || /^(forest|grass|recreation_ground)$/.test(tags.landuse || '')) return 'park';
  return null;
}
export function convertOSM(raw) {
  if (!Array.isArray(raw.elements) || raw.remark) throw new Error(`Incomplete OSM response: ${raw.remark || 'missing elements'}`);
  const features = [], used = new Set(), warnings = [];
  for (const relation of raw.elements.filter(e => e.type === 'relation')) {
    const type = kind(relation.tags || {});
    if (!type || type === 'road') continue;
    const members = (relation.members || []).filter(m => m.type === 'way' && Array.isArray(m.geometry));
    if (members.some(m => m.geometry.some(p => !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)))) { warnings.push(`Invalid multipolygon relation/${relation.id}; omitted`); continue; }
    const outer = stitchRings(members.filter(m => !m.role || m.role === 'outer').map(m => m.geometry));
    const inner = stitchRings(members.filter(m => m.role === 'inner').map(m => m.geometry));
    if (outer.incomplete || inner.incomplete) { warnings.push(`Unclosed multipolygon relation/${relation.id}; omitted to avoid invented geometry`); continue; }
    if (!outer.rings.length) continue;
    const holes = inner.rings.map(metricRing);
    const polygons = outer.rings.map(metricRing).map(ring => [ring, ...holes.filter(h => inside(h[0], ring))]);
    features.push(feature(relation, type, polygons));
    members.forEach(m => used.add(m.ref));
  }
  for (const way of raw.elements.filter(e => e.type === 'way')) {
    const type = kind(way.tags || {}), points = way.geometry;
    if (!type || used.has(way.id) || !Array.isArray(points) || points.some(p => !Number.isFinite(p.lat) || !Number.isFinite(p.lon))) continue;
    if (type === 'road') { if (points.length > 1) features.push(feature(way, type, metricRing(points))); }
    else if (points.length >= 4 && same(points[0], points.at(-1))) features.push(feature(way, type, [[metricRing(points)]]));
    else warnings.push(`Unclosed way/${way.id}; omitted`);
  }
  return {
    version: 1, origin: ORIGIN, extent: EXTENT, units: 'metres',
    projection: 'WGS84 local east/south tangent plane; elevation in metres, no vertical exaggeration',
    source: { name: 'OpenStreetMap contributors', license: 'ODbL-1.0', url: 'https://www.openstreetmap.org/copyright', timestamp: raw.osm3s?.timestamp_osm_base || null },
    features, warnings,
    statistics: { buildings: features.filter(f => f.type === 'building').length, roads: features.filter(f => f.type === 'road').length, measuredHeights: features.filter(f => f.heightSource === 'osm-height').length },
  };
}
function feature(element, type, coordinates) {
  const tags = element.tags || {};
  return {
    id: `${element.type}/${element.id}`, type, name: tags.name || '', coordinates,
    ...(type === 'building' ? { ...buildingHeight(tags), minHeight: metres(tags.min_height) || 0 } : {}),
    ...(type === 'road' ? { roadClass: tags.highway, width: metres(tags.width) || null, widthSource: metres(tags.width) ? 'osm-width' : 'unknown' } : {}),
  };
}
