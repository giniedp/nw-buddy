import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'

import { eqCaseInsensitive, humanize } from '~/utils'
import { getGatherableIcon, getTradeskillIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { ParsedLootTable } from '../utils/parse-loottable'
import { parseSizeVariant } from '../utils/parse-size-variant'

export function describeSkinningFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Skinning' || eqCaseInsensitive(lootTable.original, 'Empty')) {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const icon = getGatherableIcon(gatherable)
  const props: FilterDataPropertiesWithVariant = {
    name,
    color: null,
    icon: icon,
    variant: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

    category: lootTable.original,
    categoryLabel: lootTable.tokenized.filter((it) => it !== 'Skinning' && it !== 'Farm').join(' '),
    categoryIcon: icon,

    subcategory: '',
    subcategoryLabel: lootTable.tokenized.filter((it) => it !== 'Skinning' && it !== 'Farm').join(' '),
  }

  // const size = parseSizeVariant(lootTable)
  // if (size) {
  //   props.category = lootTable.tokenized
  //     .filter((it) => it !== 'Skinning' && it !== 'Farm' && it !== size.size)
  //     .join(' ')
  //   props.categoryLabel = humanize(props.category)
  //   props.size = size.scale
  //   props.variant = {
  //     id: size.size,
  //     label: size.label,
  //     lootTable: lootTable.original,
  //     name: variant?.Name || gatherable.DisplayName,
  //   }
  // }

  return props
}
