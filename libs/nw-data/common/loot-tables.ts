import { Loottable } from '@nw-data/generated'
import { OmitByPrefix } from './utils/ts-types'

export type LootTableBase = OmitByPrefix<Loottable, 'Item' | 'GearScoreRange'>
export interface LootTable extends LootTableBase {
  Items: LootTableRow[]
}

export interface LootTableRow {
  ItemID?: string
  LootBucketID?: string
  LootTableID?: string
  LootLimitID?: string
  Qty?: string
  Prob?: string
  GearScoreRange?: string
}

export function convertLoottables(data: Loottable[]): LootTable[] {
  const result = data
    .filter((it) => !it.LootTableID.endsWith('_Qty') && !it.LootTableID.endsWith('_Probs'))
    .map((it): Loottable => JSON.parse(JSON.stringify(it)))
    .map((it): LootTable => {
      const qty = findById(data, `${it.LootTableID}_Qty`)
      const probs = findById(data, `${it.LootTableID}_Probs`)

      return {
        ...it,
        MaxRoll: probs.MaxRoll,
        Items: extractItemKeys(it).map((key): LootTableRow => {
          const id = String(it[key] || '')
          const bucketID = id.startsWith('[LBID]') ? id.replace('[LBID]', '') : null
          const tableID = id.startsWith('[LTID]') ? id.replace('[LTID]', '') : null
          const limitID = id.startsWith('[LIM]') ? id.replace('[LIM]', '') : null
          const itemID = bucketID || tableID ? null : id
          return {
            ItemID: itemID,
            LootBucketID: bucketID,
            LootTableID: tableID,
            LootLimitID: limitID,
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
