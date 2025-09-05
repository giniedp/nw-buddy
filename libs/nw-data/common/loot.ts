import type { NwDataSheets } from '../db/nw-data-sheets'
import type { LootBucketRow } from './loot-buckets'
import type { LootTable, LootTableRow } from './loot-tables'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'

export type LootConditionTag =
  // watermark / crafting
  // | 'HWMBlunderbuss'
  // | 'HWMLoot2HAxe'
  // | 'HWMLoot2HHammer'
  // | 'HWMLootAmulet'
  // | 'HWMLootBow'
  // | 'HWMLootChest'
  // | 'HWMLootFeet'
  // | 'HWMLootFireStaff'
  // | 'HWMLootHands'
  // | 'HWMLootHatchet'
  // | 'HWMLootHead'
  // | 'HWMLootIceMagic'
  // | 'HWMLootLegs'
  // | 'HWMLootLifeStaff'
  // | 'HWMLootMusket'
  // | 'HWMLootRapier'
  // | 'HWMLootRing'
  // | 'HWMLootShield'
  // | 'HWMLootSpear'
  // | 'HWMLootSword'
  // | 'HWMLootToken'
  // | 'HWMLootVoidGauntlet'
  //
  | 'Level'
  | 'EnemyLevel'
  | 'MinContLevel' // container/content level
  | 'MinPOIContLevel'
  | 'SalvageItemGearScore'
  | 'SalvageItemRarity'
  | 'SalvageItemTier'
  // currently unused condition tags
  | 'POILevel'
  | 'MinEnemyContLevel'

// prettier-ignore
const LOOT_CONDITION_TAG: Array<LootConditionTag> = [
  'Level',
  'EnemyLevel',
  'MinContLevel',    // used heavily in loot buckets
  'MinPOIContLevel', // used only about 3 times atm.
  'SalvageItemGearScore',
  'SalvageItemRarity',
  'SalvageItemTier',
  // currently unused condition tags
  'POILevel',
  'MinEnemyContLevel',
]

export function isLootTagKnownCondition(tag: string): tag is LootConditionTag {
  return LOOT_CONDITION_TAG.some((it) => eqCaseInsensitive(it, tag))
}

export function hasKnownLootConditionTag(tags: string[]) {
  return tags?.length > 0 && tags.some(isLootTagKnownCondition)
}

/**
 * Either a value or a value range
 */
export type LootConditionValue = [number] | [number, number]
export interface ParsedLootTag {
  prefix: string | null
  name: string
  value: LootConditionValue | null
}

export function parseLootTag(tag: string): ParsedLootTag {
  if (!tag) {
    return null
  }
  const ref = parseLootRef(tag)
  if (!ref) {
    return null
  }

  let name: string = ''
  let value: LootConditionValue = null

  if (ref.name.includes(':')) {
    const [n, r] = ref.name.split(':')
    name = n
    value = parseLootTagValue(r)
  } else {
    name = ref.name
  }
  return {
    prefix: ref.prefix,
    name,
    value,
  }
}

export interface ParsedLootRef {
  prefix: string | null
  name: string
}

export function parseLootRef(value: string): ParsedLootRef {
  if (!value) {
    return null
  }
  let prefix: string = null
  let name: string = ''
  if (value.startsWith('[')) {
    if (!value.includes(']')) {
      console.error('Invalid loot tag or reference', value)
      return null
    }
    const end = value.indexOf(']')
    prefix = value.substring(1, end).toUpperCase()
    name = value.substring(end + 1)
  } else {
    name = value
  }
  return {
    prefix,
    name,
  }
}

export function parseLootTagValue(value: string): LootConditionValue {
  if (value == null) {
    return null
  }
  return value.split('-').map(Number) as any
}

export function testLootContextTag({
  contextTags,
  contextValues,
  tag,
  tagValue,
}: {
  contextTags: Set<string>
  contextValues: Map<string, string | number | number[]>
  tag: string
  tagValue: number | string | LootConditionValue | null
}) {
  if (!tag) {
    // no tag to test
    return true
  }
  const isCondition = isLootTagKnownCondition(tag) || contextValues.has(tag)
  if (isCondition) {
    if (!contextValues.has(tag) || tagValue == null) {
      // known condition tag not present
      return false
    }
    const contextValue = Number(contextValues.get(tag))
    if (typeof tagValue === 'number') {
      return tagValue <= contextValue
    }
    if (typeof tagValue === 'string') {
      return Number(tagValue) <= contextValue
    }
    if (tagValue.length === 1) {
      return tagValue[0] <= contextValue
    }
    if (tagValue.length === 2) {
      return tagValue[0] <= contextValue && contextValue <= tagValue[1]
    }
  }
  return contextTags.has(tag)
}

export interface LootNode {
  prev: LootNode[]
  table: LootTable
  row: LootTableRow
  bucket: LootBucketRow
  next: LootNode
}

export async function getItemLootRoots(db: NwDataSheets, itemId: string): Promise<LootNode[]> {
  const roots: LootNode[] = []
  const buckets = await db.lootBucketsByItemId(itemId)
  if (buckets?.length) {
    for (const bucket of buckets) {
      const tail: LootNode = {
        prev: [],
        next: null,
        bucket,
        table: null,
        row: null
      }
      await buildBackwardsBranch(db, tail)
      roots.push(...resolveRoots(tail))
    }
  }
  const tables = await db.lootTablesByLootItemId(itemId)
  if (tables?.length) {
    for (const table of tables) {
      for (const row of table.Items) {
        if (!eqCaseInsensitive(itemId, row.ItemID)) {
          continue
        }
        const tail: LootNode = {
          prev: [],
          next: null,
          bucket: null,
          table,
          row
        }
        await buildBackwardsBranch(db, tail)
        roots.push(...resolveRoots(tail))
      }
    }
  }
  return roots
}

async function buildBackwardsBranch(db: NwDataSheets, node: LootNode) {
  let tables: LootTable[]

  if (node.bucket) {
    tables = await db.lootTablesByLootBucketId(node.bucket.LootBucket)
  }

  if (node.table) {
    tables = await db.lootTablesByLootTableId(node.table.LootTableID)
  }

  if (!tables?.length) {
    return
  }

  for (const table of tables) {
    for (const row of table.Items) {
      const prev: LootNode = {
        prev: [],
        next: node,
        bucket: null,
        table,
        row: null
      }
      if (node.bucket && row.LootBucketID && eqCaseInsensitive(node.bucket.LootBucket, row.LootBucketID)) {
        prev.row = row
      }
      if (node.table && row.LootTableID && eqCaseInsensitive(node.table.LootTableID, row.LootTableID)) {
        prev.row = row
      }
      if (prev.row) {
        node.prev.push(prev)
        await buildBackwardsBranch(db, prev)
      }
    }
  }
}

function resolveRoots(node: LootNode): LootNode[] {
  if (!node.prev.length) {
    return [node]
  }
  return node.prev.map(resolveRoots).flat()
}
