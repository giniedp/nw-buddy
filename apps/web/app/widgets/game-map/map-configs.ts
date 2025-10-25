import { ReturnTypeOf } from '@octokit/core/dist-types/types'
import { ImageSourceSpecification } from 'maplibre-gl'
import { environment } from '../../../environments'
import { NW_MAP_REGION_SIZE } from './map-projection'

export interface MapConfig {
  mapId: string
  maxZoom: number
  minZoom: number
  zoomPad: MapBounds
  bounds: MapBounds
  boundsPoi?: MapBounds
  isOpenWorld?: boolean
  isCatacombs?: boolean

  impostors?: boolean
  heightmap?: boolean
  tractmap?: boolean

  map2?: string
  map2Bounds?: [number, number, number, number]

  images?: ImageSourceSpecification[]
}

export type MapBounds = [number, number, number, number]

function bounds(x: number, y: number, w: number, h: number): MapBounds {
  const scale = NW_MAP_REGION_SIZE
  // prettier-ignore
  return [
    x * scale,
    y * scale,
    (x + w) * scale,
    (y + h) * scale
  ]
}

const MAP_CONFIGS: Record<string, MapConfig> = {
  newworld_vitaeeterna: {
    mapId: 'newworld_vitaeeterna',
    maxZoom: 1,
    minZoom: 7,
    zoomPad: [4 * NW_MAP_REGION_SIZE, 1 * NW_MAP_REGION_SIZE, 4 * NW_MAP_REGION_SIZE, 0 * NW_MAP_REGION_SIZE],
    bounds: bounds(0, 0, 8, 7),
    boundsPoi: bounds(0, 0, 7, 6),
    isOpenWorld: true,
    heightmap: true,
    tractmap: true,
    impostors: true,
    map2: 'outpostrush',
    map2Bounds: bounds(0, 5, 1, 1),
  },
  nw_arena_3v3_04: smallMapConfig('nw_arena_3v3_04', {
    heightmap: true,
    tractmap: true,
    boundsPoi: [1000, 1400, 1400, 1800],
  }),
  nw_ctf_002_wide: smallMapConfig('nw_ctf_002_wide', {
    heightmap: true,
    tractmap: true,
    impostors: true,
    boundsPoi: [700, 1000, 1100, 1400],
  }),
  nw_ctf_003_long: smallMapConfig('nw_ctf_003_long', {
    heightmap: true,
    tractmap: true,
    boundsPoi: [800, 800, 1300, 1300],
  }),
  nw_opr_004_trench: smallMapConfig('nw_opr_004_trench', {
    heightmap: true,
    tractmap: true,
    impostors: true,
    boundsPoi: [600, 600, 1400, 1400],
  }),
  nw_raid_cutlasskeys_00: smallMapConfig('nw_raid_cutlasskeys_00', {
    heightmap: true,
    tractmap: true,
    impostors: true,
    boundsPoi: [400, 500, 1400, 1400],
  }),
  nw_arena02: smallMapConfig('nw_arena02', {
    boundsPoi: [800, 800, 1400, 1400],
  }),
  nw_arena01: smallMapConfig('nw_arena01', {
    boundsPoi: [800, 800, 1000, 1000],
  }),
  nw_opr_005_vertical: smallMapConfig('nw_opr_005_vertical', {
    boundsPoi: [700, 700, 1300, 1300],
  }),
  nw_dungeon_windsward_00: smallMapConfig('nw_dungeon_windsward_00', {
    boundsPoi: [600, 500, 1000, 1100],
  }),
  nw_dungeon_brimstonesands_00: smallMapConfig('nw_dungeon_brimstonesands_00', {
    boundsPoi: [650, 800, 1400, 1500],
  }),
  nw_dungeon_cutlasskeys_00: smallMapConfig('nw_dungeon_cutlasskeys_00', {
    boundsPoi: [200, 700, 700, 1250],
  }),
  nw_dungeon_edengrove_00: smallMapConfig('nw_dungeon_edengrove_00', {
    boundsPoi: [300, 950, 950, 1650],
  }),
  nw_dungeon_everfall_00: smallMapConfig('nw_dungeon_everfall_00', {
    boundsPoi: [250, 250, 1000, 750],
  }),
  nw_dungeon_firstlight_01: smallMapConfig('nw_dungeon_firstlight_01', {
    boundsPoi: [450, 650, 1000, 1200],
  }),
  nw_dungeon_greatcleave_00: smallMapConfig('nw_dungeon_greatcleave_00', {
    boundsPoi: [800, 400, 1300, 1000],
  }),
  nw_dungeon_greatcleave_01: smallMapConfig('nw_dungeon_greatcleave_01', {
    boundsPoi: [450, 200, 950, 700],
  }),
  nw_dungeon_reekwater_00: smallMapConfig('nw_dungeon_reekwater_00', {
    boundsPoi: [600, 500, 1050, 1000],
  }),
  nw_dungeon_restlessshores_01: smallMapConfig('nw_dungeon_restlessshores_01', {
    boundsPoi: [650, 800, 1250, 1400],
  }),
  nw_dungeon_shattermtn_00: smallMapConfig('nw_dungeon_shattermtn_00', {
    boundsPoi: [350, 450, 2000, 1900],
  }),
  //
  nw_ori_fl_questadiana: smallMapConfig('nw_ori_fl_questadiana', {
    boundsPoi: [500, 600, 900, 1000],
  }),
  nw_ori_eg_questmotherwell: smallMapConfig('nw_ori_eg_questmotherwell', {
    boundsPoi: [800, 600, 1300, 1100],
  }),

  nw_ori_gc_questnihilo: smallMapConfig('nw_ori_gc_questnihilo', {
    boundsPoi: [700, 500, 1200, 900],
  }),
  nw_ori_sm_questisabella: smallMapConfig('nw_ori_sm_questisabella', {
    boundsPoi: [1000, 900, 1300, 1300],
  }),
  nw_ori_er_questliang: smallMapConfig('nw_ori_er_questliang', {
    boundsPoi: [800, 700, 1200, 1200],
  }),
  nw_trial_season_02_q13: smallMapConfig('nw_trial_season_02_q13', {
    boundsPoi: [800, 700, 1200, 1300],
  }),
  nw_trial_season_04_daichidojo: smallMapConfig('nw_trial_season_04_daichidojo', {
    zoomPad: [200, 200, 0, 0],
    boundsPoi: [0, 200, 600, 600],
  }),
  nw_trial_season_04_deviceroom: smallMapConfig('nw_trial_season_04_deviceroom', {
    zoomPad: [200, 200, 0, 0],
    boundsPoi: [0, 0, 500, 500],
  }),

  nw_trial_season_02: smallMapConfig('nw_trial_season_02', {
    boundsPoi: [800, 800, 1300, 1300],
  }),
  nw_trial_season_04: smallMapConfig('nw_trial_season_04', {
    boundsPoi: [0, 0, 500, 500],
  }),

  nw_catacomb_00: smallMapConfig('nw_catacomb_00', {
    bounds: [0, 0, 5 * 128, 9 * 128],
    boundsPoi: [0, 0, 5 * 128, 9 * 128],
    zoomPad: [512, 512, 512, 512],
    isCatacombs: true,
    isOpenWorld: false,
    images: getCatacombImages(),
  }),
}

