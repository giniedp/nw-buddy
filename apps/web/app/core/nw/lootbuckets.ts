import { Lootbuckets } from '@nw-data/types'

export function convertLootbuckets(data: Lootbuckets[]) {
  return data.map(convertRow)
}

export type LootBucketTable = LootBucketRow[]

export type LootBucketRow = {
  Row: string
  Entries: LootBucketEntry[]
}
export type LootBucketEntry = {
  Column: number
  Item: string
  LootBucket: string
  MatchOne: string
  Quantity: number[]
  Tags: LootBucketTag[]
}

export type LootBucketTag = {
  Name: string
  Value?: null | [number] | [number, number]
}

function convertRow(data: Lootbuckets): LootBucketRow {
  const bucketId = data.RowPlaceholders
  const keys = new Set<string>()
  const ids = new Set<number>()
  for (const key of Object.keys(data)) {
    const match = key.match(/([^0-9]+)(\d+)$/)
    if (match) {
      keys.add(match[1])
      ids.add(Number(match[2]))
    }
  }
  return {
    Row: bucketId,
    Entries: Array.from(ids)
      .sort()
      .map((id) => {
        return Array.from(keys).reduce(
          (res, key) => {
            const value = data[`${key}${id}`]
            if (key === 'Tags') {
              res[key] = ((value as string) || '').split(',').map(lootBucketTag)
            } else if (key === 'Quantity') {
              res[key] = typeof value === 'string' ? value.split('-').map(Number) : [value]
            } else {
              res[key] = value
            }
            return res
          },
          {
            Column: id,
            Item: null as string,
            LootBucket: null as string,
            MatchOne: null as string,
            Quantity: null as number[],
            Tags: null as LootBucketTag[],
          } as LootBucketEntry
        )
      }),
  }
}

function lootBucketTag(value: string): LootBucketTag {
  if (!value) {
    return null
  }
  const [name, range] = value.split(':')
  return {
    Name: name,
    Value: (range || '').split('-').map(Number) as any,
  }
}
