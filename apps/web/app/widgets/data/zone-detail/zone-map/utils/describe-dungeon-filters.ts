import { GatherableVariation, NW_FALLBACK_ICON } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { humanize } from '~/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

export function describeDungeonFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  if (lootTable.tokenized[0] !== 'Dungeon') {
    return null
  }
  const match = lootTable.normalized.match(
    /^(Dungeon)(CutlassKeys00|Edengrove|Everfall00|RestlessShores01|ShatterMtn00)(.*)/i,
  )
  if (!match) {
    return null
  }

  const props: FilterDataPropertiesWithVariant = {
    name: gatherable.DisplayName,
    color: null,
    icon: null,
    variant: null,
    lootTable: lootTable.original,

    section: lootTable.tokenized[0],
    sectionLabel: lootTable.tokenized[0],
    sectionIcon: NW_FALLBACK_ICON,

    category: match[2],
    categoryLabel: humanize(match[2]),

    subcategory: match[3],
    subcategoryLabel: humanize(match[3]),
  }

  return props
}
