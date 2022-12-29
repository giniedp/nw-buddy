import { CaseInsensitiveSet, eqCaseInsensitive } from '~/utils'
import { LootBucketRow, LootTableEntry, LootTableRow } from '../utils'
import { LootContext } from './loot-context'

export type LootNode = LootBucketNode | LootBucketRowNode | LootTableNode | LootTableItemNode // | LootTableRowNode

export interface LootNodeBase<T> {
  parent?: LootNode
  children: LootNode[]
  unlocked?: boolean
  unlockedItemcount?: number
  totalItemCount?: number
  chanceRelative?: number
  chanceAbsolute?: number
  highlight?: boolean
  ref: string
  data: T
  row?: LootTableRow
  type: string
}

export interface LootTableNode extends LootNodeBase<LootTableEntry> {
  type: 'table'
}

export interface LootTableItemNode extends LootNodeBase<string> {
  type: 'table-item'
}

// export interface LootTableRowNode extends LootNodeBase<LootTableRow> {
//   type: 'table-row'
// }

export interface LootBucketNode extends LootNodeBase<string> {
  type: 'bucket'
}

export interface LootBucketRowNode extends LootNodeBase<LootBucketRow> {
  type: 'bucket-row'
}

export function buildLootGraph({
  entry,
  tables,
  buckets,
}: {
  entry: LootTableEntry
  tables: Map<string, LootTableEntry>
  buckets: Map<string, LootBucketRow[]>
}): LootNode {
  return resolve(entry)

  function resolve(table: LootTableEntry, parent?: LootNode, row?: LootTableRow) {
    if (!table) {
      return null
    }
    parent = buildTableNode(table, parent, row)
    table.Items.forEach((row) => {
      if (row.ItemID) {
        buildTableItemNode(row, parent)
      }
      if (row.LootBucketID) {
        const bucketRows = buckets.get(row.LootBucketID)
        if (bucketRows?.length) {
          const bucketNode = buildBucketNode(bucketRows[0], parent, row)
          bucketRows.forEach((row) => {
            buildBucketRowNode(row, bucketNode)
          })
        }
      }
      if (row.LootTableID) {
        resolve(tables.get(row.LootTableID), parent, row)
      }
    })
    return parent
  }
}

function buildTableNode(value: LootTableEntry, parent: LootNode, row?: LootTableRow): LootTableNode {
  const node: LootTableNode = {
    type: 'table',
    data: value,
    row: row,
    parent: parent,
    ref: value.LootTableID,
    children: [],
  }
  if (parent) {
    parent.children.push(node)
  }
  return node
}

function buildTableItemNode(value: LootTableRow, parent: LootNode): LootTableItemNode {
  const node: LootTableItemNode = {
    type: 'table-item',
    row: value,
    data: value.ItemID,
    parent: parent,
    ref: value.ItemID || value.LootBucketID || value.LootTableID,
    children: [],
  }
  if (parent) {
    parent.children.push(node)
  }
  return node
}

function buildBucketNode(value: LootBucketRow, parent: LootNode, row?: LootTableRow): LootBucketNode {
  const node: LootBucketNode = {
    type: 'bucket',
    data: value.LootBucket,
    row: row,
    parent: parent,
    ref: value.LootBucket,
    children: [],
  }
  if (parent) {
    parent.children.push(node)
  }
  return node
}

function buildBucketRowNode(value: LootBucketRow, parent: LootNode): LootBucketRowNode {
  const node: LootBucketRowNode = {
    type: 'bucket-row',
    data: value,
    parent: parent,
    ref: value.Item,
    children: [],
  }
  if (parent) {
    parent.children.push(node)
  }
  return node
}

export function updateLootGraph({ graph, context, dropChance, highlight }: { graph: LootNode, context: LootContext, dropChance?: number, highlight?: string }) {
  graph = cloneGraph(graph)
  updateAccess(graph, context)
  updateCount(graph)
  updateChance(graph, dropChance ?? 1)
  if (highlight) {
    updateHighlight(graph, highlight)
  }
  return graph
}

export function collectLootIds(node: LootNode, result = new CaseInsensitiveSet<string>()) {
  if (node.unlocked) {
    if (node.type === 'table-item') {
      result.add(node.data)
    }
    if (node.type === 'bucket-row') {
      result.add(node.data.Item)
    }
    for (const child of node.children) {
      collectLootIds(child, result)
    }
  }
  return result
}

