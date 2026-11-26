import type { TerritoryInfo } from './protocol'

/**
 * Point in polygon lookup over territory, zone and POI areas
 */
export class TerritoryIndex {
  private items: Array<TerritoryInfo & { box: [number, number, number, number] }> = []

  public set(territories: TerritoryInfo[]) {
    this.items = territories.map((t) => {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const [x, y] of t.polygon) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
      return { ...t, box: [minX, minY, maxX, maxY] }
    })
  }

  /**
   * Audio state of the given group at the position, e.g. `MX_Territory` → `Brightwoods`.
   * When areas overlap, the smallest area wins (like the game's `SmallestAudioState`).
   */
  public stateAt(group: string, x: number, y: number): string | null {
    let best: string | null = null
    let bestArea = Infinity
    for (const item of this.items) {
      if (item.audioGroup !== group || !item.audioState) {
        continue
      }
      const [minX, minY, maxX, maxY] = item.box
      if (x < minX || x > maxX || y < minY || y > maxY) {
        continue
      }
      if (!pointInPolygon(x, y, item.polygon)) {
        continue
      }
      const area = (maxX - minX) * (maxY - minY)
      if (area < bestArea) {
        bestArea = area
        best = item.audioState
      }
    }
    return best
  }
}

export function pointInPolygon(x: number, y: number, polygon: [number, number][]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
