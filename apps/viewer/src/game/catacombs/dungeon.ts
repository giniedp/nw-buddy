import { PCG32 } from '@gglib/math'
import type { SheetRow } from '../../levels/catalog'
import { expandDungeonGraph, type DungeonGraph, type DungeonRules } from './grammar'
import { layoutDungeon, type DungeonLayout } from './layout'

export const DUNGEON_DATATABLES = 'sharedassets/springboardentitites/datatables/dungeonproceduralgeneration'

/**
 * The datasheets of the dungeon generation
 */
export const DUNGEON_SHEETS = {
  clusters: `${DUNGEON_DATATABLES}/javelindata_dungeonclusters.datasheet`,
  grammars: `${DUNGEON_DATATABLES}/javelindata_dungeongrammars.datasheet`,
  rooms: `${DUNGEON_DATATABLES}/javelindata_dungeonrooms.datasheet`,
  tiles: `${DUNGEON_DATATABLES}/javelindata_dungeontiles.datasheet`,
}

/**
 * Levels that the server fills with a generated dungeon, by the `FeatureId` of the generation datasheets
 */
export const DUNGEON_LEVELS: Record<string, string> = {
  nw_catacomb_00: 'Catacombs',
}

export interface DungeonSheets {
  clusters: SheetRow[]
  grammars: SheetRow[]
  rooms: SheetRow[]
  tiles: SheetRow[]
}

/**
 * The generation rules of a feature (e.g. `Catacombs`) from the rows of the datasheets
 */
export function dungeonRules(feature: string, sheets: DungeonSheets): DungeonRules {
  const of = (rows: SheetRow[]) => rows.filter((it) => it['FeatureId'] === feature)
  const cluster = of(sheets.clusters)[0]
  if (!cluster) {
    throw new Error(`dungeon: no cluster for ${feature}`)
  }
  return {
    seedGraph: String(cluster['SeedGraph']),
    replacementCount: Number(cluster['ReplacementCount'] ?? 0),
    grammars: of(sheets.grammars).map((it) => ({
      id: String(it['GrammaReplacementId']),
      symbol: String(it['GrammarReplacements']),
      graph: String(it['SeedGraph']),
      weight: Number(it['Weight'] ?? 0),
    })),
    rooms: of(sheets.rooms).map((it) => ({ id: String(it['RoomId']), roomType: String(it['RoomType']) })),
    tiles: of(sheets.tiles).map((it) => ({
      id: String(it['DungeonTileId']),
      connections: String(it['Connections']),
      rotations: Number(it['Rotations'] ?? 0),
      size: Number(it['TileSize'] ?? 64),
      variations: splitList(it['VariationAssetPaths']),
      roomTypes: splitList(it['SupportedRoomTypes']),
    })),
  }
}

export interface Dungeon {
  graph: DungeonGraph
  layout: DungeonLayout
}

/**
 * A dungeon of the rules, the same seed gives the same dungeon
 */
export function generateDungeon(rules: DungeonRules, seed: number): Dungeon {
  const random = new PCG32(0, seed >>> 0)
  const graph = expandDungeonGraph(rules, random)
  const layout = layoutDungeon(graph, rules, random)
  return { graph, layout }
}

/**
 * The art tile of a gameplay tile variation, the tile without its encounters:
 * `Catacombs/Gameplay/Tiles/tile1_a_gameplay` → `slices/catacombs/arttiles/tile1_a.dynamicslice`
 */
export function artTilePath(variation: string) {
  const name = variation
    .split('/')
    .pop()!
    .toLowerCase()
    .replace(/_gameplay$/, '')
  return `slices/catacombs/arttiles/${name}.dynamicslice`
}

/**
 * The map image of a gameplay tile variation, as the game's catacombs map shows it (top = north, unrotated):
 * `Catacombs/Gameplay/Tiles/tile1_a_gameplay` → `lyshineui/worldtiles/nw_catacombs/tile1_a_gameplay.dds`
 */
export function mapTilePath(variation: string) {
  return `lyshineui/worldtiles/nw_catacombs/${variation.split('/').pop()!.toLowerCase()}.dds`
}

function splitList(value: SheetRow[string] | undefined) {
  return String(value ?? '')
    .split(',')
    .map((it) => it.trim())
    .filter((it) => !!it)
}
