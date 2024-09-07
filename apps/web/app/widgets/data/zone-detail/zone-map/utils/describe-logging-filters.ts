import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgAxe } from '~/ui/icons/svg'
import { eqCaseInsensitive, humanize } from '~/utils'
import { getGatherableColor, getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { CREATURES } from './creatures'
import { ParsedLootTable } from './parse-loottable'
import { parseSizeVariant } from './parse-size-variant'

export function describeLoggingFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (gatherable.Tradeskill !== 'Logging' || eqCaseInsensitive(lootTable.original, 'Empty')) {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const result: FilterGroup = {
    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: svgAxe,

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',

    properties: {
      color: getGatherableColor(gatherable),
      icon: null,
      label: null,
      size: 1,

      lootTable: lootTable.original,
      // tooltip: name,
    },
  }

  const size = parseSizeVariant(lootTable)
  if (size) {
    result.category = lootTable.tokenized.filter((it) => it !== size.size).join(' ')
    result.categoryLabel = lootTable.tokenized
      .filter((it) => it !== size.size && it !== 'Vein' && it !== 'Finish')
      .join(' ')
    result.properties.size = size.scale
    result.variantID = size.size
    result.variantLabel = size.label
  }

  const creature = CREATURES.find((it) => lootTable.tokenized.includes(it))
  if (creature) {
    result.category = 'Creature'
    result.categoryLabel = 'Creature'
    result.categoryIcon = null
    result.subcategory = creature
    result.subcategoryLabel = creature
    result.subcategoryIcon = null
  }

  return result
}
