import { Affixstats, ItemDefinitionMaster, Perks } from '@nw-data/types'
import { eqCaseInsensitive } from '~/utils'
import { getAffixMODs } from './affix'
import { patchPrecision } from './precision'

const PERK_SORT_WEIGHT = {
  Inherent: 0,
  Gem: 1,
  Generated: 2,
}

export function isPerkInherent(perk: Pick<Perks, 'PerkType'>) {
  return perk?.PerkType === 'Inherent'
}

export function isPerkGem(perk: Pick<Perks, 'PerkType'>) {
  return perk?.PerkType === 'Gem'
}

export function isPerkGenerated(perk: Pick<Perks, 'PerkType'>) {
  return perk?.PerkType === 'Generated'
}

export function getPerkTypeWeight(type: string) {
  return PERK_SORT_WEIGHT[type] ?? 3
}

export function isPerkApplicableToItem(perk: Pick<Perks, 'ItemClass'>, item: Pick<ItemDefinitionMaster, 'ItemClass'>) {
  if (!perk || !item || !perk.ItemClass || !item.ItemClass) {
    return false
  }
  const a = perk.ItemClass.map((it) => it.toLowerCase())
  const b = item.ItemClass.map((it) => it.toLowerCase())
  return a.some((it) => b.includes(it))
}

export function hasPerkInherentAffix(perk: Perks): boolean {
  return isPerkInherent(perk) && !!perk?.Affix
}

export function getPerksInherentMODs(perk: Pick<Perks, 'ScalingPerGearScore'>, affix: Affixstats, gearScore: number) {
  return getAffixMODs(affix, getPerkMultiplier(perk, gearScore))
}

export function getPerkMultiplier(perk: Pick<Perks, 'ScalingPerGearScore'>, gearScore: number) {
  const scale = patchPrecision(perk.ScalingPerGearScore)
  return Math.max(0, gearScore - 100) * scale + 1
}

export function getPerkItemClassGsBonus(perk: Perks) {
  if (!perk || !perk.ItemClassGSBonus?.length) {
    return []
  }
  return perk.ItemClassGSBonus.split(',').map((spec) => {
    const [itemClass, bonus] = spec.split(':')
    return { itemClass, bonus: Number(bonus) }
  })
}
export function getItemGsBonus(perk: Perks, item: ItemDefinitionMaster) {
  return getPerkItemClassGsBonus(perk).find(({ itemClass }) => {
    return item.ItemClass?.some((it) => eqCaseInsensitive(it, itemClass))
  })?.bonus || 0
}
