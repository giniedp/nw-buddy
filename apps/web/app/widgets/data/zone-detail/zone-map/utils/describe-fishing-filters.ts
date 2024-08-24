import { GatherableVariation, NW_FALLBACK_ICON } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { humanize } from '~/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { ParsedLootTable } from './parse-loottable'
import { getTradeskillIcon } from '~/widgets/data/gatherable-detail/utils'

export function describeFishingFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Fishing') {
    return null
  }

  const props: FilterDataPropertiesWithVariant = {
    name: gatherable.DisplayName,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: 'Fishing',
    sectionLabel: 'Fishing',
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

    category: gatherable.GatherableID,
    categoryLabel: gatherable.DisplayName || gatherable.GameEventID,

    subcategory: '',
    subcategoryLabel: '',
  }

  if (variant) {
    console.log({ variant })
  }
  return props
}
