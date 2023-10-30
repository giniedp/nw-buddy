import { BuffType, Buffbuckets } from '@nw-data/generated'
import { OmitByPrefix } from './utils/ts-types'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'

export type BuffBucketBase = Pick<Buffbuckets, 'BuffBucketId' | 'TableType' | 'MaxRoll'>
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

export function convertBuffBuckets(data: Buffbuckets[]): BuffBucket[] {
  const result = data
    .filter((it) => !it.BuffBucketId.endsWith('_Probs'))
    .map((it): Buffbuckets => JSON.parse(JSON.stringify(it)))
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

function findById(items: Buffbuckets[], id: string) {
  return items.find((it) => eqCaseInsensitive(it.BuffBucketId, id))
}

function extractItemKeys(item: Buffbuckets) {
  return Object.keys(item || {}).filter((it) => it.match(/^Buff\d+$/i))
}
