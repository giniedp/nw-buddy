import {
  canAccessLootBucketRow,
  canAccessLootTable,
  canAccessLootTableRow,
  LootBucketRow,
  LootContext,
  LootContextValues,
  LootTable,
  LootTableRow,
} from '@nw-data/common'
import { CaseInsensitiveMap, CaseInsensitiveSet } from '~/utils'

export class ConstrainedLootContext implements LootContext {
  /**
   * Tags in this context
   */
  public readonly tags: Set<string>

  /**
   * Condition values in this context
   */
  public readonly values: Map<string, number | string | number[]>

  /**
   * Table and bucket ids to ignore
   */
  public ignoreTablesAndBuckets: string[]

  /**
   * Collect only bucket items that have one of these tags
   */
  public bucketTags: string[]

  public constructor(options: { tags: string[]; values: Record<string, number | string | number[]> }) {
    this.tags = new CaseInsensitiveSet(options.tags || [])
    this.values = new CaseInsensitiveMap(Object.entries(options.values || {}))
  }

  public static create(options: { tags: string[]; values: LootContextValues }) {
    return new ConstrainedLootContext(options)
  }

  /**
   * Checks whether this context can access the given loot table
   */
  public canAccessTable(table: LootTable): boolean {
    if (this.isIgnoredId(table.LootTableID)) {
      return false
    }
    return canAccessLootTable(this, table)
  }

  /**
   * Checks whether this context can access the given loot table row
   */
  public canAccessTableRow(table: LootTable, row: LootTableRow): boolean {
    if (this.isIgnoredId(table.LootTableID)) {
      return false
    }
    return canAccessLootTableRow(this, table, row)
  }

  /**
   * Checks whether this context can access the given lootbucket
   */
  public canAccessBucketRow(entry: LootBucketRow): boolean {
    if (this.isIgnoredId(entry.LootBucket) || this.isExcludedEntry(entry)) {
      return false
    }
    return canAccessLootBucketRow(this, entry)
  }

  private isIgnoredId(tableOrBucketId: string) {
    return this.ignoreTablesAndBuckets?.includes(tableOrBucketId)
  }

  private isExcludedEntry(entry: LootBucketRow) {
    if (!this.bucketTags) {
      return false
    }
    return !this.bucketTags.some((tag) => entry.Tags.has(tag))
  }
}
