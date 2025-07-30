import { AbilityData, AffixStatData, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { getAffixMODs } from './affix'

const PERK_SORT_WEIGHT = {
  Inherent: 0,
  Gem: 1,
  Generated: 2,
}

export function isPerkInherent(perk: Pick<PerkData, 'PerkType'>) {
  return perk?.PerkType === 'Inherent'
}

export function isPerkGem(perk: Pick<PerkData, 'PerkType'>) {
  return perk?.PerkType === 'Gem'
}

export function isPerkEmptyGemSlot(perk: PerkData) {
  return eqIgnoreCase(perk?.PerkID, 'PerkID_Gem_EmptyGemSlot')
}

export function isPerkGenerated(perk: Pick<PerkData, 'PerkType'>) {
  return perk?.PerkType === 'Generated'
}

export function getPerkTypeWeight(type: string) {
  return PERK_SORT_WEIGHT[type] ?? 3
}

export function isPerkApplicableToItem(
  perk: Pick<PerkData, 'ItemClass'>,
  item: Pick<MasterItemDefinitions, 'ItemClass'>,
) {
  if (!perk || !item || !perk.ItemClass || !item.ItemClass) {
    return false
  }
  return doListsIntersect(perk.ItemClass, item.ItemClass, eqIgnoreCase)
}

export function isPerkExcludedFromItem(
  perk: Pick<PerkData, 'ExcludeItemClass' | 'PerkType'>,
  item: Pick<MasterItemDefinitions, 'ItemClass'>,
  checkGem: boolean,
) {
  if (!perk || !item) {
    return false
  }
  if (doListsIntersect(perk.ExcludeItemClass, item.ItemClass, eqIgnoreCase)) {
    return true
  }
  if (checkGem && isPerkGem(perk) && doesListInclude(item.ItemClass, 'NoGem', eqIgnoreCase)) {
    return true
  }
  return false
}

export function hasPerkInherentAffix(perk: PerkData): boolean {
  return isPerkInherent(perk) && !!perk?.Affix
}

export interface ItemClassGSBonus {
  itemClass: string
  value: number
}

export function getPerkItemClassGSBonus(perk: Pick<PerkData, 'ItemClassGSBonus'>): ItemClassGSBonus {
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

export function getExclusiveLabelIntersection(perk1: PerkData, perk2: PerkData) {
  if (!perk1?.ExclusiveLabels?.length || !perk2?.ExclusiveLabels?.length) {
    return []
  }
  const result: string[] = []
  for (const l1 of perk1.ExclusiveLabels) {
    for (const l2 of perk2.ExclusiveLabels) {
      if (eqIgnoreCase(l1, l2)) {
        result.push(l1)
      }
    }
  }
  return result
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

export function explainPerk(options: {
  perk: PerkData
  affix: AffixStatData
  abilities?: AbilityData[]
  gearScore: number
  forceDescription?: boolean
}): PerkExplanation[] {
  const { perk, affix, gearScore } = options
  const result: PerkExplanation[] = []

  if (!perk) {
    return result
  }

  if (isPerkInherent(perk) && affix) {
    result.push(...explainPerkMods(options))
  }

  const needsIcon = !!perk.SecondaryEffectDisplayName || !result.length
  const needsDescription = !result.length || options.forceDescription
  const stackLimit = options.abilities?.find((it) => it?.IsStackableAbility && it?.IsStackableMax)?.IsStackableMax
  if ((needsDescription && perk.DisplayName) || perk.SecondaryEffectDisplayName) {
    // common perk case e.g.
    // Health: +2.2% max health.
    result.push({
      perkId: perk.PerkID,
      icon: needsIcon ? perk.IconPath : null,
      label: perk.DisplayName || perk.SecondaryEffectDisplayName,
      colon: true,
      description: perk.Description,
      stackLimit: stackLimit,
      context: {
        itemId: perk.PerkID,
        gearScore: gearScore,
      },
    })
  }

  return result
}

export function explainPerkMods(options: {
  perk: PerkData
  affix: AffixStatData
  gearScore: number
}): PerkExplanation[] {
  const { perk, affix, gearScore } = options
  const result: PerkExplanation[] = []
  if (!isPerkInherent(perk) || !affix) {
    return result
  }

  if (!affix.AttributePlacingMods) {
    // perk with attribute mods e.g. MODStrength, MODDexterity etc.
    // +25 Strength
    const mods = getPerksInherentMODs(perk, affix, gearScore)
    mods?.forEach((mod, i) => {
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
  }

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
    String(affix.AttributePlacingMods).split(',').forEach((it, i) => {
      part.context[`amount${i + 1}`] = Math.floor(Number(it) * scale)
    })
    result.push(part)
  }
  return result
}

export function getPerksInherentMODs(
  perk: Pick<PerkData, 'ScalingPerGearScore' | 'ScalingPerGearScoreAttributes'>,
  affix: AffixStatData,
  gearScore: number,
) {
  return getAffixMODs(affix, getPerkMultiplier(perk, gearScore))
}

export function hasPerkScalingPerGearScore(
  perk: Pick<PerkData, 'ScalingPerGearScore' | 'ScalingPerGearScoreAttributes'>,
): boolean {
  return !!perk?.ScalingPerGearScore || !!perk?.ScalingPerGearScoreAttributes
}

export function getPerkAttributeMultiplier(
  perk: Pick<PerkData, 'ScalingPerGearScore' | 'ScalingPerGearScoreAttributes'>,
  gearScore: number,
) {
  return getPerkMultiplier(perk, gearScore)
}

export function getPerkOnlyMultiplier(
  perk: Pick<PerkData, 'ScalingPerGearScore'>,
  gearScore: number,
) {
  return getPerkMultiplier({
    ScalingPerGearScore: perk?.ScalingPerGearScore,
    ScalingPerGearScoreAttributes: null,
  }, gearScore)
}

export function getPerkMultiplier(
  perk: Pick<PerkData, 'ScalingPerGearScore' | 'ScalingPerGearScoreAttributes'>,
  gearScore: number,
) {
  const scalingPerGearScore = perk?.ScalingPerGearScore || perk?.ScalingPerGearScoreAttributes
  if (!scalingPerGearScore) {
    return 1
  }

  if (Number.isFinite(Number(scalingPerGearScore))) {
    return Math.max(0, gearScore - 100) * Number(scalingPerGearScore) + 1
  }

  if (typeof scalingPerGearScore === 'string') {
    let result = 0
    const ranges = parseScalingPerGearScore(scalingPerGearScore)
    ranges.forEach(({ score, scaling }, i) => {
      if (score > gearScore) {
        return
      }
      const next = ranges[i + 1]
      const min = score
      const max = Math.min(gearScore, next ? next.score : gearScore)
      result += Math.max(0, max - min) * scaling
    })
    return result + 1
  }
  return 1
}

export function parseScalingPerGearScore(value: string) {
  // sample: "0.00125,625:0.0095"
  return value.split(',').map((it, i) => {
    if (it.includes(':')) {
      const [score, scaling] = it.split(':')
      return { score: Number(score), scaling: Number(scaling) }
    }
    return { score: 100, scaling: Number(it) }
  })
}

export function getPerkItemClassGsBonus(perk: PerkData) {
  if (!perk || !perk.ItemClassGSBonus?.length) {
    return []
  }
  return perk.ItemClassGSBonus.split(',').map((spec) => {
    const [itemClass, bonus] = spec.split(':')
    return { itemClass, bonus: Number(bonus) }
  })
}
export function getItemGsBonus(perk: PerkData, item: MasterItemDefinitions) {
  if (!item || !item.ItemClass) {
    return 0
  }
  return (
    getPerkItemClassGsBonus(perk).find(({ itemClass }) => {
      return item.ItemClass?.some((it) => eqIgnoreCase(it, itemClass))
    })?.bonus || 0
  )
}

function eqIgnoreCase(a: string, b: string) {
  return a?.toLowerCase() === b?.toLowerCase()
}

function doesListInclude<T>(list: T[], value: T, eq: (a: T, b: T) => boolean) {
  return list?.some((it) => eq(it, value)) ?? false
}

function doListsIntersect<T>(list1: T[], list2: T[], eq: (a: T, b: T) => boolean) {
  return list1?.some((it) => doesListInclude(list2, it, eq)) ?? false
}