export function getMapConfig(mapId: string) {
  MAP_CONFIGS[mapId] ||= smallMapConfig(mapId, {})
  return MAP_CONFIGS[mapId]
}

function smallMapConfig(mapId: string, overrides: Partial<MapConfig>): MapConfig {
  return {
    mapId,
    maxZoom: 1,
    minZoom: 4,
    zoomPad: [0, 0, 0, 0],
    bounds: bounds(0, 0, 1, 1),
    ...overrides,
  }
}

function getCatacombImages() {
  return [
    'tile_aa',
    'tile_ac',
    'tile_ad',
    'tile_ba',
    'tile_bc',
    'tile_bd',
    'tile_ca',
    'tile_cc',
    'tile_cd',
    'tile_ea',
    'tile_ec',
    'tile_ed',
    'tile1_aa_gameplay',
    'tile1_a_gameplay',
    'tile1_b',
    'tile1_ba_gameplay',
    'tile1_b_gameplay',
    'tile1_c',
    'tile1_ca_gameplay',
    'tile1_c_gameplay',
    'tile1_d_gameplay',
    'tile1_e_gameplay',
    'tile2_a',
    'tile2_aa_gameplay',
    'tile2_a_gameplay',
    'tile2_b',
    'tile2_ba_gameplay',
    'tile2_b_gameplay',
    'tile2_c',
    'tile2_ca_gameplay',
    'tile2_c_gameplay',
    'tile2_d_gameplay',
    'tile2_e_gameplay',
    'tile3_a',
    'tile3_aa_gameplay',
    'tile3_a_gameplay',
    'tile3_b',
    'tile3_ba_gameplay',
    'tile3_b_gameplay',
    'tile3_c',
    'tile3_ca_gameplay',
    'tile3_c_gameplay',
    'tile3_d_gameplay',
    'tile3_e_gameplay',
    'tile4_a',
    'tile4_aa_gameplay',
    'tile4_a_gameplay',
    'tile4_b',
    'tile4_ba_gameplay',
    'tile4_b_gameplay',
    'tile4_c',
    'tile4_ca_gameplay',
    'tile4_c_gameplay',
    'tile4_d_gameplay',
    'tile4_e_gameplay',
    'tile5_a',
    'tile5_aa_gameplay',
    'tile5_a_gameplay',
    'tile5_b',
    'tile5_ba_gameplay',
    'tile5_b_gameplay',
    'tile5_c',
    'tile5_ca_gameplay',
    'tile5_c_gameplay',
    'tile5_d_gameplay',
    'tile5_e_gameplay',
  ].map((it) => {
    const tileSize = 128
    const tile = parseCatacombTile(it, tileSize)
    return catacombTileSource(tile, tileSize)
  })
}

