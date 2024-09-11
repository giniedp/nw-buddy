import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgBoxesStacked } from '~/ui/icons/svg'
import { getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

export function describeSettlementFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (!lootTable.original.startsWith('Settlement') && !lootTable.original.endsWith('Cart')) {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const result: FilterGroup = {
    section: 'Settlement',
    sectionLabel: 'Settlement goods',
    sectionIcon: svgBoxesStacked,

    category: lootTable.original,
    categoryLabel: variant?.Name || gatherable.DisplayName || lootTable.tokenized.join(' '),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',
    properties: {
      color: null,
      icon: null,
      label: null,
      size: 1,

      lootTableID: lootTable.original,
      gatherableID: gatherable.GatherableID,
      variationID: variant?.VariantID,
      title: variant?.Name || gatherable.DisplayName,
    },
  }

  return result
}
