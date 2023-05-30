import { Statuseffect } from "@nw-data/generated"

const TOWN_BUFF_IDS = [
  'ArcaneBlessingLSB',
  'HaleandHeartyLSB',
  'StalwartLSB',

  'LumberJackSpiritLSB',
  'FarmersHarvestLSB',
  'MinersResolveLSB',
  'HuntersBountyLSB',

  'BlacksmithTemperamentLSB',
  'EngineersPatienceLSB',
  'OutfittersInspirationLSB',
  'ChefsPassionLSB',
  'ArcaneWisdomLSB',

  //'FishermandFortuneLSB',
]

export function getStatusEffectTownBuffIds() {
  return [...TOWN_BUFF_IDS]
}

export function statusEffectHasCategory(effect: Statuseffect, category: string)  {
  return effect?.EffectCategories?.includes(category)
}

export function statusEffectHasEmpowerCap(effect: Statuseffect) {
  return statusEffectHasCategory(effect, 'Empower') || statusEffectHasCategory(effect, 'Weaken')
}

export function statusEffectHasFortifyCap(effect: Statuseffect) {
  return statusEffectHasCategory(effect, 'Fortify') || statusEffectHasCategory(effect, 'Rend')
}

export function statusEffectHasArmorFortifyCap(effect: Statuseffect) {
  return statusEffectHasCategory(effect, 'ArmorFortify') || statusEffectHasCategory(effect, 'ArmorRend')
}

export function getStatusEffectDMGs(affix: Partial<Statuseffect>, scale: number) {
  return getStatusEffectProperties(affix)
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
export function getStatusEffectProperties(affix: Partial<Statuseffect>): Array<{ key: string; value: number | string }> {
  return Object.entries((affix || {}) as Statuseffect)
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

export function stripStatusEffectProperties(item: Statuseffect): Partial<Statuseffect> {
  return Object.entries(item || {})
    .filter(([key, value]) => key !== 'StatusID' && key !== '$source' && !!value)
    .reduce((it, [key, value]) => {
      it[key] = value
      return it
    }, {})
}
