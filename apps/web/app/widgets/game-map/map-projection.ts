// Lat Long Coordinate System
//   ┌──────────(+90)──────────┐
//   │            │            │
//   │            │            │
//  -180─────────0.0─────────+180
//   │            │            │
//   │            │            │
//   └──────────(-90)──────────┚
//
// Mercator Coordinate System
// https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/
//   0─────────────────────────1
//   │                         │
//   │                         │
//   │                         │
//   │                         │
//   │                         │
//   1────────────────────────1/1
//
// For New World Map Coordinate System
//   . . . . . . SIZE ───┐ . . .
//   .            │      │     .
//   .            │      │     .
//   . . . . . . .0─────SIZE . .
//   .            .            .
//   .            .            .
//   . . . . . . . . . . . . . .

export const NW_MAP_LEVELS = 8
export const NW_MAP_REGION_SIZE = 2048
export const NW_MAP_REGION_COUNT = 8
export const NW_MAP_WORLD_SIZE = NW_MAP_REGION_COUNT * NW_MAP_REGION_SIZE

function nwXToMercator(value: number) {
  return 0.5 + value / (4 * NW_MAP_WORLD_SIZE)
}
function nwXFromMercator(value: number) {
  return (value - 0.5) * (4 * NW_MAP_WORLD_SIZE)
}

function nwYToMercator(value: number) {
  return 0.5 - value / (4 * NW_MAP_WORLD_SIZE)
}

function nwYFromMercator(value: number) {
  return (0.5 - value) * (4 * NW_MAP_WORLD_SIZE)
}

function mercatorXfromLng(lng: number) {
  return 0.5 + lng / 360
}

function mercatorYfromLat(lat: number) {
  return (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2
}

function lngFromMercatorX(x: number) {
  return (x - 0.5) * 360
}

function latFromMercatorY(y: number) {
  return (180 / Math.PI) * Math.atan(Math.sinh(Math.PI * (1 - 2 * y)))
}

export function xToLng(x: number) {
  return lngFromMercatorX(nwXToMercator(x))
}
export function yToLat(y: number) {
  return latFromMercatorY(nwYToMercator(y))
}

export function xFromLng(lng: number) {
  return nwXFromMercator(mercatorXfromLng(lng))
}
export function yFromLat(lat: number) {
  return nwYFromMercator(mercatorYfromLat(lat))
}

export function xyFromLngLat([lng, lat]: [number, number]) {
  return [xFromLng(lng), yFromLat(lat)]
}

export function xyToLngLat([x, y]: [number, number]) {
  return [xToLng(x), yToLat(y)]
}

export function boundsToLatLng([x, y, x1, y1]: [number, number, number, number]): [number, number, number, number] {
  return [xToLng(x), yToLat(y), xToLng(x1), yToLat(y1)]
}

export function projectTileAddress({ x, y, z }: { x: number; y: number; z: number }) {
  //   ┌──────────(+90)──────────┐
  //   │            │___         │
  //   │            │   |<- our world
  //  -180─────────0.0─────────+180
  //   │            │            │
  //   │            │            │
  //   └──────────(-90)──────────┚
  // x/y tile counting
  //  - origin at top left
  //  - direction left to right and top to bottom
  // we need to project to
  //  - origin at center
  //  - direction left to right and bottom to top
  x -= Math.pow(2, z - 1)
  y = Math.pow(2, z - 1) - y - 1

  const level = NW_MAP_LEVELS - z
  const step = Math.max(Math.pow(2, level), 1)
  return {
    z: level + 1,
    x: x * step,
    y: y * step,
  }
}
