import type { HouseItems, MasterItemDefinitions } from '../generated'
import { NW_LOOT_GlobalMod } from './constants'
import { getItemRarityNumeric, isMasterItem } from './item'
import type { LootConditionTag } from './loot'
import type { LootBucketRow } from './loot-buckets'
import type { LootTable, LootTableRow } from './loot-tables'
import { CaseInsensitiveMap } from './utils/caseinsensitive-map'
import { CaseInsensitiveSet } from './utils/caseinsensitive-set'

export interface LootContext {
  tags: Set<string>
  values: Map<string, number | string | number[]>
}

export function lootContext(
  tags: string[],
  value: LootContextValues,
): LootContext {
  return {
    tags: new CaseInsensitiveSet(tags),
    values: new CaseInsensitiveMap(Object.entries(value)),
  }
}

export type LootContextValues = Partial<Record<LootConditionTag, number | string | number[]>>
export function lootContextValues(values: LootContextValues): LootContextValues {
  return values
}

export function canAccessLootTable(context: LootContext, table: LootTable): boolean {
  const tags = table.Conditions
  if (!tags?.length) {
    return true
  }
  for (const tag of tags) {
    if (!testTableCondition(context, tag)) {
      return false
    }
  }
  return true
}

export function canAccessLootTableRow(context: LootContext, table: LootTable, row: LootTableRow): boolean {
  const tags = table.Conditions
  if (!tags?.length) {
    return true
  }
  for (const tag of tags) {
    if (!testTableRowCondition(context, tag, row)) {
      return false
    }
  }
  return true
}

export function canAccessLootBucketRow(context: LootContext, entry: LootBucketRow): boolean {
  const tags = Array.from(entry.Tags.keys())
  if (entry.MatchOne) {
    if (tags.length === 0) {
      return true
    }
    for (const tag of tags) {
      if (testBucketRowCondition(context, tag, entry)) {
        return true
      }
    }
    return false
  } else {
    for (const tag of tags) {
      if (!testBucketRowCondition(context, tag, entry)) {
        return false
      }
    }
    return true
  }
}

function testTableCondition(context: LootContext, condition: string): boolean {
  if (!condition) {
    return true
  }
  return context.tags.has(condition) || context.values.has(condition)
}

function testTableRowCondition(context: LootContext, condition: string, row: LootTableRow): boolean {
  if (!condition) {
    return true
  }
  if (context.values.has(condition)) {
    const value = context.values.get(condition)
    return testContextValue(value, Number(row.Prob), null)
  }
  return context.tags.has(condition)
}

function testBucketRowCondition(context: LootContext, condition: string, row: LootBucketRow): boolean {
  if (!condition) {
    return true
  }
  if (context.values.has(condition)) {
    const tag = row.Tags?.get(condition)
    const value = context.values.get(condition)
    switch (tag?.value?.length) {
      case 1: {
        return testContextValue(value, tag.value[0], null)
      }
      case 2: {
        return testContextValue(value, tag.value[0], tag.value[1])
      }
    }
  }
  return context.tags.has(condition)
}

function testContextValue(contextValue: number | string | number[], conditionValue: number, conditionValueMax: number) {
  if (contextValue === '*') {
    // custom value, e.g. to bypass all player levels
    return true
  }
  if (Array.isArray(contextValue)) {
    // custom value type, e.g. to test a range of vital levels
    for (const v of contextValue) {
      if (testContextValueRange(v, conditionValue, conditionValueMax)) {
        return true
      }
    }
    return false
  }
  return testContextValueRange(Number(contextValue), conditionValue, conditionValueMax)
}

function testContextValueRange(value: number, conditionValue: number, conditionValueMax: number) {
  if (conditionValueMax != null) {
    return conditionValue <= value && value <= conditionValueMax
  }
  return conditionValue <= value
}

export interface ItemSalvageInfo {
  tableId: string
  tags: string[]
  values: LootContextValues
}

export function getItemSalvageInfo(item: MasterItemDefinitions | HouseItems, playerLevel: number | '*', itemGearScore: number | '*'): ItemSalvageInfo {
  if (!item || (isMasterItem(item) && !item.IsSalvageable)) {
    return null
  }
  const recipe = item.RepairRecipe
  if (!recipe?.startsWith('[LTID]')) {
    return null
  }
  return {
    tableId: recipe.replace('[LTID]', ''),
    tags: [NW_LOOT_GlobalMod, ...((item as MasterItemDefinitions)?.SalvageLootTags || [])],
    values: lootContextValues({
      Level: typeof playerLevel === 'number' ? playerLevel - 1 : playerLevel,
      MinContLevel: (item as MasterItemDefinitions)?.ContainerLevel,
      SalvageItemRarity: getItemRarityNumeric(item),
      SalvageItemTier: item.Tier,
      SalvageItemGearScore: itemGearScore
    }),
  }
}
