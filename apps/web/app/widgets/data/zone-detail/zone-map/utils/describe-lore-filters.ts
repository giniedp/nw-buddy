import { NW_FALLBACK_ICON } from '@nw-data/common'
import { LoreData } from '@nw-data/generated'
import { FilterGroup } from '../data/types'

export function describeLoreFilters(lore: LoreData, topic: LoreData, chapter: LoreData): FilterGroup {
  const result: FilterGroup = {
    section: 'Lore',
    sectionLabel: 'Lore Notes',
    sectionIcon: NW_FALLBACK_ICON,

    category: lore.LoreID,
    categoryLabel: lore.LoreID,

    subcategory: '',
    subcategoryLabel: '',

    properties: {
      color: null,
      icon: null,
      label: null,
      size: 1,

      loreID: lore.LoreID,
      title: lore.Title,
    },
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
