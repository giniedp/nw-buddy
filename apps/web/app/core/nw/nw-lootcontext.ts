import { Loottable } from '@nw-data/types'
import { CaseInsensitiveMap, CaseInsensitiveSet } from '../utils'
import { LootBucketEntry, LootBucketTag, LootTableEntry, LootTableItem } from './utils'

export type LootBucketConditionNames =
  | 'Level'
  | 'EnemyLevel'
  | 'MinContLevel' // zone
  // watermark
  | 'HWMBlunderbuss'
  | 'HWMLoot2HAxe'
  | 'HWMLoot2HHammer'
  | 'HWMLootAmulet'
  | 'HWMLootBow'
  | 'HWMLootChest'
  | 'HWMLootFeet'
  | 'HWMLootFireStaff'
  | 'HWMLootHands'
  | 'HWMLootHatchet'
  | 'HWMLootHead'
  | 'HWMLootIceMagic'
  | 'HWMLootLegs'
  | 'HWMLootLifeStaff'
  | 'HWMLootMusket'
  | 'HWMLootRapier'
  | 'HWMLootRing'
  | 'HWMLootShield'
  | 'HWMLootSpear'
  | 'HWMLootSword'
  | 'HWMLootToken'
  | 'HWMLootVoidGauntlet'

export type LootTableConditionNames =
  | 'Level'
  | 'EnemyLevel'
  | 'MinPOIContLevel' // zone

export type LootTableTags =
  | 'GlobalMod'
  // mobs
  | 'Common'
  | 'Elite'
  | 'Named'
  | 'Goblin'
  // dungeons
  | 'Amrine'
  | 'CutlassKeys00'
  | 'Ebonscale00'
  | 'Ebonscale00_Mut'
  | 'Edengrove00'
  | 'Reekwater00'
  | 'RestlessShores01'
  | 'ShatterMtn00'
  | 'ShatteredObelisk'
  | 'MutDiff'
  // dungeon mutations
  | 'Fire'
  | 'Ice'
  | 'Void'
  | 'Nature'
  // fishing
  | 'FishRarity'
  | 'FishSize'
  | 'Fresh'
  | 'Salt'
  | 'SummerFishRarity'
  | 'LootTableDiverted'
  // gypsum conditions
  | 'GypsumBlack'
  | 'GypsumBlue'
  | 'GypsumYellow'

export class LootContext {

  /**
   * Tags in this context
   */
  public readonly tags: Set<string>

  /**
   * Condition values in this context
   */
  public readonly values: Map<string, number | string>

  public constructor(options: {
    tags: string[]
    values: Record<string, number | string>
  }) {
    this.tags = new CaseInsensitiveSet(options.tags || [])
    this.values = new CaseInsensitiveMap(Object.entries(options.values || {}))
  }

  public static create(options: {
    tags: string[],
    values: Partial<Record<LootBucketConditionNames | LootTableConditionNames, number | string>>
  }) {
    return new LootContext(options)
  }

  /**
   * Resolves accessible items from given loottable
   */
  public accessLoottable(table: LootTableEntry) {
    const tags = table.Conditions
    if (!tags?.length) {
      return [...table.Items]
    }
    return table.Items.filter((item) => {
      return tags.every((tag) => testTableCondition(tag, this, item))
    })
  }

  /**
   * Checks whether this context can access the given lootbucket
   */
  public accessLootbucket(entry: LootBucketEntry): boolean {
    const tags = Array.from(entry.Tags.keys())
    if (!tags.length) {
      return true
    }
    for (const tag of tags) {
      if (!testBucketCondition(tag, this, entry)) {
        return false
      }
    }
    return true
  }
}

function testTableCondition(condition: string, context: LootContext, item: LootTableItem) {
  if (!condition) {
    return true
  }
  if (context.values.has(condition)) {
    return context.values.get(condition) >= Number(item.Prob)
  }
  return context.tags.has(condition)
}

function testBucketCondition(condition: string, context: LootContext, item: LootBucketEntry) {
  if (!condition) {
    return true
  }
  if (context.values.has(condition)) {
    const tag = item.Tags?.get(condition)
    const value = context.values.get(condition)
    switch (tag?.Value?.length) {
      case 1: {
        return tag.Value[0] <= Number(value)
      }
      case 2: {
        return tag.Value[0] <= Number(value) && Number(value) <= tag.Value[1]
      }
    }
  }
  return context.tags.has(condition)
}
