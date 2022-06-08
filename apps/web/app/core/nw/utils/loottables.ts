import { Loottable } from '@nw-data/types'

export interface LoottableEntry {
  'AND/OR'?: string
  Conditions?: string
  GSBonus?: number
  HWMMult?: number
  LootTableID: string
  LuckSafe?: string
  MaxRoll: number
  PerkBucketOverrides1?: string
  PerkBucketOverrides2?: string
  PerkOverrides3?: string
  UseLevelGS?: string
  Items: LottableItem[]
}

export interface LottableItem {
  ItemID?: string
  LootBucketID?: string
  Qty?: string
  Prob?: string
  GearScoreRange?: string
}

export function convertLoottables(data: Loottable[]) {
  data
    .filter((it) => !it.LootTableID.endsWith('_Qty') && !it.LootTableID.endsWith('_Probs'))
    .map((it): LoottableEntry => {
      const qty = findById(data, `${it.LootTableID}_Qty`)
      const probs = findById(data, `${it.LootTableID}_Probs`)
      return {
        ...it,
        MaxRoll: probs.MaxRoll,
        Items: extractItemKeys(it).map((key): LottableItem => {
          const id = String(it[key] || '')
          const bucketID = id.startsWith('[LBID]') ? id.replace('[LBID]', '') : null
          const itemID = bucketID ? null : id
          return {
            ItemID: itemID,
            LootBucketID: bucketID,
            GearScoreRange: probs[key.replace('Item', 'GearScoreRange')],
            Qty: qty?.[key],
            Prob: probs?.[key],
          }
        }),
      }
    })
}

function findById(items: Loottable[], id: string) {
  return items.find((qty) => qty.LootTableID === id)
}

function extractItemKeys(item: Loottable) {
  return Object.keys(item || {}).filter((it) => it.match(/^Item\d+$/i))
}
