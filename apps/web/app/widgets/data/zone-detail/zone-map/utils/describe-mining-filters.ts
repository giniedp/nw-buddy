import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { eqCaseInsensitive, humanize } from '~/utils'
import { getGatherableIcon, getTradeskillIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { CREATURES } from './creatures'
import { ParsedLootTable } from './parse-loottable'
import { parseSizeVariant } from './parse-size-variant'
import { svgPickaxe } from '~/ui/icons/svg'

export function describeMiningFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Mining' || eqCaseInsensitive(lootTable.original, 'Empty')) {
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

    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: svgPickaxe,

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',
  }

  const size = parseSizeVariant(lootTable)
  if (size) {
    props.category = lootTable.tokenized.filter((it) => it !== size.size).join(' ')
    props.categoryLabel = lootTable.tokenized
      .filter((it) => it !== size.size && it !== 'Vein' && it !== 'Finish')
      .join(' ')
    props.size = size.scale
    props.variant = {
      id: size.size,
      label: size.label,
      lootTable: lootTable.original,
      name: variant?.Name || gatherable.DisplayName,
    }
  }

  const creature = CREATURES.find((it) => lootTable.tokenized.includes(it))
  if (creature) {
    props.category = 'Creature'
    props.categoryLabel = 'Creature'
    props.categoryIcon = null
    props.subcategory = creature
    props.subcategoryLabel = creature
    props.subcategoryIcon = null
  }

  return props
}
