import { Affixstats, ItemDefinitionMaster, Perks } from '@nw-data/generated'
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
  if (!perk.ScalingPerGearScore) {
    return 1
  }

  if (Number.isFinite(Number(perk.ScalingPerGearScore)) ) {
    return Math.max(0, gearScore - 100) * Number(perk.ScalingPerGearScore) + 1
  }

  if (typeof perk.ScalingPerGearScore === 'string') {
    let result = 0
    const ranges = parseScalingRanges(perk.ScalingPerGearScore)
    ranges.forEach(({ gs, value}, i) => {
      if (gs > gearScore) {
        return
      }
      const next = ranges[i + 1]
      const min = gs
      const max = Math.min(gearScore, next ? next.gs : gearScore)
      result += Math.max(0, max - min) * value
    })
    return result + 1
  }
  return 1
}

function parseScalingRanges(value: string) {
  // sample: "0.00125,625:0.0095"
  return value.split(',') .map((it, i) => {
    if (it.includes(':')) {
      const [gs, value] = it.split(':')
      return { gs: Number(gs), value: Number(value) }
    }
    return { gs: 100, value: Number(it) }
  })
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
  return (
    getPerkItemClassGsBonus(perk).find(({ itemClass }) => {
      return item.ItemClass?.some((it) => eqIgnoreCase(it, itemClass))
    })?.bonus || 0
  )
}

function eqIgnoreCase(a: string, b: string) {
  return a?.toLowerCase() === b?.toLowerCase()
}
