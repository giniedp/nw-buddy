import { VariationsGatherables } from '../generated/types'

export interface GatherableVariation {
  VariantID: string
  Name: string
  Icon: string
  GatherableID: string
  LootTable?: string
}
export function convertGatherableVariations(data: VariationsGatherables[]) {
  const result = new Map<string, GatherableVariation>()
  for (const row of data) {
    const variant = result.get(row.VariantID) || {
      VariantID: row.VariantID,
      GatherableID: row.GatherableEntryID || row.GatherableEntryId,
      Name: row.Name || row.MapTooltipTitleLocTag,
      Icon: row.MapIcon,
    }
    result.set(row.VariantID, variant)
    if (!variant.GatherableID) {
      variant.GatherableID = row.GatherableEntryId
    }
    if (row.GatherableEntryID && variant.GatherableID !== row.GatherableEntryID) {
      console.warn(`GatherableVariation: GatherableID mismatch: ${variant.GatherableID} !== ${row.GatherableEntryID}`)
    }
    if (!variant.LootTable) {
      variant.LootTable = row.LootTableComponent
    }
    if (row.LootTableComponent && variant.LootTable !== row.LootTableComponent) {
      console.warn(`GatherableVariation: LootTable mismatch: ${variant.LootTable} !== ${row.LootTableComponent}`)
    }
  }
  return Array.from(result.values())
}
