import { statusEffectHasFortifyCap } from '@nw-data/common'
import { sumBy } from 'lodash'
import { ModifierKey, ModifierResult, ModifierValue, eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveMods } from '../types'

const min = Math.min
const max = Math.max
const clamp = (value: number, l: number, r: number) => min(max(value, l), r)

export function selectModsABS(mods: ActiveMods) {
  return {
    DamageCategories: {
      Arcane: sumCategory('ABSArcane', mods),
      Corruption: sumCategory('ABSCorruption', mods),
      Fire: sumCategory('ABSFire', mods),
      Ice: sumCategory('ABSIce', mods),
      Lightning: sumCategory('ABSLightning', mods),
      Nature: sumCategory('ABSNature', mods),
      Siege: sumCategory('ABSSiege', mods),
      Slash: sumCategory('ABSSlash', mods),
      Standard: sumCategory('ABSStandard', mods),
      Strike: sumCategory('ABSStrike', mods),
      Thrust: sumCategory('ABSThrust', mods),
    },
    VitalsCategories: sumVitalsCategory(mods),
  }
}

function sumCategory(key: ModifierKey<number>, mods: ActiveMods): ModifierResult {
  const capped: ModifierValue<number>[] = []
  const uncapped: ModifierValue<number>[] = []
  for (const mod of eachModifier<number>(key, mods)) {
    if (statusEffectHasFortifyCap(mod.source.effect)) {
      capped.push({
        ...mod,
        ...{ capped: true },
      })
    } else {
      uncapped.push({
        ...mod,
        ...{ capped: false },
      })
    }
  }
  const cappdSum = sumBy(capped, (it) => it.value * it.scale)
  const uncappedSum = sumBy(uncapped, (it) => it.value * it.scale)
  const total = clamp(cappdSum + uncappedSum, min(-0.3, uncappedSum), max(0.5, uncappedSum))
  return {
    value: total,
    source: [...uncapped, ...capped],
  }
}

function sumVitalsCategory(mods: ActiveMods) {
  const results: Record<string, ModifierResult> = {}
  for (let { value, scale, source } of eachModifier('ABSVitalsCategory', mods)) {
    if (typeof value === 'string' && Number.isFinite(Number(value))) {
      value = Number(value)
    }
    if (typeof value === 'string') {
      for (const category of value.split(/[+,]/)) {
        const [name, value] = category.split('=')
        results[name] = results[name] || modifierResult()
        modifierAdd(results[name], {
          scale: scale,
          value: Number(value),
          source: source,
        })
      }
    }
    if (typeof value === 'number') {
      const name = 'VitalsCategory'
      results[name] = results[name] || modifierResult()
      modifierAdd(results[name], {
        scale: scale,
        value: value,
        source: source,
      })
    }
  }
  return results
}
