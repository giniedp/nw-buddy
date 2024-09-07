import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import tinycolor from 'tinycolor2'
import { svgSickle } from '~/ui/icons/svg'
import { eqCaseInsensitive, humanize } from '~/utils'
import { getGatherableColor, getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'
import { parseSizeVariant } from './parse-size-variant'

const COLORS = {
  Hemp: '#9f74b9'
}
export function describeHarvestingFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (gatherable.Tradeskill !== 'Harvesting' || eqCaseInsensitive(lootTable.original, 'Empty')) {
    return null
  }
  const name = variant?.Name || gatherable.DisplayName || ''
  const icon = getGatherableIcon(gatherable)
  const result: FilterGroup = {
    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: svgSickle,

    category: lootTable.original,
    categoryLabel: gatherable.DisplayName || humanize(lootTable.original),
    categoryIcon: icon,

    subcategory: '',
    subcategoryLabel: '',

    icons: !!icon,
    properties: {
      color: getGatherableColor(gatherable),
      icon: null,
      label: null,
      size: 1,

      lootTable: lootTable.original,
      // tooltip: name,
    },
  }

  if (lootTable.normalized.endsWith('SporePod')) {
    result.category = 'SporePod'
    result.categoryLabel = 'Spore Pod'
    result.subcategory = lootTable.normalized.replace('SporePod', '')
    result.subcategoryLabel = humanize(result.subcategory)

    return result
  }

  if (lootTable.normalized.startsWith('PigmentPlant')) {
    result.category = 'Fungus'
    result.categoryLabel = 'Fungus'
    result.subcategory = lootTable.original //
    result.subcategoryLabel =
      variant?.Name || gatherable.DisplayName || lootTable.tokenized.filter((it) => it !== 'Plant').join(' ')

    return result
  }

  if (lootTable.normalized.startsWith('DyePlant')) {
    result.category = 'Dye'
    result.categoryLabel = 'Dye'
    result.subcategory = lootTable.original //
    result.subcategoryLabel =
      variant?.Name || gatherable.DisplayName || lootTable.tokenized.filter((it) => it !== 'Plant').join(' ')

    const colorName = lootTable.tokenized.filter((it) => it !== 'Plant' && it !== 'Dye').join('')
    const colors = {
      DesertRose: '#FFC0CB',
      DarkPurple: '#800080',
    }
    const tc = tinycolor(colorName)
    if (tc.isValid()) {
      result.properties.color = tc.toHexString()
    } else if (colors[colorName]) {
      result.properties.color = colors[colorName]
    } else {
      console.warn('Invalid color', colorName)
    }
    return result
  }

  if (
    // lootTable.normalized.startsWith('BerryBush') ||
    // lootTable.normalized.startsWith('BlueberryBush') ||
    lootTable.tokenized.includes('Plant') &&
    !lootTable.tokenized.includes('Briar')
  ) {
    result.category = 'Cooking'
    result.categoryLabel = 'Cooking'
    result.subcategory = lootTable.original //
    result.subcategoryLabel = variant?.Name || gatherable.DisplayName
    return result
  }

  const size = parseSizeVariant(lootTable)
  if (size) {
    result.category = lootTable.tokenized.filter((it) => it !== size.size).join(' ')
    result.categoryLabel = humanize(result.category)
    result.properties.size = size.scale
    result.variantID = size.size
    result.variantLabel = size.label
  }

  if (lootTable.tokenized.includes('Hemp') || lootTable.tokenized.includes('Herb')) {
    result.categoryLabel = variant?.Name || gatherable.DisplayName
  }

  return result
}
