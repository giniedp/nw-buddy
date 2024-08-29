import { NW_FALLBACK_ICON } from '@nw-data/common'
import { LoreData } from '@nw-data/generated'
import { FilterDataPropertiesWithVariant } from '../data/types'

export function describeLoreFilters(
  lore: LoreData,
  topic: LoreData,
  chapter: LoreData,
): FilterDataPropertiesWithVariant {
  const result: FilterDataPropertiesWithVariant = {
    name: lore.Title,
    color: null,
    icon: NW_FALLBACK_ICON,
    variant: null,
    lootTable: null,
    loreID: lore.LoreID,

    section: 'Lore',
    sectionLabel: 'Lore Notes',
    sectionIcon: NW_FALLBACK_ICON,

    category: lore.LoreID,
    categoryLabel: lore.LoreID,

    subcategory: '',
    subcategoryLabel: '',
  }

  if (topic) {
    result.section = topic.LoreID
    result.sectionLabel = topic.Title
  }
  if (chapter) {
    result.category = chapter.LoreID
    result.categoryLabel = chapter.Title

    result.subcategory = lore.LoreID
    result.subcategoryLabel = lore.Title
  }

  return result
}
