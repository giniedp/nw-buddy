import { sortBy } from 'lodash'
import { CaseInsensitiveSet, eqCaseInsensitive } from '~/utils'
import { LootBucketRow, LootTable, LootTableRow } from '../utils'
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
  prob: number
  type: string
}

export interface LootTableNode extends LootNodeBase<LootTable> {
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
  entry: LootTable
  tables: Map<string, LootTable>
  buckets: Map<string, LootBucketRow[]>
}): LootNode {
  return resolve(entry)

  function resolve(table: LootTable, parent?: LootNode, row?: LootTableRow) {
    if (!table) {
      return null
    }
    parent = buildTableNode(table, parent, row)
    for (const row of table.Items) {
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
    }
    return parent
  }
}

function buildTableNode(value: LootTable, parent: LootNode, row?: LootTableRow): LootTableNode {
  const node: LootTableNode = {
    type: 'table',
    data: value,
    row: row,
    prob: getProb(row),
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
    prob: getProb(value),
    data: value.ItemID,
    parent: parent,
    ref: value.ItemID,
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
    prob: getProb(row),
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
    prob: null,
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
    unlocked = unlocked && (context == null || context.accessTableRow(parent.data, node.row))
  }
  if (node.type === 'table') {
    node.unlocked = unlocked && (context == null || context.accessTable(node.data))
  } else if (node.type === 'bucket-row') {
    node.unlocked = unlocked && (context == null || context.accessBucketRow(node.data))
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
  if (!table) {
    node.chanceRelative = 1
  } else {
    const maxroll = table.MaxRoll
    const siblings = node.parent.children.filter((it) => it.unlocked && it.unlockedItemcount)
    if (!siblings.length || !node.unlocked) {
      node.chanceRelative = 0
    } else if (table['AND/OR'] === 'OR') {
      node.chanceRelative = 1
      if (maxroll && node.prob >= 0) {
        const sorted = sortBy(siblings.filter((it) => it.prob >= 0), (it) => it.prob)
        const left = node.prob
        const right = sorted.find((it) => it.prob > node.prob)?.prob ?? maxroll
        const count = sorted.filter((it) => it.prob === node.prob).length
        node.chanceRelative = ((right - left) / maxroll) / count
        // console.log(node.row.LootTableID, {
        //   maxroll,
        //   left,
        //   right,
        //   count,
        //   chance: node.chanceRelative,
        //   prob: node.prob,
        //   sorted
        // })
      }
    } else {
      node.chanceRelative = 1
      if (maxroll && node.prob >= 0) {
        node.chanceRelative *= 1 - node.prob / maxroll
      }
    }
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

function getProb(row: LootTableRow) {
  if (row?.Prob != null) {
    return Number(row.Prob)
  }
  return null
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
