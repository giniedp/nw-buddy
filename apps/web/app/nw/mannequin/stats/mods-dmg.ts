import { Statuseffect } from '@nw-data/generated'
import { sumBy } from 'lodash'
import { statusEffectHasEmpowerCap } from '@nw-data/common'
import { eachModifier, modifierAdd, ModifierKey, modifierResult, ModifierResult, ModifierValue } from '../modifier'
import { ActiveMods } from '../types'

const min = Math.min
const max = Math.max
const clamp = (value: number, l: number, r: number) => min(max(value, l), r)

export function selectModsDMG(mods: ActiveMods) {
  return {
    DamageCategories: {
      Arcane: sumCategory('DMGArcane', mods),
      Corruption: sumCategory('DMGCorruption', mods),
      Fire: sumCategory('DMGFire', mods),
      Ice: sumCategory('DMGIce', mods),
      Lightning: sumCategory('DMGLightning', mods),
      Nature: sumCategory('DMGNature', mods),
      Siege: sumCategory('DMGSiege', mods),
      Slash: sumCategory('DMGSlash', mods),
      Standard: sumCategory('DMGStandard', mods),
      Strike: sumCategory('DMGStrike', mods),
      Thrust: sumCategory('DMGThrust', mods),
    },
    VitalsCategories: sumVitalsCategory(mods),
  } as const
}

function sumCategory(key: ModifierKey<number>, mods: ActiveMods): ModifierResult {
  const capped: ModifierValue<number>[] = []
  const uncapped: ModifierValue<number>[] = []
  for (const mod of eachModifier<number>(key, mods)) {
    if (statusEffectHasEmpowerCap(mod.source.effect)) {
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
  const total = clamp(cappdSum + uncappedSum, min(-0.5, uncappedSum), max(0.5, uncappedSum))
  return {
    value: total,
    source: [...uncapped, ...capped],
  }
}

function sumVitalsCategory(mods: ActiveMods) {
  const results: Record<string, ModifierResult> = {}
  for (let { value, scale, source } of eachModifier('DMGVitalsCategory', mods)) {
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
