import { EXTENT, unproject } from '../src/geo.js';
export const TERRAIN_ZOOM = 13;
export const TERRAIN_STEP = 50;
export function terrariumHeight(red, green, blue) {
  return red * 256 + green + blue / 256 - 32768;
}
export function terrainPixel(lat, lon, zoom = TERRAIN_ZOOM) {
  const size = 256 * 2 ** zoom, phi = lat * Math.PI / 180;
  return { x: (lon + 180) / 360 * size - 0.5, y: (1 - Math.asinh(Math.tan(phi)) / Math.PI) / 2 * size - 0.5 };
}
export function terrainGrid() {
  const columns = (EXTENT.east - EXTENT.west) / TERRAIN_STEP + 1;
  const rows = (EXTENT.south - EXTENT.north) / TERRAIN_STEP + 1;
  const coordinates = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const x = EXTENT.west + column * TERRAIN_STEP, z = EXTENT.north + row * TERRAIN_STEP;
    const point = unproject(x, z);
    coordinates.push({ worldX: x, worldZ: z, ...terrainPixel(point.lat, point.lon) });
  }
  return { columns, rows, coordinates };
}
export function sampleHeight(pixel, read) {
  const x = Math.floor(pixel.x), y = Math.floor(pixel.y), u = pixel.x - x, v = pixel.y - y;
  return read(x, y) * (1 - u) * (1 - v) + read(x + 1, y) * u * (1 - v) + read(x, y + 1) * (1 - u) * v + read(x + 1, y + 1) * u * v;
}
