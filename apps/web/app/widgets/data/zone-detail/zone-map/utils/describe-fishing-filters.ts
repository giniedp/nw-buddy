import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgFishingRod } from '~/ui/icons/svg'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

export function describeFishingFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (gatherable.Tradeskill !== 'Fishing') {
    return null
  }

  const result: FilterGroup = {
    section: 'Fishing',
    sectionLabel: 'ui_fishing',
    sectionIcon: svgFishingRod,

    category: gatherable.GatherableID,
    categoryLabel: gatherable.DisplayName || gatherable.GameEventID,

    subcategory: '',
    subcategoryLabel: '',

    properties: {
      color: null,
      icon: null,
      label: null,
      size: 1,

      lootTableID: lootTable.original,
      title: gatherable.DisplayName,
    },
  }
  return result
}
