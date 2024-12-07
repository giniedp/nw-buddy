import { getItemPerkBucketIds, getItemPerks } from '@nw-data/common'
import { AffixStatData, HouseItems, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { NwDataSheets } from '../nw-data-sheets'
import { promiseMap } from '../promise-map'

export type ItemTableRecord = MasterItemDefinitions & {
  $source?: string
  $perks?: PerkData[]
  $affixes?: AffixStatData[]
  $perkBuckets?: string[]
  $transformTo?: MasterItemDefinitions | HouseItems
  $transformFrom?: Array<MasterItemDefinitions | HouseItems>
}

export async function loadItemsTable(db: NwDataSheets) {
  return promiseMap({
    items: db.itemsAll(),
    itemsMap: db.itemsByIdMap(),
    housingMap: db.housingItemsByIdMap(),
    perksMap: db.perksByIdMap(),
    affixMap: db.affixStatsByIdMap(),
    transformsMap: db.itemTransformsByIdMap(),
    transformsMapReverse: db.itemTransformsByToItemIdMap(),
  }).then(({ items, itemsMap, housingMap, perksMap, affixMap, transformsMap, transformsMapReverse }) => {
    function getItem(id: string) {
      if (!id) {
        return null
      }
      return itemsMap.get(id) || housingMap.get(id) || ({ ItemID: id } as MasterItemDefinitions)
    }
    return items.map((it): ItemTableRecord => {
      const perks = getItemPerks(it, perksMap)
      return {
        ...it,
        $perks: perks,
        $affixes: perks.map((it) => affixMap.get(it?.Affix)).filter((it) => !!it),
        $perkBuckets: getItemPerkBucketIds(it),
        $transformTo: getItem(transformsMap.get(it.ItemID)?.ToItemId),
        $transformFrom: (transformsMapReverse.get(it.ItemID) || []).map((it) => getItem(it.FromItemId)),
      }
    })
  })
}
