import { VariationDataGatherable } from '../generated/types'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'
import { CaseInsensitiveMap } from './utils/caseinsensitive-map'

export interface GatherableVariation {
  VariantID: string
  Name: string
  Icon: string
  Gatherables: Array<{
    GatherableID: string
    LootTable: string[]
  }>
}
export function convertGatherableVariations(data: VariationDataGatherable[]) {
  const result = new CaseInsensitiveMap<string, GatherableVariation>()
  for (const row of data) {
    const gatherableId = row.GatherableEntryID
    if (!result.get(row.VariantID)) {
      result.set(row.VariantID, {
        VariantID: row.VariantID,
        Name: row.Name || row.MapTooltipTitleLocTag,
        Icon: row.MapIcon,
        Gatherables: [],
      })
    }
    const variant = result.get(row.VariantID)
    const gatherable = getGatherable(variant, gatherableId)
    if (row.LootTableComponent && !eqCaseInsensitive(row.LootTableComponent, 'Empty')) {
      if (!gatherable.LootTable.some((it) => eqCaseInsensitive(it, row.LootTableComponent))) {
        gatherable.LootTable.push(row.LootTableComponent)
      }
    }
    if (variant.Gatherables.length > 1) {
      console.warn(`GatherableVariation: multiple gatherables: ${variant.VariantID}`)
    }
  }

  return Array.from(result.values())
}

function getGatherable(variant: GatherableVariation, gatherableId: string) {
  let result = variant.Gatherables.find((it) => eqCaseInsensitive(it.GatherableID, gatherableId))
  if (!result) {
    result = {
      GatherableID: gatherableId,
      LootTable: [],
    }
    variant.Gatherables.push(result)
  }
  return result
}
