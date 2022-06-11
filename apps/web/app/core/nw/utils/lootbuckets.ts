import { Lootbuckets } from '@nw-data/types'
import { uniq, uniqBy } from 'lodash'
import { CaseInsensitiveMap } from '~/core/utils'

export function convertLootbuckets(data: Lootbuckets[]) {
  const firstRow = data.find((it) => it.RowPlaceholders === 'FIRSTROW')
  const result = data
    .map((row) => convertRow(row, firstRow))
    .flat(1)
    .filter((it) => !!it.Item)
  const tags = uniqBy(result.map((it) => Array.from(it.Tags.values())).flat(1), (it) => it.Name).sort((a, b) => a.Name.localeCompare(b.Name))
  console.log('LootBucketTags', tags)
  return result
}

export type LootBucketEntry = {
  Column: number
  Item: string
  LootBucket: string
  MatchOne: string
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
        MatchOne: null as string,
        Quantity: null as number[],
        Tags: new CaseInsensitiveMap(),
      }
    })
    .map((result) => {
      for (const key of keys) {
        const value = data[`${key}${result.Column}`]
        if (key === 'Tags') {
          const tags = (value as string[] || []).map(lootBucketTag)
            for (const tag of tags) {
              if (tag) {
                result.Tags.set(tag.Name, tag)
              }
            }
        } else if (key === 'Quantity') {
          result[key] = typeof value === 'string' ? value.split('-').map(Number) : [value]
        } else {
          result[key] = value
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
