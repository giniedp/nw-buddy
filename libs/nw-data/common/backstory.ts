import { BackstoryDefinition, HouseItems, MasterItemDefinitions, PerkData } from '../generated/types'
import { getItemMaxGearScore, getItemPerkBucketKeys, getItemPerkKeys, isMasterItem } from './item'
import { PerkBucket } from './perk-buckets'
import { isPerkInherent } from './perks'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'

export interface BackstoryItem {
  itemId: string
  quantity: number
  gearScore?: number
  perks?: string[]
}

export interface BackstoryItemInstance {
  itemId: string
  quantity: number
  gearScore: number
  perks: Record<string, string>
}

export function getBackstoryItems(record: BackstoryDefinition) {
  const result: BackstoryItem[] = []
  for (const token of record?.InventoryItem || []) {
    const item = decodeBackstoryItem(token)
    if (item) {
      result.push(item)
    }
  }
  return result
}

export function decodeBackstoryItem(encodedItem: string) {
  if (!encodedItem) {
    return null
  }
  const [itemStr, quantityStr] = encodedItem.split(':')
  const result: BackstoryItem = {
    itemId: null,
    quantity: Number(quantityStr) || 1,
  }
  itemStr.split('-').forEach((it, index) => {
    if (index === 0) {
      result.itemId = it
    } else if (it.match(/^\d+$/) && !result.gearScore) {
      result.gearScore = Number(it)
    } else {
      result.perks = result.perks || []
      result.perks.push(it)
    }
  })
  return result
}

export function buildBackstoryItemInstance(
  bsItem: BackstoryItem,
  {
    itemsMap,
    housingMap,
    perksMap,
    bucketsMap,
  }: {
    itemsMap: Map<string, MasterItemDefinitions>
    housingMap: Map<string, HouseItems>
    perksMap: Map<string, PerkData>
    bucketsMap: Map<string, PerkBucket>
  },
): BackstoryItemInstance {
  const item = itemsMap.get(bsItem.itemId) || housingMap.get(bsItem.itemId)
  return {
    itemId: bsItem.itemId,
    quantity: bsItem.quantity,
    gearScore: bsItem.gearScore || (isMasterItem(item) ? getItemMaxGearScore(item) : null),
    perks: isMasterItem(item)
      ? buildBackstoryItemPerkOverrides({
          item,
          perkIds: bsItem.perks || [],
          perksMap,
          bucketsMap,
        })
      : null,
  }
}

export function buildBackstoryItemPerkOverrides({
  item,
  perkIds,
  perksMap,
  bucketsMap,
}: {
  item: MasterItemDefinitions
  perkIds: string[]
  perksMap: Map<string, PerkData>
  bucketsMap: Map<string, PerkBucket>
}) {
  const perkKeys = getItemPerkKeys(item)
  const bucketKeys = getItemPerkBucketKeys(item)
  const result: Record<string, string> = {}
  if (perkIds.length === bucketKeys.length) {
    for (let i = 0; i < perkIds.length; i++) {
      result[bucketKeys[i]] = perkIds[i]
    }
    return result
  }
  perkLoop: for (const perkId of perkIds) {
    const perk = perksMap.get(perkId)
    if (!perk) {
      console.warn('Missing perk', perkId)
      continue
    }
    for (const key of bucketKeys) {
      if (key in result) {
        continue
      }
      if (isPerkInherent(perk) && String(item[key]).includes('_Stat_')) {
        result[key] = perkId
        break perkLoop
      }
      const itemBucket = bucketsMap.get(item[key])
      if (!itemBucket) {
        console.warn('Missing perk bucket', item[key])
        continue
      }
      if (eqCaseInsensitive(perk.PerkType, itemBucket.PerkType)) {
        result[key] = perkId
        break perkLoop
      }
    }
    for (const key of perkKeys) {
      if (key in result) {
        continue
      }
      const itemPerk = perksMap.get(item[key])
      if (!itemPerk) {
        console.warn('Missing perk', item[key])
        continue
      }
      if (eqCaseInsensitive(perk.PerkType, itemPerk.PerkType)) {
        result[key] = perkId
        break perkLoop
      }
    }
    console.warn(`Perk ID not consumed`, perkId, {
      perkKeys,
      bucketKeys,
      perkIds,
    })
  }

  return result
}

function isBucketStat(bucketId: string) {}
