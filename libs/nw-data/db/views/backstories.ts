import { buildBackstoryItemInstance, getBackstoryItems } from '@nw-data/common'
import type { NwDataSheets } from '../nw-data-sheets'

export async function backstoriesItemsById(db: NwDataSheets, backstoryId: string) {
  const backstory = await db.backstoriesById(backstoryId)

  const itemsMap = await db.itemsByIdMap()
  const housingMap = await db.housingItemsByIdMap()
  const perksMap = await db.perksByIdMap()
  const bucketsMap = await db.perkBucketsByIdMap()
  return getBackstoryItems(backstory).map((it) => {
    const item = itemsMap.get(it.itemId) || housingMap.get(it.itemId)
    const instance = buildBackstoryItemInstance(it, {
      itemsMap,
      housingMap,
      perksMap,
      bucketsMap,
    })
    return {
      ...instance,
      item,
    }
  })
}
