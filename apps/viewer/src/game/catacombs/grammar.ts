import type { Random } from '@gglib/math'

/**
 * Rows of the `dungeonproceduralgeneration` datasheets that drive the generation, filtered to one feature
 * (e.g. `Catacombs`)
 */
export interface DungeonRules {
  /**
   * `javelindata_dungeonclusters`: the seed graph of the dungeon
   */
  seedGraph: string
  /**
   * `ReplacementCount` of the cluster, the meaning is not known
   */
  replacementCount: number
  /**
   * `javelindata_dungeongrammars`: the replacements of a symbol (`GrammarReplacements`) by a graph (`SeedGraph`)
   */
  grammars: DungeonGrammarRule[]
  /**
   * `javelindata_dungeonrooms`
   */
  rooms: DungeonRoomRule[]
  /**
   * `javelindata_dungeontiles`
   */
  tiles: DungeonTileRule[]
}

export interface DungeonGrammarRule {
  id: string
  symbol: string
  graph: string
  weight: number
}

export interface DungeonRoomRule {
  id: string
  roomType: string
}

export interface DungeonTileRule {
  id: string
  /**
   * doors of the unrotated tile, e.g. `NES`
   */
  connections: string
  /**
   * number of quarter turns the tile may be rotated by (0-3)
   */
  rotations: number
  size: number
  /**
   * gameplay slice paths, e.g. `Catacombs/Gameplay/Tiles/tile1_a_gameplay`
   */
  variations: string[]
  roomTypes: string[]
}

/**
 * A room of the expanded dungeon graph
 */
export interface DungeonNode {
  id: number
  /**
   * room id of `javelindata_dungeonrooms`, e.g. `NamedRoom`
   */
  room: string
}

/**
 * The dungeon as a graph of rooms, edges are doors between rooms (from → to in the order of the grammar)
 */
export interface DungeonGraph {
  nodes: DungeonNode[]
  edges: Array<[number, number]>
  start: number
}

interface ParsedNode {
  key: string
  symbol: string
  deadEnd: boolean
}

interface ParsedGraph {
  nodes: ParsedNode[]
  edges: Array<[string, string]>
  entry: string
  exit: string
}

/**
 * Parses a graph of the grammar datasheets. The syntax is inferred from the rows:
 * - `A_1-B_1`: a chain, edges from each node to the next. The number tells instances of a symbol apart
 * - `,` starts another chain. Its first node hangs off the exit of the first chain unless it names its parent
 * - `X_1(Y_1)`: an edge from Y_1 to X_1
 * - `A_1:B_1`: node A_1 with an extra edge to B_1, closes a loop
 * - `#X_1`: a dead end, it is never the exit of the graph
 *
 * The entry of the graph is the first node, the exit the last node of the first chain that is not a dead end.
 */
export function parseDungeonGraph(text: string): ParsedGraph {
  const nodes = new Map<string, ParsedNode>()
  const edges: Array<[string, string]> = []
  const links: Array<[string, string]> = []
  let entry = ''
  let exit = ''
  const chains = text.split(',').map((it) => it.trim())
  const firstChainNodes: string[] = []
  chains.forEach((chain, chainIndex) => {
    let previous: string | null = null
    chain.split('-').forEach((raw, tokenIndex) => {
      const match = /^(#?)([^:(]+)(?:\(([^)]+)\))?(?::(.+))?$/.exec(raw.trim())
      if (!match) {
        throw new Error(`dungeon graph: cannot parse '${raw}' in '${text}'`)
      }
      const [, dead, key, parent, link] = match
      if (!nodes.has(key)) {
        nodes.set(key, { key, symbol: key.replace(/_\d+$/, ''), deadEnd: !!dead })
      }
      if (previous) {
        edges.push([previous, key])
      }
      if (parent && parent !== previous) {
        edges.push([parent, key])
      }
      if (link) {
        links.push([key, link])
      }
      if (chainIndex === 0) {
        firstChainNodes.push(key)
      } else if (tokenIndex === 0 && !parent) {
        // resolved after the first chain is known
        links.push(['', key])
      }
      previous = key
    })
  })
  entry = firstChainNodes[0]
  exit = [...firstChainNodes].reverse().find((it) => !nodes.get(it)!.deadEnd) ?? entry
  for (const [from, to] of links) {
    edges.push([from || exit, to])
  }
  return { nodes: [...nodes.values()], edges, entry, exit }
}

/**
 * Expands the seed graph by the grammar until only rooms are left. A symbol with several rules picks one by weight
 * (uniformly when all weights are 0, as for the Catacombs themes).
 */
export function expandDungeonGraph(rules: DungeonRules, random: Random): DungeonGraph {
  const roomIds = new Set(rules.rooms.map((it) => it.id))
  const bySymbol = new Map<string, DungeonGrammarRule[]>()
  for (const rule of rules.grammars) {
    // identity rules (StartRoom → StartRoom) mark terminals
    if (rule.graph === rule.symbol) {
      continue
    }
    const list = bySymbol.get(rule.symbol) ?? []
    list.push(rule)
    bySymbol.set(rule.symbol, list)
  }

  let nextId = 0
  const nodes = new Map<number, DungeonNode & { symbol: string }>()
  const edges: Array<[number, number]> = []

  const instantiate = (graph: ParsedGraph) => {
    const ids = new Map<string, number>()
    for (const node of graph.nodes) {
      const id = nextId++
      ids.set(node.key, id)
      nodes.set(id, { id, room: node.symbol, symbol: node.symbol })
    }
    for (const [from, to] of graph.edges) {
      edges.push([ids.get(from)!, ids.get(to)!])
    }
    return { entry: ids.get(graph.entry)!, exit: ids.get(graph.exit)! }
  }

  const seed = instantiate(parseDungeonGraph(rules.seedGraph))
  for (let pass = 0; pass < 32; pass++) {
    const pending = [...nodes.values()].filter((it) => !roomIds.has(it.symbol))
    if (!pending.length) {
      break
    }
    for (const node of pending) {
      const candidates = bySymbol.get(node.symbol)
      if (!candidates?.length) {
        throw new Error(`dungeon graph: '${node.symbol}' is neither a room nor has a grammar rule`)
      }
      const rule = pickWeighted(candidates, random)
      const { entry, exit } = instantiate(parseDungeonGraph(rule.graph))
      nodes.delete(node.id)
      for (const edge of edges) {
        if (edge[1] === node.id) {
          edge[1] = entry
        }
        if (edge[0] === node.id) {
          edge[0] = exit
        }
      }
    }
  }
  const left = [...nodes.values()].filter((it) => !roomIds.has(it.symbol))
  if (left.length) {
    throw new Error(`dungeon graph: not expanded: ${left.map((it) => it.symbol).join(', ')}`)
  }
  return {
    nodes: [...nodes.values()].map((it) => ({ id: it.id, room: it.room })),
    edges,
    start: seed.entry,
  }
}

function pickWeighted<T extends { weight: number }>(items: T[], random: Random): T {
  const total = items.reduce((sum, it) => sum + Math.max(0, it.weight), 0)
  if (total <= 0) {
    return items[random.nextInt(0, items.length)]
  }
  let ticket = random.nextFloat() * total
  for (const item of items) {
    ticket -= Math.max(0, item.weight)
    if (ticket < 0) {
      return item
    }
  }
  return items[items.length - 1]
}
