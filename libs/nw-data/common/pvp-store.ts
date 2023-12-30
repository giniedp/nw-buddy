import { Lootbuckets, PvpStore } from '@nw-data/generated'
import { CaseInsensitiveMap } from './utils/caseinsensitive-map'
import { flatten } from 'lodash'

export function convertPvoStore(data: PvpStore[]): PvpStoreRow[] {
  const firstRow = data.find((it) => it.RowPlaceholders === 'FIRSTROW')
  const result = data.map((row, i) => convertRow(row, firstRow, i))
  return flatten(result).filter((it) => !!it.Item || !!it.RewardId)
}

export type PvpStoreRow = {
  Row: number
  Column: number
  Tags: Map<string, PvpStoreTag[]>
  Bucket: string
  Item: string

  BudgetContribution?: number
  Entitlement?: number
  ExcludeTypeStage?: string
  GameEvent?: string
  MatchOne?: boolean
  RandomWeights?: number
  RewardId?: string
  SelectOnceOnly?: boolean
  Type?: string
}

export type PvpStoreTag = {
  Name: string
  Value?: null | [number] | [number, number]
}

function convertRow(data: PvpStore, firstRow: PvpStore, rowId: number): PvpStoreRow[] {
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
    .map((id): PvpStoreRow => {
      const bucketNameKey = `Bucket${id}`
      return {
        Column: id,
        Row: rowId,
        Item: null as string,
        Bucket: firstRow[bucketNameKey] || '',
        Tags: new CaseInsensitiveMap(),
      }
    })
    .map((result) => {
      for (const key of keys) {
        const value = data[`${key}${result.Column}`]
        switch (key) {
          case 'Tag': {
            const tags = ((value as string[]) || []).map(lootBucketTag)
            for (const tag of tags) {
              if (!tag) {
                continue
              }
              if (!result.Tags.has(tag.Name)) {
                result.Tags.set(tag.Name, [])
              }
              result.Tags.get(tag.Name).push(tag)
            }
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

function lootBucketTag(value: string): PvpStoreTag {
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
