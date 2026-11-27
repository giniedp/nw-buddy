/**
 * World rectangle in meters, x east and y north
 */
export interface WorldRect {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * A world map tile of the game (`lyshineui/worldtiles/<map>/map_l<level>_y<y>_x<x>`) and the world rectangle it covers
 */
export interface MapTile {
  path: string
  minX: number
  minY: number
  size: number
}

/**
 * World meters of a level 1 tile, the finest level. Each level above doubles the size.
 */
export const MAP_TILE_SIZE = 256

/**
 * The coarsest tile level of the game
 */
const MAX_TILE_LEVEL = 8

/**
 * The world rectangle of the regions of a level
 */
/**
 * The play area of a level's game mode: `WorldBounds` of its game mode maps (`x,y,width,height`). Null without bounds,
 * and when the maps disagree (the open world hosts many game modes, the level alone does not tell which one).
 */
export function gameModeBounds(info: { gameModeMaps?: Array<{ worldBounds?: string[] }> }): WorldRect | null {
  const rects = (info.gameModeMaps ?? [])
    .map((it) => (it.worldBounds ?? []).map(Number))
    .filter((it) => it.length === 4 && it.every((value) => Number.isFinite(value)) && it[2] > 0 && it[3] > 0)
    .map(([x, y, width, height]) => ({ minX: x, minY: y, maxX: x + width, maxY: y + height }))
  const first = rects[0]
  if (!first) {
    return null
  }
  const same = rects.every((it) => {
    return it.minX === first.minX && it.minY === first.minY && it.maxX === first.maxX && it.maxY === first.maxY
  })
  return same ? first : null
}

export function levelRect(info: { regionSize: number; regions: Array<{ location: [number, number] }> }): WorldRect {
  if (!info.regions.length) {
    return null
  }
  const xs = info.regions.map((it) => it.location[0])
  const ys = info.regions.map((it) => it.location[1])
  return {
    minX: Math.min(...xs) * info.regionSize,
    minY: Math.min(...ys) * info.regionSize,
    maxX: (Math.max(...xs) + 1) * info.regionSize,
    maxY: (Math.max(...ys) + 1) * info.regionSize,
  }
}

/**
 * The tiles of the coarsest level that still has at most `perSide` tiles across the longer side of `rect`.
 * Tile file indices are in level 1 tiles, so a tile of level `n` has indices in steps of `2^(n-1)`.
 */
export function coarseMapTiles(mapId: string, rect: WorldRect, perSide = 2): MapTile[] {
  const extent = Math.max(rect.maxX - rect.minX, rect.maxY - rect.minY)
  let level = 1
  while (level < MAX_TILE_LEVEL && MAP_TILE_SIZE * 2 ** (level - 1) * perSide < extent) {
    level++
  }
  const step = 2 ** (level - 1)
  const size = MAP_TILE_SIZE * step
  const tiles: MapTile[] = []
  for (let y = Math.floor(rect.minY / size); y * size < rect.maxY; y++) {
    for (let x = Math.floor(rect.minX / size); x * size < rect.maxX; x++) {
      tiles.push({
        path: `lyshineui/worldtiles/${mapId}/map_l${level}_y${pad(y * step)}_x${pad(x * step)}.webp`,
        minX: x * size,
        minY: y * size,
        size,
      })
    }
  }
  return tiles
}

function pad(value: number) {
  return String(value).padStart(3, '0')
}
