import { PerkBucket, getItemPerkInfos, getItemRarity, getPerkTypeWeight } from '@nw-data/common'
import { AffixStatData, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { ItemInstanceRecord, ItemInstanceRow } from './types'
import { sortBy } from 'lodash'

export function buildItemInstanceRows(
  records: ItemInstanceRecord[],
  data: {
    items: Map<string, MasterItemDefinitions>
    perks: Map<string, PerkData>
    buckets: Map<string, PerkBucket>
    affixes: Map<string, AffixStatData>
  },
): ItemInstanceRow[] {
  if (!records || !data) {
    return null
  }
  return records.map((it) => buildItemInstanceRow(it, data))
}

export function buildItemInstanceRow(
  record: ItemInstanceRecord,
  data: {
    items: Map<string, MasterItemDefinitions>
    perks: Map<string, PerkData>
    buckets: Map<string, PerkBucket>
    affixes: Map<string, AffixStatData>
  },
): ItemInstanceRow {
  if (!record || !data) {
    return null
  }
  const { items, perks, buckets, affixes } = data
  const item = items.get(record.itemId)
  const perkInfos = getItemPerkInfos(item, record.perks)
  const itemPerks = perkInfos.map((it) => {
    const perk = perks.get(it.perkId)
    const affix = affixes.get(perk?.Affix)
    const bucket = buckets.get(it.bucketId)
    return {
      key: it.key,
      perk: perk,
      affix: affix,
      bucket: bucket,
      type: (perk || bucket)?.PerkType,
    }
  })
  return {
    record: record,
    item: item,
    perks: sortBy(itemPerks, (it) => getPerkTypeWeight(it.type)),
    rarity: getItemRarity(
      item,
      itemPerks.map((it) => it.perk?.PerkID).filter((it) => !!it),
    ),
  }
}
