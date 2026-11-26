import type { WorldRect } from './mapTiles'

/**
 * What the minimap shows: the world position at its center and the meters per pixel
 */
export interface MapView {
  cx: number
  cy: number
  mpp: number
}

/**
 * Pixel size of the minimap
 */
export interface MapSize {
  width: number
  height: number
}

/**
 * The closest zoom, meters per pixel
 */
export const MIN_METERS_PER_PIXEL = 0.25

/**
 * The view that shows the whole rectangle
 */
export function fitView(rect: WorldRect, size: MapSize): MapView {
  return {
    cx: (rect.minX + rect.maxX) / 2,
    cy: (rect.minY + rect.maxY) / 2,
    mpp: Math.max((rect.maxX - rect.minX) / size.width, (rect.maxY - rect.minY) / size.height),
  }
}

/**
 * Screen x of a world x, from the left edge of the map
 */
export function screenX(view: MapView, size: MapSize, x: number) {
  return (x - view.cx) / view.mpp + size.width / 2
}

/**
 * Screen y of a world y, from the top edge of the map: north is up
 */
export function screenY(view: MapView, size: MapSize, y: number) {
  return size.height / 2 - (y - view.cy) / view.mpp
}

/**
 * The world position of a point of the map, in pixels from its top left
 */
export function worldAt(view: MapView, size: MapSize, px: number, py: number) {
  return {
    x: view.cx + (px - size.width / 2) * view.mpp,
    y: view.cy - (py - size.height / 2) * view.mpp,
  }
}

/**
 * Zooms by `factor` (above 1 zooms out) and keeps the world position under the pixel `px`, `py` in place.
 * The zoom stays between {@link MIN_METERS_PER_PIXEL} and `maxMpp`.
 */
export function zoomAt(view: MapView, size: MapSize, px: number, py: number, factor: number, maxMpp: number): MapView {
  const anchor = worldAt(view, size, px, py)
  const mpp = Math.min(maxMpp, Math.max(MIN_METERS_PER_PIXEL, view.mpp * factor))
  return {
    cx: anchor.x - (px - size.width / 2) * mpp,
    cy: anchor.y + (py - size.height / 2) * mpp,
    mpp,
  }
}

/**
 * Moves the view by a drag of `dx`, `dy` pixels
 */
export function panBy(view: MapView, dx: number, dy: number): MapView {
  return {
    cx: view.cx - dx * view.mpp,
    cy: view.cy + dy * view.mpp,
    mpp: view.mpp,
  }
}

/**
 * The multiples of `step` from `min` to `max`, both inclusive
 */
export function gridLines(min: number, max: number, step: number): number[] {
  const result: number[] = []
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
    result.push(value)
  }
  return result
}
