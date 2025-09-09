import { uniq } from 'lodash'
import type { NwDataSheets } from '../db/nw-data-sheets'
import type { HouseItems, MasterItemDefinitions } from '../generated'
import { NW_LOOT_GlobalMod } from './constants'
import { getItemRarityNumeric, isMasterItem } from './item'
import { parseLootRef, parseLootTag } from './loot'
import {
  canAccessLootBucketRow,
  canAccessLootTable,
  canAccessLootTableRow,
  LootContext,
  lootContext,
} from './loot-context'

export function itemSalvageLootTable(item: MasterItemDefinitions | HouseItems) {
  if (!item?.IsSalvageable) {
    return null
  }
  const ref = parseLootRef(item.RepairRecipe)
  if (ref?.prefix !== 'LTID') {
    return null
  }
  return ref.name
}

export function itemSalvageContext(item: MasterItemDefinitions | HouseItems) {
  if (!item || (isMasterItem(item) && !item.IsSalvageable)) {
    return null
  }

  const context = lootContext([NW_LOOT_GlobalMod], {
    Level: '*',
    MinContLevel: (item as MasterItemDefinitions)?.ContainerLevel,
    SalvageItemRarity: getItemRarityNumeric(item),
    SalvageItemTier: item.Tier,
    SalvageItemGearScore: '*',
  })
  const table = itemSalvageLootTable(item)
  if (table) {
    context.tags.add(table)
  }
  if (isMasterItem(item)) {
    for (const it of item.SalvageLootTags || []) {
      const tag = parseLootTag(it)
      if (tag.value) {
        context.values.set(tag.name, tag.value)
      } else {
        context.tags.add(tag.name)
      }
    }
  }
  return context
}

export async function itemSalvagesTo(db: NwDataSheets, itemId: string) {
  const item = await db.itemOrHousingItem(itemId)
  const context = itemSalvageContext(item)
  if (!context) {
    return null
  }
  const lootTable = itemSalvageLootTable(item)
  const itemIds = await walkLootTable(db, lootTable, context, [])
  return uniq(itemIds).sort()
}

async function walkLootTable(db: NwDataSheets, tableId: string, context: LootContext, result: string[]) {
  const table = await db.lootTablesById(tableId)
  if (!table) {
    return result
  }
  if (!canAccessLootTable(context, table)) {
    return result
  }
  for (const row of table.Items) {
    if (!canAccessLootTableRow(context, table, row)) {
      continue
    }
    if (row.ItemID) {
      result.push(row.ItemID)
    }
    if (row.LootTableID) {
      await walkLootTable(db, row.LootTableID, context, result)
    }
    if (row.LootBucketID) {
      await walkLootBucket(db, row.LootBucketID, context, result)
    }
  }
  return result
}

async function walkLootBucket(db: NwDataSheets, bucketId: string, context: LootContext, result: string[]) {
  const bucket = await db.lootBucketsById(bucketId)
  if (!bucket) {
    return
  }
  for (const row of bucket) {
    if (!canAccessLootBucketRow(context, row)) {
      continue
    }
    if (row.Item) {
      result.push(row.Item)
    }
  }
}
