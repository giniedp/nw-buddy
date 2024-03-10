import { eqCaseInsensitive } from './utils/caseinsensitive-compare'

// prettier-ignore
const LOOT_CONDITION_TAG = [
  'Level',
  'EnemyLevel',
  'MinContLevel',    // used heavily in loot buckets
  'MinPOIContLevel', // used only about 3 times atm.
  'SalvageItemGearScore',
  'SalvageItemRarity',
  'SalvageItemTier',
  // currently unused condition tags
  'POILevel',
  'MinEnemyContLevel',
]

export function isLootTagKnownCondition(tag: string) {
  return LOOT_CONDITION_TAG.some((it) => eqCaseInsensitive(it, tag))
}

export function hasKnownLootConditionTag(tags: string[]) {
  return tags?.length > 0 && tags.some(isLootTagKnownCondition)
}

export interface ParsedLootTag {
  prefix: string | null
  name: string
  value: [number] | [number, number] | null
}

export function parseLootTag(tag: string): ParsedLootTag {
  if (!tag) {
    return null
  }
  const ref = parseLootRef(tag)
  if (!ref) {
    return null
  }

  let name: string = ''
  let value: [number] | [number, number] = null

  if (ref.name.includes(':')) {
    const [n, r] = ref.name.split(':')
    name = n
    value = parseLootTagValue(r)
  } else {
    name = ref.name
  }
  return {
    prefix: ref.prefix,
    name,
    value,
  }
}

export interface ParsedLootRef {
  prefix: string | null
  name: string
}

export function parseLootRef(value: string): ParsedLootRef {
  if (!value) {
    return null
  }
  let prefix: string = null
  let name: string = ''
  if (value.startsWith('[')) {
    if (!value.includes(']')) {
      console.error('Invalid loot tag or reference', value)
      return null
    }
    const end = value.indexOf(']')
    prefix = value.substring(1, end).toUpperCase()
    name = value.substring(end + 1)
  } else {
    name = value
  }
  return {
    prefix,
    name,
  }
}

export function parseLootTagValue(value: string): [number] | [number, number] {
  if (value == null) {
    return null
  }
  return value.split('-').map(Number) as any
}

export function testLootContextTag({
  contextTags,
  contextValues,
  tag,
  tagValue,
}: {
  contextTags: Set<string>
  contextValues: Map<string, string | number>
  tag: string
  tagValue: number | string | [number] | [number, number] | null
}) {
  if (!tag) {
    // no tag to test
    return true
  }
  const isCondition = isLootTagKnownCondition(tag) || contextValues.has(tag)
  if (isCondition) {
    if (!contextValues.has(tag) || tagValue == null) {
      // known condition tag not present
      return false
    }
    const contextValue = Number(contextValues.get(tag))
    if (typeof tagValue === 'number') {
      return tagValue <= contextValue
    }
    if (typeof tagValue === 'string') {
      return Number(tagValue) <= contextValue
    }
    if (tagValue.length === 1) {
      return tagValue[0] <= contextValue
    }
    if (tagValue.length === 2) {
      return tagValue[0] <= contextValue && contextValue <= tagValue[1]
    }
  }
  return contextTags.has(tag)
}
