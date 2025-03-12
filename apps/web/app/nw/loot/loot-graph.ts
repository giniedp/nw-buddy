import { LootBucketRow, LootTable, LootTableRow } from '@nw-data/common'
import { sortBy } from 'lodash'
import { CaseInsensitiveSet, eqCaseInsensitive } from '~/utils'
import { LootContext } from './loot-context'

export type LootNode = LootBucketNode | LootBucketRowNode | LootTableNode | LootTableItemNode // | LootTableRowNode

export interface LootNodeBase<T> {
  trackId: string
  parent?: LootNode
  children: LootNode[]
  isUnlocked?: boolean
  isHighlighted?: boolean
  itemCountUnlocked?: number
  itemCountTotal?: number
  chance?: number
  chanceCumulative?: number
  luckNeeded?: number
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

  function resolve(table: LootTable, parent?: LootNode, row?: LootTableRow, depth = 0) {
    if (!table) {
      return null
    }
    parent = buildTableNode(table, parent, row, depth)
    let index = 0
    for (const row of table.Items) {
      const trackPrefix = `${depth}-${index++}`
      if (row.ItemID) {
        buildTableItemNode(row, parent, trackPrefix)
      }
      if (row.LootBucketID) {
        const bucketRows = buckets.get(row.LootBucketID)
        if (bucketRows?.length) {
          const bucketNode = buildBucketNode(bucketRows[0], parent, row, trackPrefix)
          bucketRows.forEach((row) => {
            buildBucketRowNode(row, bucketNode, trackPrefix)
          })
        }
      }
      if (row.LootTableID) {
        resolve(tables.get(row.LootTableID), parent, row, depth + 1)
      }
    }
    return parent
  }
}

function buildTableNode(value: LootTable, parent: LootNode, row: LootTableRow, track: any): LootTableNode {
  const node: LootTableNode = {
    trackId: `${track}-${value.LootTableID}`,
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

function buildTableItemNode(value: LootTableRow, parent: LootNode, track: any): LootTableItemNode {
  const node: LootTableItemNode = {
    trackId: `${track}-${value.LootBucketID || value.LootTableID || value.ItemID}`,
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

function buildBucketNode(value: LootBucketRow, parent: LootNode, row: LootTableRow, track: any): LootBucketNode {
  const node: LootBucketNode = {
    trackId: `${track}-${String(value.Row)}`,
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

function buildBucketRowNode(value: LootBucketRow, parent: LootNode, track: any): LootBucketRowNode {
  const node: LootBucketRowNode = {
    trackId: `${track}-${String(value.Row)}`,
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

export function updateLootGraph({
  graph,
  context,
  dropChance,
  highlight,
}: {
  graph: LootNode
  context: LootContext
  dropChance?: number
  highlight?: string
}) {
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
  if (node.isUnlocked) {
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

function cloneGraph(node: LootNode) {
  node = {
    ...node,
  }
  node.children =
    node.children?.map((child) => {
      child.parent = node
      return cloneGraph(child)
    }) || []
  return node
}

function updateAccess(node: LootNode, context: LootContext) {
  let unlocked = !node.parent || node.parent.isUnlocked
  if (node.row) {
    const parent = node.parent as LootTableNode
    unlocked = unlocked && !!context && context.accessTableRow(parent.data, node.row)
  }
  if (node.type === 'table') {
    node.isUnlocked = unlocked && !!context && context.accessTable(node.data)
  } else if (node.type === 'bucket-row') {
    node.isUnlocked = unlocked && !!context && context.accessBucketRow(node.data)
  } else {
    node.isUnlocked = unlocked
  }

  for (const child of node.children) {
    updateAccess(child, context)
  }
}

function updateCount(graph: LootNode) {
  for (const child of graph.children) {
    updateCount(child)
  }
  graph.itemCountUnlocked = graph.children.reduce((c, node) => c + (node.itemCountUnlocked || 0), 0)
  graph.itemCountTotal = graph.children.reduce((c, node) => c + (node.itemCountTotal || 0), 0)
  if (graph.type === 'table') {
    //
  }
  if (graph.type === 'table-item') {
    graph.itemCountTotal += 1
    if (graph.isUnlocked) {
      graph.itemCountUnlocked += 1
    }
  }
  if (graph.type === 'bucket') {
    //
  }
  if (graph.type === 'bucket-row') {
    if (graph.data.Item) {
      graph.itemCountTotal += 1
      if (graph.isUnlocked) {
        graph.itemCountUnlocked += 1
      }
    }
  }
}

function updateChance(node: LootNode, dropChance = 1) {
  node.chanceCumulative = dropChance

  const table = getTable(node.parent)
  const siblings = node.parent?.children?.filter((it) => it.isUnlocked && it.itemCountUnlocked) || []
  if (node.type === 'bucket-row') {
    if (!siblings.length || !node.isUnlocked) {
      node.chance = 0
    } else {
      node.chance = 1 / siblings.length
    }
  } else if (!table) {
    node.chance = 1
  } else {
    const maxroll = table.MaxRoll
    if (!siblings.length || !node.isUnlocked || !node.itemCountUnlocked) {
      node.chance = 0
    } else if (table['AND/OR'] === 'OR') {
      // OR case
      node.chance = 1
      if (maxroll && node.prob >= 0) {
        const sorted = sortBy(
          siblings.filter((it) => it.prob >= 0),
          (it) => it.prob,
        )
        const left = node.prob
        const right = sorted.find((it) => it.prob > node.prob)?.prob ?? maxroll
        const range = right - left
        const count = sorted.filter((it) => it.prob === node.prob).length
        node.chance = Math.max(0, range / maxroll / count)
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
      // AND case
      node.chance = 1
      if (maxroll && node.prob >= 0) {
        node.chance *= Math.max(0, 1 - node.prob / maxroll)
      }
    }
    if (maxroll && node.prob >= 0) {
      node.luckNeeded = Math.max(0, node.prob - maxroll)
    } else {
      node.luckNeeded = 0
    }
  }

  node.chanceCumulative *= node.chance
  for (const child of node.children) {
    updateChance(child, node.chanceCumulative)
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
    walkUp(leaf, (it) => (it.isHighlighted = true))
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

function walk(nodes: LootNode[], fn: (node: LootNode) => void | boolean): void {
  for (const child of nodes) {
    fn(child)
    walk(child.children, fn)
  }
}
