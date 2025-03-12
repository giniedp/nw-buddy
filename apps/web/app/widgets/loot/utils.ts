import { eqCaseInsensitive } from '~/utils'

const CONDITION_TAGS = [
  'Level',
  'EnemyLevel',
  'MinContLevel',
  'MinPOIContLevel',
  'SalvageItemGearScore',
  'SalvageItemRarity',
  'SalvageItemTier',
]

export function isConditionTag(tag: string) {
  return CONDITION_TAGS.some((it) => eqCaseInsensitive(it, tag))
}

export function includesConditionTag(tags: string[]) {
  return tags?.length > 0 && tags.some(isConditionTag)
}
