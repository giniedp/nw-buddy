import { Lootbuckets } from '@nw-data/types'
import { uniq, uniqBy } from 'lodash'
import { CaseInsensitiveMap } from '~/utils'

export function convertLootbuckets(data: Lootbuckets[]) {
  const firstRow = data.find((it) => it.RowPlaceholders === 'FIRSTROW')
  const result = data
    .map((row) => convertRow(row, firstRow))
    .flat(1)
    .filter((it) => !!it.Item)
  return result
}

export type LootBucketEntry = {
  Column: number
  Item: string
  LootBucket: string
  MatchOne: boolean
  Quantity: number[]
  Tags: Map<string, LootBucketTag>
}

export type LootBucketTag = {
  Name: string
  Value?: null | [number] | [number, number]
}

function convertRow(data: Lootbuckets, firstRow: Lootbuckets): LootBucketEntry[] {
  const keys = new Set<string>()
  const ids = new Set<number>()
  for (const key of Object.keys(data)) {
    const match = key.match(/([^0-9]+)(\d+)$/)
    if (match) {
      keys.add(match[1])
      ids.add(Number(match[2]))
    }
  }
  return Array.from(ids)
    .sort()
    .map((id): LootBucketEntry => {
      return {
        Column: id,
        Item: null as string,
        LootBucket: firstRow[`LootBucket${id}`],
        MatchOne: null,
        Quantity: null as number[],
        Tags: new CaseInsensitiveMap(),
      }
    })
    .map((result) => {
      for (const key of keys) {
        const value = data[`${key}${result.Column}`]
        switch(key) {
          case 'Tags': {
            const tags = (value as string[] || []).map(lootBucketTag)
            for (const tag of tags) {
              if (tag) {
                result.Tags.set(tag.Name, tag)
              }
            }
            break
          }
          case 'Quantity': {
            result[key] = typeof value === 'string' ? value.split('-').map(Number) : [value]
            break
          }
          case 'MatchOne': {
            result[key] = String(value).toLowerCase() === 'true'
            break
          }
          default: {
            result[key] = value
            break
          }
        }
      }
      return result
    })
}

function lootBucketTag(value: string): LootBucketTag {
  if (!value) {
    return null
  }
  if (!value.includes(':')) {
    return {
      Name: value,
    }
  }
  const [name, range] = value.split(':')
  return {
    Name: name,
    Value: (range || '').split('-').map(Number) as any,
  }
}
