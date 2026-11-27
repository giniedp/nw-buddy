import { describe, expect, it } from 'vitest'
import { artTilePath, dungeonRules, generateDungeon, mapTilePath, type DungeonSheets } from './dungeon'
import { parseDungeonGraph } from './grammar'
import { Door, doorMask, rotateClockwise } from './layout'

const ROOM_TILES = 'EncounterStart,EncounterBoss,EncounterNamedEnemy,EncounterGate,EncounterHazard,Reward'

function tile(id: string, connections: string, rotations: number, variations: string, types: string) {
  return {
    DungeonTileId: id,
    FeatureId: 'Catacombs',
    Connections: connections,
    Rotations: rotations,
    TileSize: 64,
    VariationAssetPaths: variations,
    SupportedRoomTypes: types,
  }
}

function grammar(id: string, graph: string, symbol: string) {
  return { GrammaReplacementId: id, FeatureId: 'Catacombs', SeedGraph: graph, Weight: 0, GrammarReplacements: symbol }
}

/**
 * The Catacombs rows of the datasheets, two of the eight themes
 */
const SHEETS: DungeonSheets = {
  clusters: [
    {
      ClusterId: 'CatacombsBranch',
      FeatureId: 'Catacombs',
      SeedGraph: 'StartRoom_1-CycleB_1-CycleA_1-CycleB_2-CycleA_2-CycleB_3-CycleA_3',
      ReplacementCount: 5,
    },
  ],
  grammars: [
    grammar('StartRoom', 'StartRoom', 'StartRoom'),
    grammar('CycleA_Lost', 'HallwayRoom_1-NamedRoom_1,LoopA_1', 'CycleA'),
    grammar('CycleB_Lost', 'HallwayRoom_1-NamedRoom_1,LoopB_1', 'CycleB'),
    grammar('CycleA_Upyr', 'HallwayRoom_1-NamedRoom_1,LoopA_1', 'CycleA'),
    grammar('CycleB_Upyr', 'HallwayRoom_1-NamedRoom_1,LoopB_1', 'CycleB'),
    grammar('LoopA', 'ParkourRoom_1-NamedRoom_1-RewardRoom_1-HazardBoss_1-HallwayRoom_1:ParkourRoom_1', 'LoopA'),
    grammar('LoopB', 'ParkourRoom_1-NamedRoom_1-RewardRoom_1-GateBoss_1-HallwayRoom_1:ParkourRoom_1', 'LoopB'),
    grammar('HazardBoss', 'HazardRoom_1-#BossRoom_1(HazardRoom_1)', 'HazardBoss'),
    grammar('GateBoss', 'GateRoom_1-#BossRoom_1(GateRoom_1),KeyRoom_1(GateRoom_1)', 'GateBoss'),
  ],
  rooms: [
    ['StartRoom', 'EncounterStart'],
    ['BossRoom', 'EncounterBoss'],
    ['NamedRoom', 'EncounterNamedEnemy'],
    ['GateRoom', 'EncounterGate'],
    ['KeyRoom', 'EncounterKey'],
    ['HazardRoom', 'EncounterHazard'],
    ['HallwayRoom', 'Hallway'],
    ['ParkourRoom', 'Parkour'],
    ['RewardRoom', 'Reward'],
  ].map(([id, type]) => ({ RoomId: id, FeatureId: 'Catacombs', RoomType: type })),
  tiles: [
    tile('StraightRoom', 'NS', 1, 'Catacombs/Gameplay/Tiles/tile1_a_gameplay', ROOM_TILES),
    tile('CornerRoom', 'ES', 3, 'Catacombs/Gameplay/Tiles/tile2_a_gameplay', ROOM_TILES),
    tile('ThreeWayRoom', 'NES', 3, 'Catacombs/Gameplay/Tiles/tile3_a_gameplay', ROOM_TILES),
    tile('DeadEndRoom', 'S', 3, 'Catacombs/Gameplay/Tiles/tile4_a_gameplay', ROOM_TILES),
    tile('FourWayRoom', 'NESW', 0, 'Catacombs/Gameplay/Tiles/tile5_a_gameplay', ROOM_TILES),
    tile('StraightHallway', 'NS', 1, 'Catacombs/Gameplay/Tiles/tile1_b_gameplay', 'Hallway,EncounterKey'),
    tile('CornerHallway', 'ES', 3, 'Catacombs/Gameplay/Tiles/tile2_b_gameplay', 'Hallway,EncounterKey'),
    tile('ThreeWayHallway', 'NES', 3, 'Catacombs/Gameplay/Tiles/tile3_b_gameplay', 'Hallway,EncounterKey'),
    tile('DeadEndHallway', 'S', 3, 'Catacombs/Gameplay/Tiles/tile4_b_gameplay', 'Hallway,EncounterKey'),
    tile('FourWayHallway', 'NESW', 0, 'Catacombs/Gameplay/Tiles/tile5_b_gameplay', 'Hallway,EncounterKey'),
    tile('StraightParkour', 'NS', 1, 'Catacombs/Gameplay/Tiles/tile1_d_gameplay', 'Parkour'),
    tile('CornerParkour', 'ES', 3, 'Catacombs/Gameplay/Tiles/tile2_d_gameplay', 'Parkour'),
    tile('ThreeWayParkour', 'NES', 3, 'Catacombs/Gameplay/Tiles/tile3_d_gameplay', 'Parkour'),
    tile('DeadEndParkour', 'S', 3, 'Catacombs/Gameplay/Tiles/tile4_d_gameplay', 'Parkour'),
    tile('FourWayParkour', 'NESW', 0, 'Catacombs/Gameplay/Tiles/tile5_d_gameplay', 'Parkour'),
  ],
}

