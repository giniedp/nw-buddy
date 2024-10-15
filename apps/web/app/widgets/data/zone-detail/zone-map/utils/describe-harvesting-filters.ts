import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import tinycolor from 'tinycolor2'
import { svgSickle } from '~/ui/icons/svg'
import { eqCaseInsensitive, humanize } from '~/utils'
import { getGatherableColor, getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'
import { parseSizeVariant } from './parse-size-variant'

export function describeHarvestingFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (gatherable.Tradeskill !== 'Harvesting' || eqCaseInsensitive(lootTable.original, 'Empty')) {
    return null
  }
  const type = HARVESTING_TYPE_LOOKUP[lootTable.original]
  const data = HARVESTING_DATA[type]
  const subType = getSubType(lootTable)
  const name = data?.name || variant?.Name || gatherable.DisplayName || ''
  const icon = getGatherableIcon(gatherable)
  const result: FilterGroup = {
    section: gatherable.Tradeskill,
    sectionLabel: 'ui_harvesting',
    sectionIcon: svgSickle,

    category: data?.itemID ?? lootTable.original,
    categoryLabel: name,
    categoryIcon: data?.icon ?? icon,

    subcategory: subType || '',
    subcategoryLabel: name,
    subcategoryAffix: subType,

    icons: !!icon,
    properties: {
      color: data?.color || getGatherableColor(gatherable),
      icon: null,
      label: null,
      size: 1,

      lootTableID: lootTable.original,
      gatherableID: gatherable.GatherableID,
      variationID: variant?.VariantID,
      title: variant?.Name || gatherable.DisplayName || '',
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

  if (lootTable.tokenized.includes('Plant') && !lootTable.tokenized.includes('Briar')) {
    result.category = 'Cooking'
    result.categoryLabel = 'Cooking'
    result.subcategory = lootTable.original //
    result.subcategoryLabel = variant?.Name || gatherable.DisplayName
    return result
  }

  const size = parseSizeVariant(lootTable)
  if (size && data) {
    result.category = data.itemID
    result.categoryLabel = data.name
    result.subcategoryLabel = result.categoryLabel
    result.properties.size = size.scale
    result.variantID = size.size
    result.variantLabel = size.label
  }

  return result
}

function getSubType(lootTable: ParsedLootTable) {
  if (lootTable.tokenized[0] === 'Cursed10ws') {
    return 'ui_afflicted_mutcurse4'
  }
  if (lootTable.tokenized[0] === 'Outpost') {
    return 'vc_outpostrush'
  }
  return ''
}

type HarvestingType =
  | 'Aloe'
  | 'Berry'
  | 'Blueberry'
  | 'Bush'
  | 'Bulrush'
  | 'Briar'
  | 'Cactus'
  | 'Hemp'
  | 'Herbs'
  | 'Silkweed'
  | 'Spinfiber'
  | 'Wirefiber'
  | 'Mycodendra'

interface HarvestingData {
  itemID: string
  name: string
  icon: string
  color: string
}

const HARVESTING_TYPE_LOOKUP: Record<string, HarvestingType> = {
  HempSmallT1: 'Hemp',
  HempMediumT1: 'Hemp',
  HempLargeT1: 'Hemp',

  HempSmallT4: 'Silkweed',
  HempMediumT4: 'Silkweed',
  HempLargeT4: 'Silkweed',
  Cursed10ws_HempSmallT4: 'Silkweed',
  Cursed10ws_HempMediumT4: 'Silkweed',
  Cursed10ws_HempLargeT4: 'Silkweed',

  HempSmallT5: 'Wirefiber',
  HempMediumT5: 'Wirefiber',
  HempLargeT5: 'Wirefiber',
  Cursed10ws_HempSmallT5: 'Wirefiber',
  Cursed10ws_HempMediumT5: 'Wirefiber',
  Cursed10ws_HempLargeT5: 'Wirefiber',

  HempSmallT52: 'Spinfiber',
  HempMediumT52: 'Spinfiber',
  HempLargeT52: 'Spinfiber',
  Cursed10ws_HempSmallT52: 'Spinfiber',
  Cursed10ws_HempMediumT52: 'Spinfiber',
  Cursed10ws_HempLargeT52: 'Spinfiber',

  Herb_Small: 'Herbs',
  Herb_Medium: 'Herbs',
  Herb_Large: 'Herbs',

  BerryBushSmall: 'Berry',
  BerryBushMedium: 'Berry',
  BerryBushLarge: 'Berry',

  BlueberryBushSmall: 'Blueberry',
  BlueberryBushMedium: 'Blueberry',
  BlueberryBushLarge: 'Blueberry',

  CactusTiny: 'Cactus',
  CactusSmall: 'Cactus',
  CactusMedium: 'Cactus',
  CactusLarge: 'Cactus',

  CactusSmallBush: 'Aloe',
  CactusMediumBush: 'Aloe',
  CactusLargeBush: 'Aloe',

  BushXSmall: 'Bush',
  BushSmall: 'Bush',
  BushMedium: 'Bush',
  BushLarge: 'Bush',
  BushHuge: 'Bush',
  WitheredBush: 'Bush',

  MycodendraSmallBush: 'Mycodendra',
  MycodendraMediumBush: 'Mycodendra',
  MycodendraLargeBush: 'Mycodendra',
  MycodendraHugeBush: 'Mycodendra',

  CatTailSmall: 'Bulrush',
  CatTailMedium: 'Bulrush',
  CatTailLarge: 'Bulrush',

  BriarPlant: 'Briar',
}

const HARVESTING_DATA: Record<HarvestingType, HarvestingData> = {
  Aloe: {
    itemID: 'aloegelt1',
    name: 'aloegelt1_mastername',
    icon: 'assets/icons/gatherables/aloe_compass.png',
    color: '#7E9D4E',
  },
  Berry: {
    itemID: 'berryt1',
    name: 'berryt1_mastername',
    icon: null,
    color: '#962421',
  },
  Blueberry: {
    itemID: 'blueberryt1',
    name: 'blueberryt1_mastername',
    icon: null,
    color: '#434F78',
  },
  Bush: {
    itemID: 'woodt1',
    name: 'ui_bush',
    icon: null,
    color: '#3c3c3a',
  },
  Bulrush: {
    itemID: 'bulrushcobt1',
    name: 'cattailsmall_displayname',
    icon: 'assets/icons/gatherables/bulrush_compass.png',
    color: '#4C4F32',
  },
  Briar: {
    itemID: 'briarbudst1',
    name: 'briarbudst1_mastername',
    icon: null,
    color: '#B0636A',
  },
  Cactus: {
    itemID: 'cactusflesht1',
    name: 'cactusflesht1_mastername',
    icon: 'assets/icons/gatherables/aloe_compass.png',
    color: '#677D3A',
  },
  Hemp: {
    itemID: 'hempt1',
    name: 'ui_hemp',
    icon: 'assets/icons/gatherables/hemp_compass.png',
    color: '#A374B9',
  },
  Herbs: {
    itemID: 'herbt1',
    name: 'herbt1_mastername',
    icon: 'assets/icons/gatherables/herb_compass.png',
    color: '#4D7C3E',
  },
  Silkweed: {
    itemID: 'hempt4',
    name: 'ui_hempt4',
    icon: 'assets/icons/gatherables/silkweed_compass.png',
    color: '#6E95C6',
  },
  Spinfiber: {
    itemID: 'hempt52',
    name: 'ui_hempt52',
    icon: 'assets/icons/gatherables/spinfiber_compass.png',
    color: '#6B6FD3',
  },
  Wirefiber: {
    itemID: 'hempt5',
    name: 'ui_hempt5',
    icon: 'assets/icons/gatherables/wirefiber_compass.png',
    color: '#CB7C6C',
  },
  Mycodendra: {
    itemID: 'mycodendraflesht1',
    name: 'mycodendraflesht1_mastername',
    icon: null,
    color: '#F0D7C2',
  },
}
