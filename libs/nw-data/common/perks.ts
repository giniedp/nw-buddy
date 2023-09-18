import { Affixstats, ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { getAffixMODs } from './affix'

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

export interface PerkExplanation {
  perkId: string
  icon?: string
  label: string
  colon?: boolean
  description: string
  stackLimit?: number
  context: any
}

export function explainPerk(options: { perk: Perks; affix: Affixstats; gearScore: number }): PerkExplanation[] {
  const { perk, affix, gearScore } = options
  const result: PerkExplanation[] = []

  if (isPerkInherent(perk) && affix) {
    result.push(...explainPerkAttributeMods(options))
  }

  if (perk.DisplayName || perk.SecondaryEffectDisplayName || perk.Description) {
    // common perk case e.g.
    // Health: +2.2% max health.
    result.push({
      perkId: perk.PerkID,
      icon: perk.IconPath,
      label: perk.DisplayName || perk.SecondaryEffectDisplayName || '',
      colon: true,
      description: perk.Description,
      context: {
        itemId: perk.PerkID,
        gearScore: gearScore,
      },
    })
  }

  return result
}

export interface ItemClassGSBonus {
  itemClass: string
  value: number
}

export function getPerkItemClassGSBonus(perk: Pick<Perks, 'ItemClassGSBonus'>): ItemClassGSBonus {
  if (!perk?.ItemClassGSBonus) {
    return null
  }
  const match = perk.ItemClassGSBonus.match(/(\w+):(\d+)/)
  if (!match) {
    console.warn('unknown ItemClassGSBonus format', perk.ItemClassGSBonus)
    return null
  }
  return {
    itemClass: match[1],
    value: Number(match[2]),
  }
}

export function explainPerkAttributeMods(options: {
  perk: Perks
  affix: Affixstats
  gearScore: number
}): PerkExplanation[] {
  const { perk, affix, gearScore } = options
  const result: PerkExplanation[] = []
  if (!isPerkInherent(perk) || !affix) {
    return result
  }

  // perk with attribute mods e.g. MODStrength, MODDexterity etc.
  // +25 Strength
  const mods = getPerksInherentMODs(perk, affix, gearScore)
  mods?.forEach((mod) => {
    result.push({
      perkId: perk.PerkID,
      icon: perk.IconPath,
      label: `${mod.value > 0 ? '+' : ''}${Math.floor(mod.value)}`,
      description: mod.label,
      context: {
        itemId: perk.PerkID,
        gearScore: gearScore,
      },
    })
  })

  // perk with mods to highest attribute
  // +25 Magnify (highest attribute: Focus)
  if (affix.AttributePlacingMods) {
    const scale = getPerkMultiplier(perk, gearScore)
    const part: PerkExplanation = {
      perkId: perk.PerkID,
      icon: perk.IconPath,
      label: '',
      // whole string is in the StatDisplayText
      // +{amount1} Magnify</font> (highest attribute: {attribute1})
      description: perk.StatDisplayText,
      context: {
        itemId: perk.PerkID,
        gearScore: gearScore,
      },
    }
    affix.AttributePlacingMods.split(',').forEach((it, i) => {
      part.context[`amount${i + 1}`] = Math.floor(Number(it) * scale)
    })
    result.push(part)
  }
  return result
}

export function getPerksInherentMODs(perk: Pick<Perks, 'ScalingPerGearScore'>, affix: Affixstats, gearScore: number) {
  return getAffixMODs(affix, getPerkMultiplier(perk, gearScore))
}

export function getPerkMultiplier(perk: Pick<Perks, 'ScalingPerGearScore'>, gearScore: number) {
  if (!perk.ScalingPerGearScore) {
    return 1
  }

  if (Number.isFinite(Number(perk.ScalingPerGearScore))) {
    return Math.max(0, gearScore - 100) * Number(perk.ScalingPerGearScore) + 1
  }

  if (typeof perk.ScalingPerGearScore === 'string') {
    let result = 0
    const ranges = parseScalingRanges(perk.ScalingPerGearScore)
    ranges.forEach(({ gs, value }, i) => {
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
  return value.split(',').map((it, i) => {
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
