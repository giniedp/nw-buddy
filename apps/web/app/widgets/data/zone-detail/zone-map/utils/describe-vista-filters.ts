import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgImage } from '~/ui/icons/svg'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

export function describeVistaFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  const section = 'Vista'
  const sectionLabel = 'Vista'
  const sectionIcon = svgImage
  const properties: FilterGroup['properties'] = {
    color: null,
    icon: null,
    label: null,
    size: 1,
    lootTableID: lootTable.original,
    title: variant?.Name || gatherable.DisplayName,
    gatherableID: gatherable.GatherableID,
    variationID: variant?.VariantID,
  }

  {
    const match = gatherable.GatherableID.match(/(ExploreVista)_(.+)/i)
    if (match) {
      return {
        section,
        sectionLabel,
        sectionIcon,
        category: match[1],
        categoryLabel: variant?.Name || gatherable.DisplayName,
        categoryIcon: null,
        subcategory: null,
        subcategoryLabel: null,
        icons: false,
        properties: {
          ...properties,
        },
      }
    }
  }

  {
    const match = gatherable.GatherableID.match(/.+_(WolcottsEasel|VistaPoint).+/i)
    if (match) {
      return {
        section,
        sectionLabel,
        sectionIcon,
        category: match[1],
        categoryLabel: variant?.Name || gatherable.DisplayName,
        categoryIcon: null,
        subcategory: null,
        subcategoryLabel: null,
        icons: false,
        properties: {
          ...properties,
        },
      }
    }
  }

  return null
}
