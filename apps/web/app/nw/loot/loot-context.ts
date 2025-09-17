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

  private skipTables: Set<string>
  private skipBuckets: Set<string>
  private skipBucketTags: Set<string>
  private onlyBucketTags: Set<string>

  public constructor(options: {
    tags: string[]
    values: Record<string, number | string | number[]>
    skipTables?: string[]
    skipBuckets?: string[]
    skipBucketTags?: string[]
    onlyBucketTags?: string[]
  }) {
    this.tags = new CaseInsensitiveSet(options.tags || [])
    this.values = new CaseInsensitiveMap(Object.entries(options.values || {}))
    if (options.skipTables) {
      this.skipTables = new CaseInsensitiveSet(options.skipTables)
    }
    if (options.skipBuckets) {
      this.skipBuckets = new CaseInsensitiveSet(options.skipBuckets)
    }
    if (options.skipBucketTags) {
      this.skipBucketTags = new CaseInsensitiveSet(options.skipBucketTags)
    }
    if (options.onlyBucketTags) {
      this.onlyBucketTags = new CaseInsensitiveSet(options.onlyBucketTags)
    }
  }

  public static create(options: { tags: string[]; values: LootContextValues }) {
    return new ConstrainedLootContext(options)
  }

  /**
   * Checks whether this context can access the given loot table
   */
  public canAccessTable(table: LootTable): boolean {
    if (this.isTableSkipped(table.LootTableID)) {
      return false
    }
    return canAccessLootTable(this, table)
  }

  /**
   * Checks whether this context can access the given loot table row
   */
  public canAccessTableRow(table: LootTable, row: LootTableRow): boolean {
    if (this.isTableSkipped(table.LootTableID)) {
      return false
    }
    return canAccessLootTableRow(this, table, row)
  }

  /**
   * Checks whether this context can access the given lootbucket
   */
  public canAccessBucketRow(entry: LootBucketRow): boolean {
    if (this.isBucketSkipped(entry.LootBucket) || this.isRowSkipped(entry)) {
      return false
    }
    return canAccessLootBucketRow(this, entry)
  }

  private isTableSkipped(tableId: string) {
    return this.skipTables?.has(tableId)
  }

  private isBucketSkipped(bucketId: string) {
    return this.skipBuckets?.has(bucketId)
  }

  private isRowSkipped(entry: LootBucketRow) {
    if (!entry.Tags) {
      return false
    }

    if (this.skipBucketTags?.size) {
      for (const tag in entry.Tags) {
        if (this.skipBucketTags?.has(tag)) {
          return true
        }
      }
    }

    if (this.onlyBucketTags?.size) {
      for (const tag in entry.Tags) {
        if (this.onlyBucketTags.has(tag)) {
          return false
        }
      }
      return true
    }

    return false
  }
}
