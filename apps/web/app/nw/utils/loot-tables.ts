import { Loottable } from '@nw-data/types'

// type WithoutPrefix<T> =
export interface LootTableEntry {
  "AND/OR"?:               string;
  ConditionOverridesRoll?: number | string;
  Conditions?:             string[];
  GSBonus?:                number;
  HWMMult?:                number;
  LootTableID:             string;
  MaxRoll:                 number;
  PerkBucketOverrides2?:   string;
  RollBonusSetting?:       string;
  TriggerLimitOnVisit?:    string;
  UseLevelGS?:             string;
  Items: LootTableRow[]
}

export interface LootTableRow {
  ItemID?: string
  LootBucketID?: string
  LootTableID?: string
  Qty?: string
  Prob?: string
  GearScoreRange?: string
}

export function convertLoottables(data: Loottable[]) {
  const result = data
    .filter((it) => !it.LootTableID.endsWith('_Qty') && !it.LootTableID.endsWith('_Probs'))
    .map((it): LootTableEntry => {
      const qty = findById(data, `${it.LootTableID}_Qty`)
      const probs = findById(data, `${it.LootTableID}_Probs`)

      return {
        ...it,
        Conditions: it.Conditions?.split(','),
        MaxRoll: probs.MaxRoll,
        Items: extractItemKeys(it).map((key): LootTableRow => {
          const id = String(it[key] || '')
          const bucketID = id.startsWith('[LBID]') ? id.replace('[LBID]', '') : null
          const tableID = id.startsWith('[LTID]') ? id.replace('[LTID]', '') : null
          const itemID = (bucketID || tableID) ? null : id
          return {
            ItemID: itemID,
            LootBucketID: bucketID,
            LootTableID: tableID,
            GearScoreRange: probs[key.replace('Item', 'GearScoreRange')],
            Qty: qty?.[key],
            Prob: probs?.[key],
          }
        }),
      }
    })
  return result
}

function findById(items: Loottable[], id: string) {
  return items.find((qty) => qty.LootTableID === id)
}

function extractItemKeys(item: Loottable) {
  return Object.keys(item || {}).filter((it) => it.match(/^Item\d+$/i))
}
