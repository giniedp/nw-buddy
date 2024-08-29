import { GatherableVariation, NW_FALLBACK_ICON } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { humanize } from '~/utils'
import { getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

export function describeSettlementFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (!lootTable.original.startsWith('Settlement') && !lootTable.original.endsWith('Cart')) {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const props: FilterDataPropertiesWithVariant = {
    name,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,
    loreID: null,

    section: 'Settlement',
    sectionLabel: 'Settlement goods',
    sectionIcon: NW_FALLBACK_ICON,

    category: lootTable.original,
    categoryLabel: variant?.Name || gatherable.DisplayName || lootTable.tokenized.join(' '),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',
  }

  return props
}
