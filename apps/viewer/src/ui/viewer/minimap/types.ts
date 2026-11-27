import type { DungeonMap, DungeonMapCell } from '../../../game/catacombs/load'
import type { MapTile, WorldRect } from './mapTiles'
import type { MapSize, MapView } from './mapView'

export interface MinimapCamera {
  x: number
  y: number
  z: number
  /**
   * The direction the camera looks along, on the map plane (not normalized, zero when it looks straight down)
   */
  lookX: number
  lookY: number
}

export interface MinimapState {
  /**
   * The level shown, null without a level
   */
  level: string | null
  /**
   * The world rectangle of the level's regions
   */
  rect: WorldRect | null
  /**
   * The map tiles of the level, with their urls
   */
  tiles: Array<MapTile & { url: string }>
  /**
   * Tiles that failed to load. The level has no map when all failed: the grid still shows and teleports.
   */
  failed: number
  view: MapView | null
  size: MapSize
  readonly camera: MinimapCamera | null
  /**
   * The generated dungeon of the level (the catacombs)
   */
  readonly dungeon: DungeonMap | null
  /**
   * The map images of the dungeon's cells, with their urls
   */
  readonly dungeonTiles: Array<DungeonMapCell & { url: string }>
}
