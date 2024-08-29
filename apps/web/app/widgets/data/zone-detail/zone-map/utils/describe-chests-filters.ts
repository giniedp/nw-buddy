import { GatherableVariation, NW_FALLBACK_ICON } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { humanize } from '~/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

const CHESTS = ['Chest', 'Chests', 'Sarcophagi', 'Loot', 'Container']
export function describeChestsFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (!CHESTS.some((it) => lootTable.tokenized.includes(it))) {
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

    section: 'Chests',
    sectionLabel: 'Chests',
    sectionIcon: NW_FALLBACK_ICON,

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),

    subcategory: '',
    subcategoryLabel: variant?.Name || gatherable.DisplayName || lootTable.tokenized.join(' ')
  }

  if (lootTable.tokenized.includes('Beach')) {
    props.category = 'Beach'
    props.categoryLabel = 'Starter Beach'
    props.subcategory = lootTable.normalized
  } else if (variant) {
    props.category = lootTable.original
    props.categoryLabel = lootTable.tokenized.filter((it) => !CHESTS.includes(it)).join(' ')
    props.subcategory = variant.VariantID
  }

  return props
}
