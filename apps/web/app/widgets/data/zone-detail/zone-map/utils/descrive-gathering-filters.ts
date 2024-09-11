import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { getGatherableColor, getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'
import { parseSizeVariant } from './parse-size-variant'
import { svgSickle } from '~/ui/icons/svg'

export function describeGatheringFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  const type = GATHERING_TYPE_LOOKUP[lootTable.original]
  if (!type && !OTHER_GATHERABLES.includes(lootTable.original)) {
    return null
  }

  const data = HARVESTING_DATA[type]
  const subType = getSubType(lootTable)
  const name = data?.name || variant?.Name || gatherable.DisplayName || ''
  const icon = getGatherableIcon(gatherable)
  const result: FilterGroup = {
    section: 'Harvesting',
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

type GatheringType = 'Nuts' | 'Guano' | 'Honey'

interface GatheringData {
  itemID: string
  name: string
  icon: string
  color: string
}

const OTHER_GATHERABLES = [
  // 'LightningFields_Core_Throwable_Item',
  'SingleStone',
  'TurkeyNest',
  'Turkey_ChameleonNest',
  'Turkey_LizardEgg',
]
const GATHERING_TYPE_LOOKUP: Record<string, GatheringType> = {
  Nut_Small: 'Nuts',

  Guano_Small: 'Guano',
  Guano_Medium: 'Guano',
  Guano_Large: 'Guano',

  Honey_Small: 'Honey',
  Honey_Medium: 'Honey',
  Honey_Large: 'Honey',
}

const HARVESTING_DATA: Record<GatheringType, GatheringData> = {
  Nuts: {
    itemID: 'nutt1',
    name: 'nutt1_mastername',
    icon: null,
    color: null,
  },
  Guano: {
    itemID: 'saltpetert1',
    name: 'saltpetert1_mastername',
    icon: null,
    color: null,
  },
  Honey: {
    itemID: 'honeyt1',
    name: 'honeyt1_mastername',
    icon: null,
    color: null,
  },
}
