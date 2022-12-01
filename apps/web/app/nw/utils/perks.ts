import { Ability, Affixstats, ItemDefinitionMaster, Perkbuckets, Perks } from '@nw-data/types'
import { patchPrecision } from './precision'

const PERK_SORT_WEIGHT = {
  Inherent: 0,
  Gem: 1,
  Generated: 2
}

export function isPerkInherent(perk:  Perks | Perkbuckets) {
  return perk?.PerkType === 'Inherent'
}

export function isPerkGem(perk: Perks | Perkbuckets) {
  return perk?.PerkType === 'Gem'
}

export function isPerkGenerated(perk: Perks | Perkbuckets) {
  return perk?.PerkType === 'Generated'
}

export function getPerkTypeWeight(type: string) {
  return PERK_SORT_WEIGHT[type] ?? 3
}

export function isPerkApplicableToItem(perk: Perks, item: ItemDefinitionMaster) {
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

export function getPerksGemABSs(perk: Pick<Perks, 'ScalingPerGearScore'>, affix: Affixstats, gearScore: number) {
  return getAffixMODs(affix, getPerkMultiplier(perk, gearScore))
}

export function getPerkMultiplier(perk: Pick<Perks, 'ScalingPerGearScore'> , gearScore: number) {
  const scale = patchPrecision(perk.ScalingPerGearScore)
  return Math.max(0, gearScore - 100) * scale + 1
}

export function getAffixMODs(affix: Partial<Affixstats>, scale: number) {
  return getAffixProperties(affix)
    .filter((it) => it.key.startsWith('MOD'))
    .map(({ key, value }) => {
      const label = key.replace('MOD', '').toLowerCase()
      const valNum = Number(value)
      return {
        key: key,
        label: `ui_${label}`,
        labelShort: `ui_${label}_short`,
        value: Number.isFinite(valNum) ? Math.floor(valNum * scale) : value,
      }
    })
}

export function getAffixABSs(affix: Partial<Affixstats>, scale: number) {
  return getAffixProperties(affix)
    .filter((it) => it.key.startsWith('ABS'))
    .map(({ key, value }) => {
      const name = key.replace('ABS', '')
      let label: string
      let type: string
      if (name.match(/^vitalscategory/i)) {
        type = name.replace(/^vitalscategory\s+/i, '')
        label = `VC_${type}`
      } else {
        type = name
        label = `${name}_DamageName`
      }
      const valNum = Number(value)
      return {
        key: key,
        type: type,
        label: [label, 'ui_resistance'],
        value: Number.isFinite(valNum) ? valNum * scale : value,
      }
    })
}


export function getAffixDMGs(affix: Partial<Affixstats>, scale: number) {
  return getAffixProperties(affix)
    .filter((it) => it.key.startsWith('DMG'))
    .map(({ key, value }) => {
      const name = key.replace('DMG', '').toLowerCase()
      let label: string
      if (name.match(/^vitalscategory/i)) {
        label = `VC_${name.replace('vitalscategory ', '')}`
      } else {
        label = `${name}_DamageName`
      }
      const valNum = Number(value)
      return {
        key: key,
        label: [label],
        value: Number.isFinite(valNum) ? valNum * scale : value,
      }
    })
}
export function getAffixProperties(affix: Partial<Affixstats>): Array<{ key: string; value: number | string }> {
  return Object.entries((affix || {}) as Affixstats)
    .filter(([key]) => key !== 'StatusID')
    .map(([key, value]) => {
      if (typeof value === 'string') {
        if (value.includes('=')) {
          const [a, b] = value.split('=')
          key = `${key} ${a}`
          value = Number(b)
        }
      }
      return {
        key,
        value,
      }
    })
    .filter((it) => !!it.value)
}

export function stripAffixProperties(item: Affixstats): Partial<Affixstats> {
  return Object.entries(item || {})
    .filter(([key, value]) => key !== 'StatusID' && key !== '$source' && !!value)
    .reduce((it, [key, value]) => {
      it[key] = value
      return it
    }, {})
}

export function stripAbilityProperties(item: Ability): Partial<Ability> {
  return Object.entries(item || {})
    .filter(([key, value]) => key !== 'AbilityID' && key !== '$source' && !!value)
    .reduce((it, [key, value]) => {
      it[key] = value
      return it
    }, {})
}
