import { GatherableVariation, describeNodeSize, getGatherableNodeSize, getGatherableNodeSizes } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { svgFlaskRoundPotion } from '~/ui/icons/svg'
import { getGatherableIcon } from '~/widgets/data/gatherable-detail/utils'
import { FilterGroup } from '../data/types'
import { ParsedLootTable } from './parse-loottable'
import { stringToColor, stringToHSL } from '~/utils'

export function describeAlchemyFilters(
  lootTable: ParsedLootTable,
  gatherable: GatherableData,
  variant?: GatherableVariation,
): FilterGroup {
  const section = 'Alchemy'
  const sectionLabel = 'campalchemy_groupname'
  const sectionIcon = svgFlaskRoundPotion
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
    const match = lootTable.normalized.match(/(Air|Death|Earth|Fire|Life|Soul|Water)(_)?(Boid|Plant|Stone)/)
    if (match) {
      const index = ['plant', 'stone', 'boid'].indexOf(match[3].toLowerCase())
      const size = describeNodeSize(getGatherableNodeSizes()[index + 1])
      const color = MOTE_COLORS[match[1].toLowerCase()]
      return {
        section,
        sectionLabel,
        sectionIcon,
        category: `Motes${match[1]}`,
        categoryLabel: `${match[1]} Motes`,
        categoryIcon: null,
        subcategory: '',
        variantID: size.size,
        variantLabel: match[3],
        variantIcon: getGatherableIcon(gatherable),
        icons: false,
        properties: {
          ...properties,
          color: color, //stringToHSL(match[1]).toHexString(),
        },
      }
    }
  }

  if (lootTable.normalized === 'AzothWaterSpring') {
    return {
      section,
      sectionLabel,
      sectionIcon,
      category: lootTable.original,
      categoryLabel: gatherable.DisplayName,
      categoryIcon: null,
      subcategory: lootTable.original,
      subcategoryLabel: gatherable.DisplayName,
      properties: {
        ...properties,
        color: '#40A8C9',
      },
    }
  }

  if (lootTable.normalized.startsWith('PigmentPlant')) {
    return {
      section,
      sectionLabel,
      sectionIcon,
      category: 'Fungi',
      categoryLabel: 'icontypeunlock_pigment',
      categoryIcon: null,
      subcategory: lootTable.original,
      subcategoryLabel:
        variant?.Name || gatherable.DisplayName || lootTable.tokenized.filter((it) => it !== 'Plant').join(' '),
      properties: {
        ...properties,
      },
    }
  }
  return null
}

const MOTE_COLORS = {
  air: '#4683a5', // '#6F787D',
  death: '#a848a8', // '#7E727E',
  earth: '#417230', // '#496340',
  fire: '#bd8767', // '#A98D7C',
  life: '#e6de8b', // '#CAC7A8',
  soul: '#f0e7bc', // '#E2DECB',
  water: '#353378', // '#43426A',
}
