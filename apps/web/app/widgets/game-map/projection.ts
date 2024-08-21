// Lat Long Coordinate System
//   +------(+90)------+
//   |        |        |
//   |        |        |
//  -180-----0.0-----+180
//   |        |        |
//   |        |        |
//   +------(-90)------+
//
// Mercator Coordinate System
// https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/
//   0-----------------1
//   |                 |
//   |                 |
//   |                 |
//   |                 |
//   |                 |
//   1----------------1/1
//
// For New World Map Coordinate System
//  MAX_Y--------------
//   |                 |
//   |                 |
//   |                 |
//   |                 |
//   |                 |
//   0-----------------MAZ_X

import { NW_MAP_WORLD_HEIGHT, NW_MAP_WORLD_WIDTH } from './constants'

export function nwXToMercator(value: number) {
  return 0.5 + 0.5 * (value / NW_MAP_WORLD_WIDTH)
}
export function nwXFromMercator(value: number) {
  return (2 * value - 1) * NW_MAP_WORLD_WIDTH
}

export function nwYToMercator(value: number) {
  return 0.5 * (1 - value / NW_MAP_WORLD_HEIGHT)
}

export function nwYFromMercator(value: number) {
  return NW_MAP_WORLD_HEIGHT * (1 - 2 * value)
}

export function mercatorXfromLng(lng: number) {
  return (180 + lng) / 360
}

export function mercatorYfromLat(lat: number) {
  return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360
}

export function lngFromMercatorX(x: number) {
  return x * 360 - 180
}

export function latFromMercatorY(y: number) {
  const y2 = 180 - y * 360
  return (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90
}
