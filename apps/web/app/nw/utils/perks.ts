import { Affixstats, Perks } from "@nw-data/types"

export function hasPerkAffixStats(perk: Perks): boolean {
  return !!perk && !!perk.Affix && perk.PerkType === 'Inherent'
}

export function getPerkAffixStat(perk: Perks, affix: Affixstats, gearScore: number) {
  return getAffixStats(affix, perk.ScalingPerGearScore * gearScore)
}

export function getAffixStats(affix: Affixstats, scale: number) {
  return Object.keys(affix)
    .filter((it) => it.startsWith('MOD'))
    .map((key) => {
      const label = key.replace('MOD', '').toLowerCase()
      const value = String(affix[key])
      return {
        key: key,
        label: `ui_${label}`,
        value: value.includes('-') ? value : Math.round(Number(value) * Math.floor(scale))
      }
    })
    .filter((it) => it.value)
}
