import { LootTablesData } from '@nw-data/generated'
import { parseLootRef } from './loot'
import { OmitByPrefix } from './utils/ts-types'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'

export type LootTableBase = OmitByPrefix<LootTablesData, 'Item' | 'GearScoreRange'>
export interface LootTable extends LootTableBase {
  $source: string
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

export function convertLoottables(data: LootTablesData[]): LootTable[] {

  const result = data
    .filter((it) => !it.LootTableID.endsWith('_Qty') && !it.LootTableID.endsWith('_Probs'))
    .map((it): LootTablesData => JSON.parse(JSON.stringify(it)))
    .map((it): LootTable => {
      const source = it['$source']
      const qty = findById(data, `${it.LootTableID}_Qty`)
      const probs = findById(data, `${it.LootTableID}_Probs`)
      const limitIds = it.Conditions?.map(parseLootRef)
        ?.filter((it) => it?.prefix === 'LIM')
        ?.map((it) => it.name)
      if (limitIds?.length > 1) {
        console.warn('Multiple limits', limitIds, it)
      }
      return {
        ...it,
        $source: source,
        MaxRoll: probs.MaxRoll,
        Items: extractItemKeys(it).map((key): LootTableRow => {
          const id = String(it[key] || '')
          const idRef = parseLootRef(id)
          const bucketID = idRef?.prefix === 'LBID' ? idRef.name : null
          const tableID = idRef?.prefix === 'LTID' ? idRef.name : null
          const limitID = idRef?.prefix === 'LIM' ? idRef.name : null
          const itemID = bucketID || tableID ? null : id
          return {
            ItemID: itemID,
            LootBucketID: bucketID,
            LootTableID: tableID,
            LootLimitID: limitID || limitIds?.[0],
            GearScoreRange: probs[key.replace('Item', 'GearScoreRange')],
            Qty: qty?.[key],
            Prob: probs?.[key],
          }
        }),
      }
    })
  return result
}

function findById(items: LootTablesData[], id: string) {
  return items.find((qty) => eqCaseInsensitive(qty.LootTableID, id))
}

function extractItemKeys(item: LootTablesData) {
  return Object.keys(item || {}).filter((it) => it.match(/^Item\d+$/i))
}
