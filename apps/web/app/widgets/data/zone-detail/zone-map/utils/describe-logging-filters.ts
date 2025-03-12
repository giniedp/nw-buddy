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
  const type = LOGGING_TYPE_LOOKUP[lootTable.original]
  const data = LOGGING_DATA[type]
  const subType = getSubType(lootTable)

  const result: FilterGroup = {
    section: gatherable.Tradeskill,
    sectionLabel: gatherable.Tradeskill,
    sectionIcon: svgAxe,

    category: lootTable.original,
    categoryLabel: humanize(lootTable.original),
    categoryIcon: getGatherableIcon(gatherable),

    subcategory: subType || '',
    subcategoryLabel: data?.name ?? humanize(lootTable.original),
    subcategoryAffix: subType,

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

  const size = parseSizeVariant(lootTable)
  if (size && data) {
    result.category = data.itemID
    result.categoryLabel = data.name
    result.subcategoryLabel = result.categoryLabel
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

function getSubType(lootTable: ParsedLootTable) {
  if (lootTable.tokenized[0] === 'Cursed10ws') {
    return 'ui_afflicted_mutcurse4'
  }
  if (lootTable.tokenized[0] === 'Outpost') {
    return 'vc_outpostrush'
  }
  return ''
}

type LoggingType = 'Banana' | 'Cactus' | 'Mycodendra' | 'Ironwood' | 'Runewood' | 'Wyrdwood' | 'Tree'

interface LoggingData {
  itemID: string
  name: string
  icon: string
  color: string
}

const LOGGING_TYPE_LOOKUP: Record<string, LoggingType> = {
  BananaTreeTiny: 'Banana',
  BananaTreeSmall: 'Banana',
  BananaTreeMedium: 'Banana',

  CactusTiny: 'Cactus',
  CactusSmall: 'Cactus',
  CactusMedium: 'Cactus',
  CactusLarge: 'Cactus',

  TreeTiny: 'Tree',
  TreeSmall: 'Tree',
  TreeMedium: 'Tree',
  TreeLarge: 'Tree',
  TreeHuge: 'Tree',

  MycodendraMedium: 'Mycodendra',
  MycodendraLarge: 'Mycodendra',
  MycodendraHuge: 'Mycodendra',

  IronwoodTreeTiny: 'Ironwood',
  IronwoodTreeSmall: 'Ironwood',
  IronwoodTreeMedium: 'Ironwood',
  IronwoodTreeLarge: 'Ironwood',
  IronwoodTreeHuge: 'Ironwood',

  Cursed10ws_IronwoodTreeTiny: 'Ironwood',
  Cursed10ws_IronwoodTreeSmall: 'Ironwood',
  Cursed10ws_IronwoodTreeMedium: 'Ironwood',
  Cursed10ws_IronwoodTreeLarge: 'Ironwood',
  Cursed10ws_IronwoodTreeHuge: 'Ironwood',

  OutpostRush_TreeTiny: 'Ironwood',
  OutpostRush_TreeSmall: 'Ironwood',
  OutpostRush_TreeMedium: 'Ironwood',
  OutpostRush_TreeLarge: 'Ironwood',
  OutpostRush_TreeHuge: 'Ironwood',

  RunewoodTreeTiny: 'Runewood',
  RunewoodTreeSmall: 'Runewood',
  RunewoodTreeMedium: 'Runewood',
  RunewoodTreeLarge: 'Runewood',
  RunewoodTreeHuge: 'Runewood',

  Cursed10ws_RunewoodTreeTiny: 'Runewood',
  Cursed10ws_RunewoodTreeSmall: 'Runewood',
  Cursed10ws_RunewoodTreeMedium: 'Runewood',
  Cursed10ws_RunewoodTreeLarge: 'Runewood',
  Cursed10ws_RunewoodTreeHuge: 'Runewood',

  WyrdwoodTreeTiny: 'Wyrdwood',
  WyrdwoodTreeSmall: 'Wyrdwood',
  WyrdwoodTreeMedium: 'Wyrdwood',
  WyrdwoodTreeLarge: 'Wyrdwood',
  WyrdwoodTreeHuge: 'Wyrdwood',

  Cursed10ws_WyrdwoodTreeTiny: 'Wyrdwood',
  Cursed10ws_WyrdwoodTreeSmall: 'Wyrdwood',
  Cursed10ws_WyrdwoodTreeMedium: 'Wyrdwood',
  Cursed10ws_WyrdwoodTreeLarge: 'Wyrdwood',
  Cursed10ws_WyrdwoodTreeHuge: 'Wyrdwood',
}

const LOGGING_DATA: Record<LoggingType, LoggingData> = {
  Banana: {
    itemID: 'bananat1',
    name: 'bananat1_mastername',
    icon: null,
    color: '#D0B74E',
  },
  Cactus: {
    itemID: 'cactusflesht1',
    name: 'cactusflesht1_mastername',
    icon: null,
    color: '#677D3A',
  },
  Mycodendra: {
    itemID: 'mycodendraflesht1',
    name: 'mycodendraflesht1_mastername',
    icon: null,
    color: '#F0D7C2',
  },
  Ironwood: {
    itemID: 'woodt5',
    name: 'woodt5_mastername',
    icon: 'assets/icons/gatherables/ironwood_compass.png',
    color: '#66594F',
  },
  Runewood: {
    itemID: 'woodt52',
    name: 'woodt52_mastername',
    icon: 'assets/icons/gatherables/runewood_compass.png',
    color: '#4C21AB',
  },
  Wyrdwood: {
    itemID: 'woodt4',
    name: 'woodt4_mastername',
    icon: 'assets/icons/gatherables/wyrdwood_compass.png',
    color: '#87AB9A',
  },
  Tree: {
    itemID: 'woodt2',
    name: 'wood_categoryname',
    icon: null,
    color: '#695240',
  },
}
