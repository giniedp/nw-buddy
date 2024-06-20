import { BuffBucketData, BuffType } from '@nw-data/generated'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'

export type BuffBucketBase = Pick<BuffBucketData, 'BuffBucketId' | 'TableType' | 'MaxRoll'>
export interface BuffBucket extends BuffBucketBase {
  Buffs: BuffBucketRow[]
}

export interface BuffBucketRow {
  Buff?: string
  BuffType?: BuffType
  BuffPotency?: number
  BuffProb?: string
  BuffProbPotency?: number
}

export function convertBuffBuckets(data: BuffBucketData[]): BuffBucket[] {
  const result = data
    .filter((it) => !it.BuffBucketId.endsWith('_Probs'))
    .map((it): BuffBucketData => JSON.parse(JSON.stringify(it)))
    .map((it): BuffBucket => {
      const probs = findById(data, `${it.BuffBucketId}_Probs`)
      return {
        ...it,
        MaxRoll: probs?.MaxRoll,
        Buffs: extractItemKeys(it).map((key): BuffBucketRow => {
          const index = Number(key.replace('Buff', ''))
          const id = String(it[key] || '')
          return {
            Buff: String(it[key] || ''),
            BuffType: it[`BuffType${index}`],
            BuffPotency: it[`BuffPotency${index}`],
            BuffProb: probs[`Buff${index}`],
            BuffProbPotency: probs[`BuffPotency${index}`],
          }
        }),
      }
    })
  return result
}

function findById(items: BuffBucketData[], id: string) {
  return items.find((it) => eqCaseInsensitive(it.BuffBucketId, id))
}

function extractItemKeys(item: BuffBucketData) {
  return Object.keys(item || {}).filter((it) => it.match(/^Buff\d+$/i))
}
