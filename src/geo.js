// WGS84 local tangent plane: X east, Z south; one scene unit is one metre.
// Horizontal distortion remains below 1 ppm within the selected 8 × 6 km area.
export const ORIGIN = Object.freeze({ lat: 46.815, lon: -71.225 });
export const EXTENT = Object.freeze({ west: -4000, east: 4000, north: -3000, south: 3000 });
const RAD = Math.PI / 180;
const A = 6378137;
const E2 = 6.6943799901413165e-3;
function ecef(lat, lon) {
  const phi = lat * RAD, lambda = lon * RAD;
  const n = A / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
  return [n * Math.cos(phi) * Math.cos(lambda), n * Math.cos(phi) * Math.sin(lambda), n * (1 - E2) * Math.sin(phi)];
}
const origin = ecef(ORIGIN.lat, ORIGIN.lon);
const phi = ORIGIN.lat * RAD, lambda = ORIGIN.lon * RAD;
export function project(lat, lon, elevation = 0) {
  if (![lat, lon, elevation].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Invalid WGS84 coordinate');
  const delta = ecef(lat, lon).map((value, i) => value - origin[i]);
  return [
    -Math.sin(lambda) * delta[0] + Math.cos(lambda) * delta[1],
    elevation,
    Math.sin(phi) * Math.cos(lambda) * delta[0] + Math.sin(phi) * Math.sin(lambda) * delta[1] - Math.cos(phi) * delta[2],
  ];
}
export function unproject(x, z) {
  if (![x, z].every(Number.isFinite)) throw new Error('Invalid metric coordinate');
  let lat = ORIGIN.lat - z / 111200;
  let lon = ORIGIN.lon + x / (111200 * Math.cos(phi));
  for (let i = 0; i < 5; i++) {
    const p = project(lat, lon), step = 0.00001;
    const a = project(lat + step, lon), b = project(lat, lon + step);
    const ax = (a[0] - p[0]) / step, az = (a[2] - p[2]) / step;
    const bx = (b[0] - p[0]) / step, bz = (b[2] - p[2]) / step;
    const dx = x - p[0], dz = z - p[2], det = ax * bz - az * bx;
    lat += (dx * bz - dz * bx) / det;
    lon += (ax * dz - az * dx) / det;
  }
  return { lat, lon };
}
export function geographicBounds(extent = EXTENT) {
  const corners = [unproject(extent.west, extent.north), unproject(extent.east, extent.north), unproject(extent.west, extent.south), unproject(extent.east, extent.south)];
  return { south: Math.min(...corners.map(p => p.lat)), west: Math.min(...corners.map(p => p.lon)), north: Math.max(...corners.map(p => p.lat)), east: Math.max(...corners.map(p => p.lon)) };
}
