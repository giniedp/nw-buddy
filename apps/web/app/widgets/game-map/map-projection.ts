// Geographic Coordinate System
// - this is used as interface into maplibre
//   ┌──────────(+90)──────────┐
//   │            │            │
//   │            │            │
//  -180─────────0.0─────────+180
//   │            │            │
//   │            │            │
//   └──────────(-90)──────────┚
//
// Mercator Coordinate System https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/
// - this is internal rendering system of maplibre
// - 0/0 in geographic is 0.5/0.5 in mercator
//   0─────────────────────────1
//   │                         │
//   │                         │
//   │                         │
//   │                         │
//   │                         │
//   1────────────────────────1/1

// some magic numbers that make our projection and heightmap scaling work
// keeps the world small to avoid imprecision at geographic poles
const MAX_UNITS = Math.pow(2, 25)
const MAX_LEVEL = 18
const BIAS = 375
export const HEIGHT_SCALE = (2048 + BIAS) / 0xffffff
export const NW_MAP_REGION_SIZE = 2048

export function mapLevelToNwLevel(level: number) {
  return MAX_LEVEL - level
}

export function nwLeveflToMapLevel(level: number) {
  return MAX_LEVEL - level
}

export function nwXToMercator(value: number) {
  return 0.5 + value / MAX_UNITS
}
export function nwXFromMercator(value: number) {
  return (value - 0.5) * MAX_UNITS
}

export function nwYToMercator(value: number) {
  return 0.5 - value / MAX_UNITS
}

export function nwYFromMercator(value: number) {
  return (0.5 - value) * MAX_UNITS
}

export function mercatorXfromLong(value: number) {
  return 0.5 + value / 360
}

export function mercatorYfromLat(lat: number) {
  return (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2
}

export function longFromMercatorX(x: number) {
  return (x - 0.5) * 360
}

export function latFromMercatorY(y: number) {
  return (180 / Math.PI) * Math.atan(Math.sinh(Math.PI * (1 - 2 * y)))
}

const EARTH_RADIUS = 6371008.8 // meters

export function xToLong(x: number) {
  return longFromMercatorX(nwXToMercator(x))
}
export function yToLat(y: number) {
  return latFromMercatorY(nwYToMercator(y))
}

export function xFromLong(value: number) {
  return nwXFromMercator(mercatorXfromLong(value))
}
export function yFromLat(value: number) {
  return nwYFromMercator(mercatorYfromLat(value))
}

export function xyFromLngLat([long, lat]: [number, number]) {
  return [xFromLong(long), yFromLat(lat)]
}

export function xyToLongLat([x, y]: [number, number]) {
  return [xToLong(x), yToLat(y)]
}

export function boundsToLatLong([x, y, x1, y1]: [number, number, number, number]): [number, number, number, number] {
  return [xToLong(x), yToLat(y), xToLong(x1), yToLat(y1)]
}

export function projectTileAddress({ x, y, z }: { x: number; y: number; z: number }) {
  x -= Math.pow(2, z - 1)
  y = Math.pow(2, z - 1) - y - 1

  const level = mapLevelToNwLevel(z)
  const step = Math.max(Math.pow(2, level - 1), 1)
  return {
    z: level,
    x: x * step,
    y: y * step,
  }
}
