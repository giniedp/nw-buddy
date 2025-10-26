import { lootDroppedBy } from '../../common/loot-item-sources'
import { itemSalvagesTo as itemSalvagesToFn } from '../../common/loot-item-salvage'
import { NwDataSheets } from '../nw-data-sheets'
import { getItemPerkBucketIds, getItemPerks } from '../../common/item'
import { isPerkCharm, isPerkGem, isPerkInfix } from '../../common/perks'
import { getPerkBucketPerkIDs, PerkBucket } from '../../common/perk-buckets'
import { MasterItemDefinitions, PerkData } from '../../generated/types'

export async function itemLootSources(db: NwDataSheets, itemId: string) {
  return await lootDroppedBy(db, itemId)
}

export async function itemSalvagesTo(db: NwDataSheets, itemId: string) {
  return await itemSalvagesToFn(db, itemId)
}

export async function itemPerkStatsAll(db: NwDataSheets) {
  const items = await db.itemsAll()
  const perksMap = await db.perksByIdMap()
  const bucketsMap = await db.perkBucketsByIdMap()
  return items.map((it) => getItemPerkStats(it, perksMap, bucketsMap))
}

function getItemPerkStats(
  item: MasterItemDefinitions,
  perksMap: Map<string, PerkData>,
  bucketsMap: Map<string, PerkBucket>,
) {
  const perks = getItemPerks(item, perksMap)
  const bucketIds = getItemPerkBucketIds(item)
  let canHaveInfix = false
  let canHaveGem = false
  let charmSlots = 0

  for (const perk of perks) {
    if (isPerkGem(perk)) {
      canHaveGem = true
      continue
    }
    if (isPerkCharm(perk)) {
      charmSlots += 1
      continue
    }
    if (isPerkInfix(perk)) {
      canHaveInfix = true
      continue
    }
  }
  for (const bucketId of bucketIds) {
    const bucket = bucketsMap.get(bucketId)
    let bucketIsCharm = false
    for (const perkId of getPerkBucketPerkIDs(bucket)) {
      const perk = perksMap.get(perkId)
      if (isPerkGem(perk)) {
        canHaveGem = true
        continue
      }
      if (isPerkCharm(perk)) {
        bucketIsCharm = true
        continue
      }
      if (isPerkInfix(perk)) {
        canHaveInfix = true
        continue
      }
    }
    if (bucketIsCharm) {
      charmSlots += 1
    }
  }
  return {
    itemId: item.ItemID,
    perks,
    bucketIds,
    canHaveInfix,
    canHaveGem,
    charmSlots,
  }
}
