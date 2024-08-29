import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import tinycolor from 'tinycolor2'
import { eqCaseInsensitive, humanize } from '~/utils'
import { getGatherableIcon, getTradeskillIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { ParsedLootTable } from './parse-loottable'
import { parseSizeVariant } from './parse-size-variant'

export function describeHarvestingFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (gatherable.Tradeskill !== 'Harvesting' || eqCaseInsensitive(lootTable.original, 'Empty')) {
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
    sectionIcon: getTradeskillIcon(gatherable.Tradeskill),

    category: lootTable.original,
    categoryLabel: gatherable.DisplayName || humanize(lootTable.original),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: '',
    subcategoryLabel: '',
  }

  if (lootTable.normalized.endsWith('SporePod')) {
    props.category = 'SporePod'
    props.categoryLabel = 'Spore Pod'
    props.subcategory = lootTable.normalized.replace('SporePod', '')
    props.subcategoryLabel = humanize(props.subcategory)
    props.variant = null
    return props
  }

  if (lootTable.normalized.startsWith('PigmentPlant')) {
    props.category = 'Fungus'
    props.categoryLabel = 'Fungus'
    props.subcategory = lootTable.original //
    props.subcategoryLabel =
      variant?.Name || gatherable.DisplayName || lootTable.tokenized.filter((it) => it !== 'Plant').join(' ')
    props.variant = null
    return props
  }

  if (lootTable.normalized.startsWith('DyePlant')) {
    props.category = 'Dye'
    props.categoryLabel = 'Dye'
    props.subcategory = lootTable.original //
    props.subcategoryLabel =
      variant?.Name || gatherable.DisplayName || lootTable.tokenized.filter((it) => it !== 'Plant').join(' ')
    props.variant = null
    const colorName = lootTable.tokenized.filter((it) => it !== 'Plant' && it !== 'Dye').join('')
    const colors = {
      DesertRose: '#FFC0CB',
      DarkPurple: '#800080',
    }
    const tc = tinycolor(colorName)
    if (tc.isValid()) {
      props.color = tc.toHexString()
    } else if (colors[colorName]) {
      props.color = colors[colorName]
    } else {
      console.warn('Invalid color', colorName)
    }
    return props
  }

  if (
    // lootTable.normalized.startsWith('BerryBush') ||
    // lootTable.normalized.startsWith('BlueberryBush') ||
    lootTable.tokenized.includes('Plant') && !lootTable.tokenized.includes('Briar')
  ) {
    props.category = 'Cooking'
    props.categoryLabel = 'Cooking'
    props.subcategory = lootTable.original //
    props.subcategoryLabel = variant?.Name || gatherable.DisplayName
    return props
  }

  const size = parseSizeVariant(lootTable)
  if (size) {
    props.category = lootTable.tokenized.filter((it) => it !== size.size).join(' ')
    props.categoryLabel = humanize(props.category)
    props.size = size.scale
    props.variant = {
      id: size.size,
      label: size.label,
      lootTable: lootTable.original,
      name: variant?.Name || gatherable.DisplayName,
    }
  }

  if (lootTable.tokenized.includes('Hemp') || lootTable.tokenized.includes('Herb')) {
    props.categoryLabel = variant?.Name || gatherable.DisplayName
  }

  return props
}