describe('dungeon', () => {
  const rules = dungeonRules('Catacombs', SHEETS)

  it('parses chains, parents, loops and dead ends', () => {
    const graph = parseDungeonGraph('GateRoom_1-#BossRoom_1(GateRoom_1),KeyRoom_1(GateRoom_1)')
    expect(graph.entry).toBe('GateRoom_1')
    expect(graph.exit).toBe('GateRoom_1')
    expect(graph.edges).toEqual([
      ['GateRoom_1', 'BossRoom_1'],
      ['GateRoom_1', 'KeyRoom_1'],
    ])

    const loop = parseDungeonGraph('ParkourRoom_1-NamedRoom_1-HallwayRoom_1:ParkourRoom_1')
    expect(loop.edges).toContainEqual(['HallwayRoom_1', 'ParkourRoom_1'])

    const cycle = parseDungeonGraph('HallwayRoom_1-NamedRoom_1,LoopA_1')
    expect(cycle.exit).toBe('NamedRoom_1')
    expect(cycle.edges).toContainEqual(['NamedRoom_1', 'LoopA_1'])
  })

  it('turns doors clockwise', () => {
    expect(rotateClockwise(doorMask('ES'))).toBe(Door.S | Door.W)
    expect(rotateClockwise(Door.W)).toBe(Door.N)
  })

  it('expands to rooms only, with every room kind', () => {
    const { graph } = generateDungeon(rules, 1)
    const rooms = new Set(graph.nodes.map((it) => it.room))
    expect([...rooms].sort()).toEqual([
      'BossRoom',
      'GateRoom',
      'HallwayRoom',
      'HazardRoom',
      'KeyRoom',
      'NamedRoom',
      'ParkourRoom',
      'RewardRoom',
      'StartRoom',
    ])
    expect(graph.nodes.filter((it) => it.room === 'BossRoom')).toHaveLength(6)
  })

  it('lays out every room with matching doors on both sides', () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
      const { graph, layout } = generateDungeon(rules, seed)
      const cells = new Map(layout.cells.map((it) => [`${it.x},${it.y}`, it]))
      expect(layout.cells.filter((it) => it.node !== null)).toHaveLength(graph.nodes.length)
      for (const cell of layout.cells) {
        const east = cells.get(`${cell.x + 1},${cell.y}`)
        const north = cells.get(`${cell.x},${cell.y + 1}`)
        expect(!!(cell.doors & Door.E)).toBe(!!east && !!(east.doors & Door.W))
        expect(!!(cell.doors & Door.N)).toBe(!!north && !!(north.doors & Door.S))
        expect(cell.doors).not.toBe(0)
      }
    }
  })

  it('is the same for the same seed', () => {
    expect(generateDungeon(rules, 7).layout).toEqual(generateDungeon(rules, 7).layout)
  })

  it('maps gameplay tiles to map images', () => {
    expect(mapTilePath('Catacombs/Gameplay/Tiles/tile2_a_gameplay')).toBe(
      'lyshineui/worldtiles/nw_catacombs/tile2_a_gameplay.dds',
    )
  })

  it('maps gameplay tiles to art tiles', () => {
    expect(artTilePath('Catacombs/Gameplay/Tiles/tile1_ba_gameplay')).toBe(
      'slices/catacombs/arttiles/tile1_ba.dynamicslice',
    )
  })
})
