import type { Random } from '@gglib/math'
import type { DungeonGraph, DungeonRules, DungeonTileRule } from './grammar'

/**
 * Door bits of a cell, N = +y, E = +x, S = -y, W = -x (the art tiles have their doors at the edge centers)
 */
export const Door = { N: 1, E: 2, S: 4, W: 8 } as const

const DIRECTIONS = [
  { door: Door.N, opposite: Door.S, dx: 0, dy: 1 },
  { door: Door.E, opposite: Door.W, dx: 1, dy: 0 },
  { door: Door.S, opposite: Door.N, dx: 0, dy: -1 },
  { door: Door.W, opposite: Door.E, dx: -1, dy: 0 },
]

/**
 * Room type of the hallway cells that connect rooms that are not neighbors
 */
const CONNECTOR_ROOM_TYPE = 'Hallway'

/**
 * A grid cell of the dungeon, one tile
 */
export interface DungeonCell {
  x: number
  y: number
  /**
   * node id of the room, null for a connecting hallway
   */
  node: number | null
  /**
   * room id of `javelindata_dungeonrooms`, null for a connecting hallway
   */
  room: string | null
  doors: number
  tile: string
  /**
   * gameplay slice path of the tile variation, e.g. `Catacombs/Gameplay/Tiles/tile1_a_gameplay`
   */
  variation: string
  /**
   * clockwise quarter turns of the tile (seen from above)
   */
  rotation: number
}

export interface DungeonLayout {
  cells: DungeonCell[]
  tileSize: number
}

interface GridCell {
  x: number
  y: number
  node: number | null
  doors: number
}

/**
 * Places the rooms of the graph on a grid, one room per cell. A room goes next to its parent when a side is free,
 * else a hallway path through free cells leads to it. Edges between rooms that are already placed (loops) are routed
 * the same way. Retries with other choices when a route is blocked.
 */
export function layoutDungeon(graph: DungeonGraph, rules: DungeonRules, random: Random, attempts = 64): DungeonLayout {
  const roomTypes = new Map(rules.rooms.map((it) => [it.id, it.roomType]))
  for (let attempt = 0; attempt < attempts; attempt++) {
    const grid = placeRooms(graph, random)
    if (grid) {
      const nodes = new Map(graph.nodes.map((it) => [it.id, it.room]))
      return {
        cells: [...grid.values()].map((cell) => {
          const room = cell.node === null ? null : nodes.get(cell.node)!
          const roomType = room === null ? CONNECTOR_ROOM_TYPE : roomTypes.get(room)!
          return { ...cell, room, ...pickTile(rules.tiles, roomType, cell.doors, random) }
        }),
        tileSize: rules.tiles[0]?.size ?? 64,
      }
    }
  }
  throw new Error(`dungeon layout: no layout after ${attempts} attempts`)
}

function placeRooms(graph: DungeonGraph, random: Random): Map<string, GridCell> | null {
  const grid = new Map<string, GridCell>()
  const placed = new Map<number, GridCell>()
  const key = (x: number, y: number) => `${x},${y}`
  const neighbors = new Map<number, number[]>()
  for (const [from, to] of graph.edges) {
    neighbors.set(from, [...(neighbors.get(from) ?? []), to])
    neighbors.set(to, [...(neighbors.get(to) ?? []), from])
  }

  const start: GridCell = { x: 0, y: 0, node: graph.start, doors: 0 }
  grid.set(key(0, 0), start)
  placed.set(graph.start, start)

  const connected = new Set<string>()
  const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

  const queue = [graph.start]
  while (queue.length) {
    const id = queue.shift()!
    const from = placed.get(id)!
    for (const other of neighbors.get(id) ?? []) {
      if (connected.has(edgeKey(id, other))) {
        continue
      }
      connected.add(edgeKey(id, other))
      const target = placed.get(other)
      if (target) {
        // closes a loop
        if (!route(grid, from, target, random)) {
          return null
        }
        continue
      }
      const cell = placeNext(grid, from, other, random)
      if (!cell) {
        return null
      }
      placed.set(other, cell)
      queue.push(other)
    }
  }
  return grid
}

/**
 * Places a room next to `from`, or at the end of a hallway path when no side is free
 */
