import { GatherableData } from "@nw-data/generated"
import { ParsedLootTable } from "./parse-loottable"
import { GatherableVariation } from "@nw-data/common"
import { FilterDataPropertiesWithVariant } from "../data/types"
import { getGatherableIcon, getTradeskillIcon } from "~/widgets/data/gatherable-detail/utils"
import { eqCaseInsensitive, humanize } from "~/utils"
import { parseSizeVariant } from "./parse-size-variant"
import { CREATURES } from "./creatures"

export function describeLoggingFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Logging' || eqCaseInsensitive(lootTable.original, 'Empty')) {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const props: FilterDataPropertiesWithVariant = {
    name,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

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
