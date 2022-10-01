import { LootBucketEntry } from "./lootbuckets"
import { LootTableEntry } from "./loottables"

export function createLootGraph({ tables, buckets }: {
  tables: Map<string, LootTableEntry>,
  buckets: Map<string, LootBucketEntry[]>,
}) {
  const roots = Array.from(tables.values()).filter((it, _, all) => {
    return !all.some((entry) => entry.Items.some((item) => item.LootTableID === it.LootTableID))
  })
  return roots.map((it) => {
    return new LootNode(null, {
      table: it,
      tables,
      buckets
    })
  })
}

export class LootNode {
  public readonly parent?: LootNode
  public readonly table?: LootTableEntry
  public readonly bucket?: LootBucketEntry
  public readonly itemId?: string
  public readonly bucketId?: string
  public children?: LootNode[]

  public constructor(parent: LootNode, options: {
    table?: LootTableEntry
    bucket?: LootBucketEntry
    itemId?: string
    bucketId?: string
    tables: Map<string, LootTableEntry>
    buckets: Map<string, LootBucketEntry[]>
    children?: LootNode[]
  }) {
    if (parent) {
      this.parent = parent
    }
    if (options.bucketId) {
      this.bucketId = options.bucketId
    }
    if (options.itemId) {
      this.itemId = options.itemId
    }
    if (options.children) {
      this.children = options.children
    }
    if (options.table) {
      this.table = options.table,
      this.children = this.table.Items.map((it) => {
        if (it.LootTableID) {
          return new LootNode(this, {
            table: options.tables.get(it.LootTableID),
            buckets: options.buckets,
            tables: options.tables,
          })
        }
        if (it.LootBucketID) {
          return new LootNode(this, {
            bucketId: it.LootBucketID,
            buckets: options.buckets,
            tables: options.tables,
          })
        }
        if (it.ItemID) {
          return new LootNode(this, {
            itemId: it.ItemID,
            buckets: options.buckets,
            tables: options.tables,
          })
        }
        return null
      }).filter((it) => !!it)
    } else if (this.bucketId) {
      this.children = options.buckets.get(this.bucketId).map((it) => {
        return new LootNode(this, {
          bucket: it,
          itemId: it.Item,
          buckets: options.buckets,
          tables: options.tables,
        })
      })
    }
  }

  public static walk(nodes: LootNode[], fn: (node: LootNode) => void) {
    if (!nodes?.length) {
      return
    }
    nodes.forEach((node) => {
      fn(node)
      LootNode.walk(node.children, fn)
    })
  }

  public static getRoot(node: LootNode): LootNode {
    if (!node.parent) {
      node.table?.Conditions
      return node
    }
    return LootNode.getRoot(node.parent)
  }
}