function placeNext(grid: Map<string, GridCell>, from: GridCell, node: number, random: Random): GridCell | null {
  const sides = shuffle([...DIRECTIONS], random).filter((dir) => !grid.has(`${from.x + dir.dx},${from.y + dir.dy}`))
  if (sides.length) {
    const dir = sides[0]
    const cell: GridCell = { x: from.x + dir.dx, y: from.y + dir.dy, node, doors: dir.opposite }
    from.doors |= dir.door
    grid.set(`${cell.x},${cell.y}`, cell)
    return cell
  }
  // all sides taken: the nearest free cell behind a hallway, starting from a hallway neighbor of `from`
  const path = findPath(grid, from, null, random)
  if (!path) {
    return null
  }
  const end = path[path.length - 1]
  end.node = node
  connectPath(grid, from, path)
  return end
}

/**
 * Connects two placed cells through free cells
 */
function route(grid: Map<string, GridCell>, from: GridCell, to: GridCell, random: Random): boolean {
  const dir = DIRECTIONS.find((it) => from.x + it.dx === to.x && from.y + it.dy === to.y)
  if (dir) {
    from.doors |= dir.door
    to.doors |= dir.opposite
    return true
  }
  const path = findPath(grid, from, to, random)
  if (!path) {
    return false
  }
  connectPath(grid, from, path)
  return true
}

/**
 * Breadth first search from `from` to `to` (a placed cell) or, without `to`, to the nearest free cell. The path runs
 * through free cells and hallway cells, rooms block it. Returns the cells after `from`, free cells as new cells that
 * are not in the grid yet.
 */
function findPath(grid: Map<string, GridCell>, from: GridCell, to: GridCell | null, random: Random): GridCell[] | null {
  const key = (x: number, y: number) => `${x},${y}`
  const startKey = key(from.x, from.y)
  const previous = new Map<string, string>()
  const visited = new Set([startKey])
  const frontier: Array<{ x: number; y: number }> = [{ x: from.x, y: from.y }]
  while (frontier.length && visited.size < SEARCH_LIMIT) {
    const current = frontier.shift()!
    for (const dir of shuffle([...DIRECTIONS], random)) {
      const x = current.x + dir.dx
      const y = current.y + dir.dy
      const k = key(x, y)
      if (visited.has(k)) {
        continue
      }
      const cell = grid.get(k)
      const isTarget = !!to && to.x === x && to.y === y
      if (cell && cell.node !== null && !isTarget) {
        continue
      }
      visited.add(k)
      previous.set(k, key(current.x, current.y))
      if (isTarget || (!to && !cell)) {
        const result: GridCell[] = []
        let step = k
        while (step !== startKey) {
          const [sx, sy] = step.split(',').map(Number)
          result.unshift(grid.get(step) ?? { x: sx, y: sy, node: null, doors: 0 })
          step = previous.get(step)!
        }
        return result
      }
      frontier.push({ x, y })
    }
  }
  return null
}

/**
 * Cells a path search visits at most
 */
const SEARCH_LIMIT = 4096

/**
 * Adds the hallway cells of a path to the grid and opens the doors along it
 */
function connectPath(grid: Map<string, GridCell>, from: GridCell, path: GridCell[]) {
  let previous = from
  for (const cell of path) {
    const dir = DIRECTIONS.find((it) => previous.x + it.dx === cell.x && previous.y + it.dy === cell.y)!
    previous.doors |= dir.door
    cell.doors |= dir.opposite
    grid.set(`${cell.x},${cell.y}`, cell)
    previous = cell
  }
}

/**
 * The tile for a cell: a tile of the room type whose doors, turned by up to `rotations` quarter turns, are the doors
 * of the cell, and one of its variations
 */
function pickTile(tiles: DungeonTileRule[], roomType: string, doors: number, random: Random) {
  for (const tile of tiles) {
    if (!tile.roomTypes.includes(roomType)) {
      continue
    }
    let mask = doorMask(tile.connections)
    for (let rotation = 0; rotation <= tile.rotations; rotation++) {
      if (mask === doors) {
        const variation = tile.variations[random.nextInt(0, tile.variations.length)]
        return { tile: tile.id, variation, rotation }
      }
      mask = rotateClockwise(mask)
    }
  }
  throw new Error(`dungeon layout: no tile for ${roomType} with doors ${doors}`)
}

export function doorMask(connections: string) {
  let mask = 0
  for (const c of connections.toUpperCase()) {
    mask |= Door[c as keyof typeof Door] ?? 0
  }
  return mask
}

/**
 * Turns the doors a quarter clockwise: N → E → S → W → N
 */
export function rotateClockwise(mask: number) {
  return ((mask << 1) | (mask >> 3)) & 15
}

function shuffle<T>(items: T[], random: Random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = random.nextInt(0, i + 1)
    const t = items[i]
    items[i] = items[j]
    items[j] = t
  }
  return items
}
