import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgTreasureChest } from '~/ui/icons/svg'
import { humanize } from '~/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

const CHESTS = ['Chest', 'Chests', 'Sarcophagi', 'Loot', 'Container']
export function describeChestsFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (!CHESTS.some((it) => lootTable.tokenized.includes(it))) {
    return null
  }

  const result: FilterGroup = {
    section: 'Chests',
    sectionLabel: 'Chests',
    sectionIcon: svgTreasureChest,
    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),
    subcategory: '',
    subcategoryLabel: variant?.Name || gatherable.DisplayName || lootTable.tokenized.join(' '),
    properties: {
      color: null,
      icon: null,
      label: null,
      size: 1,
      //
      lootTableID: lootTable.original,
      gatherableID: gatherable.GatherableID,
      variationID: variant?.VariantID,
      title: variant?.Name || gatherable.DisplayName || '',
    },
  }

  if (lootTable.tokenized.includes('Beach')) {
    result.category = 'Beach'
    result.categoryLabel = 'Starter Beach'
    result.subcategory = lootTable.normalized
  } else if (variant) {
    result.category = lootTable.original
    result.categoryLabel = lootTable.tokenized.filter((it) => !CHESTS.includes(it)).join(' ')
    result.subcategory = variant.VariantID
  }

  return result
}