export function extractLootTagsFromGraph(graph: LootNode, result = new Set<string>()) {
  let tags: string[] = []
  if (graph.type === 'table') {
    tags = graph.data.Conditions || []
  }
  if (graph.type === 'table-item') {
    //
  }
  if (graph.type === 'bucket') {
    //
  }
  if (graph.type === 'bucket-row') {
    tags = Array.from(graph.data.Tags.keys())
  }
  for (const tag of tags) {
    result.add(tag)
  }
  for (const child of graph.children) {
    extractLootTagsFromGraph(child, result)
  }
  return result
}

function cloneGraph(node: LootNode) {
  node = {
    ...node,
  }
  node.children = node.children?.map((child) => {
    child.parent = node
    return cloneGraph(child)
  }) || []
  return node
}

function updateAccess(node: LootNode, context: LootContext) {
  let unlocked = !node.parent || node.parent.unlocked
  if (node.row) {
    const parent = node.parent as LootTableNode
    unlocked = unlocked && context.accessTableRow(parent.data, node.row)
  }
  if (node.type === 'table') {
    node.unlocked = unlocked && context.accessTable(node.data)
  } else if (node.type === 'bucket-row') {
    node.unlocked = unlocked && context.accessBucketRow(node.data)
  } else {
    node.unlocked = unlocked
  }

  for (const child of node.children) {
    updateAccess(child, context)
  }
}

function updateCount(graph: LootNode) {
  for (const child of graph.children) {
    updateCount(child)
  }
  graph.unlockedItemcount = graph.children.reduce((c, node) => c + (node.unlockedItemcount || 0), 0)
  graph.totalItemCount = graph.children.reduce((c, node) => c + (node.totalItemCount || 0), 0)
  if (graph.type === 'table') {
    //
  }
  if (graph.type === 'table-item') {
    graph.totalItemCount += 1
    if (graph.unlocked) {
      graph.unlockedItemcount += 1
    }
  }
  if (graph.type === 'bucket') {
    //
  }
  if (graph.type === 'bucket-row') {
    if (graph.data.Item) {
      graph.totalItemCount += 1
      if (graph.unlocked) {
        graph.unlockedItemcount += 1
      }
    }
  }
}

function updateChance(node: LootNode, dropChance = 1) {
  node.chanceAbsolute = dropChance

  const table = getTable(node.parent)
  if (table) {
    const maxroll = table.MaxRoll
    const unlockedSiblings = node.parent.children?.reduce((c, node) => (node.unlocked ? c + 1 : c), 0) || 0
    if (!unlockedSiblings || !node.unlocked) {
      node.chanceRelative = 0
    } else {
      node.chanceRelative = table['AND/OR'] === 'OR' ? 1 / unlockedSiblings : 1

      if (maxroll && node.row && Number(node.row.Prob)) {
        const prob = Number(node.row.Prob)
        node.chanceRelative *= 1 - prob / maxroll
      }
    }
  } else {
    node.chanceRelative = 1
  }

  node.chanceAbsolute *= node.chanceRelative
  for (const child of node.children) {
    updateChance(child, node.chanceAbsolute)
  }
}

function updateHighlight(node: LootNode, itemId: string) {
  const leafs: LootNode[] = []
  walktLootGraph(node, (it) => {
    let id: string = null
    if (it.type === 'table-item') {
      id = it.data
    }
    if (it.type === 'bucket-row') {
      id = it.data.Item
    }
    if (eqCaseInsensitive(id, itemId)) {
      leafs.push(it)
    }
  })
  for (const leaf of leafs) {
    walkUp(leaf, (it) => it.highlight = true)
  }
}

function getTable(node: LootNode) {
  return node?.type === 'table' ? node.data : null
}

function walktLootGraph(node: LootNode, fn: (node: LootNode) => void | boolean) {
  walk([node], fn)
}
function walkUp(node: LootNode, fn: (node: LootNode) => void) {
  if (!node) {
    return
  }
  fn(node)
  walkUp(node.parent, fn)
}

function walk(nodes: LootNode[], fn: (node: LootNode) => void | boolean) {
  for (const child of nodes) {
    if (fn(child) === false) {
      //return false
    }
    walk(child.children, fn)
  }
  return true
}
