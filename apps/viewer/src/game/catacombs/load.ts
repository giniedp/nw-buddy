import { mat4CreateRotationZ, mat4CreateTranslationXYZ, mat4Multiply } from '@gglib/math'
import {
  assetReferenceKey,
  PrefabSpawnerComponentName,
  type AssetReference,
  type Mat4Data,
  type ViewerEntity,
  type ViewerPrefabSpawnerComponent,
  type ViewerSlice,
} from '../../api'
import { NwbtClient } from '../../api/browse'
import type { ContentService } from '../../content'
import { parseDatasheet } from '../../formats/datasheet/datasheet'
import { sheetRows } from '../../levels/load'
import { artTilePath, dungeonRules, DUNGEON_SHEETS, generateDungeon, mapTilePath, type DungeonSheets } from './dungeon'
import type { DungeonCell } from './layout'

/**
 * Key of the generated dungeon slice in the slice library. Not a catalog asset: it only joins the spawner and the slice.
 */
export const DUNGEON_SLICE_REF: AssetReference = { guid: 'dungeon', subId: 0 }

/**
 * Seed of the dungeon when the url names none
 */
export const DEFAULT_DUNGEON_SEED = 1

export interface DungeonSliceOptions {
  feature: string
  seed: number
  /**
   * world position of the start room's center (the spawn position of the level), the tile floors are at its height
   */
  start: { x: number; y: number; z: number }
  signal?: AbortSignal
}

export interface DungeonSlices {
  /**
   * the generated slice (key of {@link DUNGEON_SLICE_REF}) and the art tiles it spawns, with their nested slices
   */
  slices: Record<string, ViewerSlice>
  map: DungeonMap
}

/**
 * The cells of a generated dungeon in world space, for the minimap
 */
export interface DungeonMap {
  seed: number
  tileSize: number
  cells: DungeonMapCell[]
}

export interface DungeonMapCell {
  /**
   * world position of the cell center
   */
  x: number
  y: number
  z: number
  /**
   * room id, null for a connecting hallway
   */
  room: string | null
  /**
   * map image of the tile, top = north before the rotation
   */
  image: string
  /**
   * clockwise quarter turns of the tile (seen from above)
   */
  rotation: number
}

/**
 * Generates a dungeon of the feature's datasheets and builds a slice of it: one prefab spawner per grid cell that
 * spawns the art tile of the cell (the tile without its encounters), turned by the cell's rotation. The start room
 * sits at `start`.
 */
export async function loadDungeonSlices(content: ContentService, options: DungeonSliceOptions): Promise<DungeonSlices> {
  const { feature, seed, start, signal } = options
  const [clusters, grammars, rooms, tiles] = await Promise.all(
    [DUNGEON_SHEETS.clusters, DUNGEON_SHEETS.grammars, DUNGEON_SHEETS.rooms, DUNGEON_SHEETS.tiles].map((path) =>
      loadRows(content, path, signal),
    ),
  )
  const sheets: DungeonSheets = { clusters, grammars, rooms, tiles }
  const { graph, layout } = generateDungeon(dungeonRules(feature, sheets), seed)

  const nwbt = new NwbtClient(content.nwbtUrl ?? '')
  const paths = [...new Set(layout.cells.map((it) => artTilePath(it.variation)))]
  const tileSlices = await Promise.all(paths.map((path) => nwbt.getSlice(path, signal)))
  signal?.throwIfAborted()

  const slices: Record<string, ViewerSlice> = {}
  const refs = new Map<string, AssetReference>()
  tileSlices.forEach((tile, index) => {
    Object.assign(slices, tile.slices)
    const separator = tile.root.lastIndexOf('_')
    refs.set(paths[index], {
      guid: tile.root.slice(0, separator),
      subId: Number(tile.root.slice(separator + 1)),
      hint: paths[index],
    })
  })

  const startCell = layout.cells.find((it) => it.node === graph.start) ?? layout.cells[0]
  const cellPosition = (cell: DungeonCell) => ({
    x: start.x + (cell.x - startCell.x) * layout.tileSize,
    y: start.y + (cell.y - startCell.y) * layout.tileSize,
    z: start.z,
  })
  const entities = layout.cells.map((cell, index): ViewerEntity => {
    const path = artTilePath(cell.variation)
    const spawner: ViewerPrefabSpawnerComponent = { type: PrefabSpawnerComponentName, slice: refs.get(path)! }
    const position = cellPosition(cell)
    // clockwise quarter turns seen from above (z up): a negative angle about z
    const world = mat4Multiply(
      mat4CreateTranslationXYZ(position.x, position.y, position.z),
      mat4CreateRotationZ((-cell.rotation * Math.PI) / 2),
    )
    return {
      id: `dungeon_${index}`,
      name: `${cell.room ?? 'Connector'} ${cell.tile} (${cell.x}, ${cell.y})`,
      transform: Array.from(world) as Mat4Data,
      components: [spawner],
    }
  })
  slices[assetReferenceKey(DUNGEON_SLICE_REF)] = {
    entities,
    spawnRadius: DUNGEON_SPAWN_RADIUS,
    isStaticSlice: true,
  }
  return {
    slices,
    map: {
      seed,
      tileSize: layout.tileSize,
      cells: layout.cells.map((cell) => ({
        ...cellPosition(cell),
        room: cell.room,
        image: mapTilePath(cell.variation),
        rotation: cell.rotation,
      })),
    },
  }
}

/**
 * Covers the whole dungeon (about 20 by 20 tiles of 64 m at most), the tiles stream by their own view distances
 */
const DUNGEON_SPAWN_RADIUS = 4096

async function loadRows(content: ContentService, path: string, signal?: AbortSignal) {
  const res = await content.fetchFile(path, { signal })
  return sheetRows(parseDatasheet(new Uint8Array(await res.arrayBuffer())))
}