function parseCatacombTile(baseName: string, tileSize: number) {
  const result = {
    BaseName: baseName,
    OffsetX: 0,
    OffsetY: 0,
    MapTile: '',
  }
  const splits = baseName.split('_')

  // tile => ""
  // tile1 => "1"
  const index = Number(splits[0].replace('tile', '')) || 0

  if (index == 0) {
    // tile_XX_gameplay
    const address = splits[1]
    result.OffsetX = (address.charCodeAt(0) - 'a'.charCodeAt(0)) * tileSize
    if (address.length > 1) {
      result.OffsetY = (address.charCodeAt(1) - 'a'.charCodeAt(0)) * tileSize
    }
    result.MapTile = `map_tile_${address}`
    result.OffsetY += 5 * tileSize
  } else {
    // tileX_YZ_gameplay
    const address = splits[1]
    result.OffsetX = (index - 1) * tileSize
    result.OffsetY = (address.charCodeAt(0) - 'a'.charCodeAt(0)) * tileSize
    result.MapTile = `${splits[0]}_${address}_gameplay`
  }

  return result
}

function catacombTileSource(tile: ReturnTypeOf<typeof parseCatacombTile>, tileSize: number): ImageSourceSpecification {
  return {
    type: 'image',
    url: `${environment.nwTilesUrl}/lyshineui/worldtiles/nw_catacombs/${tile.MapTile}.webp`,
    coordinates: [
      [tile.OffsetX + 0 * tileSize, tile.OffsetY + 0 * tileSize],
      [tile.OffsetX + 1 * tileSize, tile.OffsetY + 0 * tileSize],
      [tile.OffsetX + 1 * tileSize, tile.OffsetY + 1 * tileSize],
      [tile.OffsetX + 0 * tileSize, tile.OffsetY + 1 * tileSize],
    ],
  }
}
