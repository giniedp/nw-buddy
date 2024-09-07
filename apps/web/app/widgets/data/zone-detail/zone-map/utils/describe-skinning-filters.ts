import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'

import { svgScalpel } from '~/ui/icons/svg'
import { eqCaseInsensitive } from '~/utils'
import { getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from '../utils/parse-loottable'
import { CREATURES } from './creatures'

export function describeSkinningFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (gatherable.Tradeskill !== 'Skinning' || eqCaseInsensitive(lootTable.original, 'Empty')) {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const icon = getGatherableIcon(gatherable)
  const creature = CREATURES.find((it) => lootTable.tokenized.some((token) => eqCaseInsensitive(token, it)))
  const result: FilterGroup = {
    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: svgScalpel,

    category: lootTable.original,
    categoryLabel: lootTable.tokenized.filter((it) => it !== 'Skinning' && it !== 'Farm').join(' '),
    categoryIcon: icon,

    subcategory: '',
    subcategoryLabel: lootTable.tokenized.filter((it) => it !== 'Skinning' && it !== 'Farm').join(' '),

    properties: {
      color: null,
      icon: null,
      label: null,
      size: 1,

      lootTable: lootTable.original,
    },
  }
  if (creature) {
    result.category = creature
    result.categoryLabel = creature
    result.subcategory = lootTable.original
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

  return result
}
