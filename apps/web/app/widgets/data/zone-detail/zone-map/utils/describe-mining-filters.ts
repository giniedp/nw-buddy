import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgPickaxe } from '~/ui/icons/svg'
import { eqCaseInsensitive, humanize } from '~/utils'
import { getGatherableColor, getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { CREATURES } from './creatures'
import { ParsedLootTable } from './parse-loottable'
import { parseSizeVariant } from './parse-size-variant'

export function describeMiningFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (gatherable.Tradeskill !== 'Mining' || eqCaseInsensitive(lootTable.original, 'Empty')) {
    return null
  }
  const type = MINERAL_TYPE_LOOKUP[lootTable.original]
  const data = MINERALS[type]
  const subType = getSubType(lootTable)

  const result: FilterGroup = {
    section: gatherable.Tradeskill,
    sectionLabel: 'ui_mining',
    sectionIcon: svgPickaxe,

    category: data?.itemID ?? lootTable.original,
    categoryLabel: data?.name ?? humanize(lootTable.original),
    categoryIcon: data?.icon ?? getGatherableIcon(gatherable),

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

type MineralType =
  | 'Flint'
  | 'Boulder'
  | 'Brimstone'
  | 'Lodestone'
  | 'Ore'
  | 'StarmetalOre'
  | 'MythrilOre'
  | 'OrichalcumOre'
  | 'Sandstone'
  | 'SeepingStone'
  | 'Gold'
  | 'Silver'
  | 'Platinum'

interface MineralData {
  itemID: string
  name: string
  icon: string
  color: string
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

const MINERAL_TYPE_LOOKUP: Record<string, MineralType> = {
  BoulderFinishSmall: 'Boulder',
  BoulderFinishMedium: 'Boulder',
  BoulderFinishLarge: 'Boulder',

  BrimstoneFinishSmall: 'Brimstone',
  BrimstoneFinishMedium: 'Brimstone',
  BrimstoneFinishLarge: 'Brimstone',

  LodestoneFinishSmall: 'Lodestone',
  LodestoneFinishMedium: 'Lodestone',
  LodestoneFinishLarge: 'Lodestone',

  SandstoneFinishSmall: 'Sandstone',
  SandstoneFinishMedium: 'Sandstone',
  SandstoneFinishLarge: 'Sandstone',

  Cursed10ws_LodestoneFinishSmall: 'Lodestone',
  Cursed10ws_LodestoneFinishMedium: 'Lodestone',
  Cursed10ws_LodestoneFinishLarge: 'Lodestone',

  Flint_Small: 'Flint',
  Flint_Medium: 'Flint',
  Flint_Large: 'Flint',

  OreVeinFinishSmall: 'Ore',
  OreVeinFinishMedium: 'Ore',
  OreVeinFinishLarge: 'Ore',

  StarmetalOreVeinFinishSmall: 'StarmetalOre',
  StarmetalOreVeinFinishMedium: 'StarmetalOre',
  StarmetalOreVeinFinishLarge: 'StarmetalOre',

  OutpostRush_OreVeinSmall: 'StarmetalOre',
  OutpostRush_OreVeinMedium: 'StarmetalOre',
  OutpostRush_OreVeinLarge: 'StarmetalOre',

  Cursed10ws_StarmetalOreVeinFinishSmall: 'StarmetalOre',
  Cursed10ws_StarmetalOreVeinFinishMedium: 'StarmetalOre',
  Cursed10ws_StarmetalOreVeinFinishLarge: 'StarmetalOre',

  OrichalcumOreVeinFinishSmall: 'OrichalcumOre',
  OrichalcumOreVeinFinishMedium: 'OrichalcumOre',
  OrichalcumOreVeinFinishLarge: 'OrichalcumOre',

  Cursed10ws_OrichalcumOreVeinFinishSmall: 'OrichalcumOre',
  Cursed10ws_OrichalcumOreVeinFinishMedium: 'OrichalcumOre',
  Cursed10ws_OrichalcumOreVeinFinishLarge: 'OrichalcumOre',

  MythrilOreVeinFinishSmall: 'MythrilOre',
  MythrilOreVeinFinishMedium: 'MythrilOre',
  MythrilOreVeinFinishLarge: 'MythrilOre',

  Cursed10ws_MythrilOreVeinFinishSmall: 'MythrilOre',
  Cursed10ws_MythrilOreVeinFinishMedium: 'MythrilOre',
  Cursed10ws_MythrilOreVeinFinishLarge: 'MythrilOre',

  Gold_Small: 'Gold',
  Gold_Medium: 'Gold',
  Gold_Large: 'Gold',

  Cursed10ws_Gold_Small: 'Gold',
  Cursed10ws_Gold_Medium: 'Gold',
  Cursed10ws_Gold_Large: 'Gold',

  Silver_Small: 'Silver',
  Silver_Medium: 'Silver',
  Silver_Large: 'Silver',

  Cursed10ws_Silver_Small: 'Silver',
  Cursed10ws_Silver_Medium: 'Silver',
  Cursed10ws_Silver_Large: 'Silver',

  Platinum_Small: 'Platinum',
  Platinum_Medium: 'Platinum',
  Platinum_Large: 'Platinum',

  Cursed10ws_Platinum_Small: 'Platinum',
  Cursed10ws_Platinum_Medium: 'Platinum',
  Cursed10ws_Platinum_Large: 'Platinum',

  SeepingStoneSmall: 'SeepingStone',
  SeepingStoneMedium: 'SeepingStone',
  SeepingStoneLarge: 'SeepingStone',
}

const MINERALS: Record<MineralType, MineralData> = {
  Flint: {
    itemID: 'flintt1',
    name: 'flintt1_mastername',
    color: '#3c3c3a',
    icon: 'assets/icons/gatherables/flintt1.png',
  },
  Boulder: {
    itemID: 'stonet1',
    name: 'stonet1_mastername',
    color: '#3c3c3a',
    icon: null,
  },
  Lodestone: {
    itemID: 'stonet4',
    name: 'stonet4_mastername',
    color: '#433a31',
    icon: 'assets/icons/gatherables/lodestone_compass.png',
  },
  Brimstone: {
    itemID: 'sulfurchunk',
    name: 'sulfurt1_mastername',
    color: '#CFC797 ',
    icon: 'assets/icons/gatherables/brimstone_compass.png',
  },
  Ore: {
    itemID: 'oret1',
    name: 'oret1_mastername',
    color: '#8F887B',
    icon: 'assets/icons/gatherables/iron_compass.png',
  },
  StarmetalOre: {
    itemID: 'oret4',
    name: 'oret4_mastername',
    color: '#5FB9EA',
    icon: 'assets/icons/gatherables/starmetal_compass.png',
  },
  OrichalcumOre: {
    itemID: 'oret5',
    name: 'oret5_mastername',
    color: '#BB8E85',
    icon: 'assets/icons/gatherables/orichalcum_compass.png',
  },
  MythrilOre: {
    itemID: 'oret52',
    name: 'oret52_mastername',
    color: '#AC7BB8',
    icon: 'assets/icons/gatherables/mythril_compass.png',
  },
  Sandstone: {
    itemID: 'sandstone',
    name: 'sandstone_mastername',
    color: '#C19245 ',
    icon: 'assets/icons/gatherables/sandstone_compass.png',
  },
  SeepingStone: {
    itemID: 'oilt1',
    name: 'oilt1_mastername',
    color: '#000000',
    icon: 'assets/icons/gatherables/oil_compass.png',
  },
  Silver: {
    itemID: 'oreprecioust1',
    name: 'oreprecioust1_mastername',
    color: '#B7B9B4',
    icon: 'assets/icons/gatherables/silver_compass.png',
  },
  Gold: {
    itemID: 'oreprecioust2',
    name: 'oreprecioust2_mastername',
    color: '#C0AA6E',
    icon: 'assets/icons/gatherables/gold_compass.png',
  },
  Platinum: {
    itemID: 'oreprecioust3',
    name: 'oreprecioust3_mastername',
    color: '#92AEB7',
    icon: 'assets/icons/gatherables/platinum_compass.png',
  },
}
