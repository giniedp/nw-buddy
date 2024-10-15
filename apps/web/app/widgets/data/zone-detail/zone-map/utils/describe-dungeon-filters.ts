import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgDungeon } from '~/ui/icons/svg'
import { humanize } from '~/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

export function describeDungeonFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  if (lootTable.tokenized[0] !== 'Dungeon') {
    return null
  }
  const match = lootTable.normalized.match(
    /^(Dungeon)(CutlassKeys00|Edengrove|Everfall00|RestlessShores01|ShatterMtn00)(.*)/i,
  )
  if (!match) {
    return null
  }

  const result: FilterGroup = {
    section: lootTable.tokenized[0],
    sectionLabel: lootTable.tokenized[0],
    sectionIcon: svgDungeon,

    category: match[2],
    categoryLabel: humanize(match[2]),

    subcategory: match[3],
    subcategoryLabel: humanize(match[3]),
    properties: {
      color: null,
      icon: null,
      label: null,
      size: 1,

      title: variant?.Name || gatherable.DisplayName,
      lootTableID: lootTable.original,
      gatherableID: gatherable.GatherableID,
      variationID: variant?.VariantID,
    },
  }

  return result
}
