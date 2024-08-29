import { GatherableVariation, NW_FALLBACK_ICON } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterDataPropertiesWithVariant } from '../data/types'
import { ParsedLootTable } from './parse-loottable'

export function describeAlchemyFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterDataPropertiesWithVariant {
  const defaults = {
    icon: NW_FALLBACK_ICON,
    name: variant?.Name || gatherable.DisplayName,
    color: null,
    section: 'Alchemy',
    sectionLabel: 'campalchemy_groupname',
    sectionIcon: NW_FALLBACK_ICON,
    lootTable: lootTable.original,
    loreID: null,
  }

  {
    const match = lootTable.normalized.match(/(Air|Death|Earth|Fire|Life|Soul|Water)(_)?(Boid|Plant|Stone)/)
    if (match) {
      return {
        ...defaults,
        category: `Motes${match[1]}`,
        categoryLabel: `${match[1]} Motes`,
        categoryIcon: null,
        subcategory: '',
        variant: {
          id: match[3],
          label: match[3],
          icon: getGatherableIcon(gatherable),
          lootTable: lootTable.original,
          name: variant?.Name || gatherable.DisplayName,
        },
      }
    }
  }

  if (lootTable.normalized === 'AzothWaterSpring') {
    return {
      ...defaults,
      category: lootTable.original,
      categoryLabel: gatherable.DisplayName,
      categoryIcon: null,
      subcategory: lootTable.original,
      subcategoryLabel: gatherable.DisplayName,
      variant: null,
    }
  }

  if (lootTable.normalized.startsWith('PigmentPlant')) {
    return {
      ...defaults,
      category: 'Fungus',
      categoryLabel: 'Fungi',
      categoryIcon: null,
      subcategory: lootTable.original,
      subcategoryLabel: variant?.Name || gatherable.DisplayName || lootTable.tokenized.filter((it) => it !== 'Plant').join(' '),
      variant: null,
    }
  }
  return null
}
