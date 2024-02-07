import { Statuseffectcategories } from '@nw-data/generated'
import { ModifierKey, ModifierResult, eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveMods, DbSlice } from '../types'
import { categorySum } from './category-sum'

export function selectModsDMG({ effectCategories }: DbSlice, mods: ActiveMods) {
  return {
    byDamageType: sumDamageCategories(mods, effectCategories),
    byVitalsType: sumVitalsCategory(mods),
  } as const
}

function sumDamageCategories(mods: ActiveMods, categories: Map<string, Statuseffectcategories>) {
  return {
    Acid: sumCategory('DMGAcid', mods, categories),
    Arcane: sumCategory('DMGArcane', mods, categories),
    Corruption: sumCategory('DMGCorruption', mods, categories),
    Fire: sumCategory('DMGFire', mods, categories),
    Ice: sumCategory('DMGIce', mods, categories),
    Lightning: sumCategory('DMGLightning', mods, categories),
    Nature: sumCategory('DMGNature', mods, categories),
    Siege: sumCategory('DMGSiege', mods, categories),
    Slash: sumCategory('DMGSlash', mods, categories),
    Standard: sumCategory('DMGStandard', mods, categories),
    Strike: sumCategory('DMGStrike', mods, categories),
    Thrust: sumCategory('DMGThrust', mods, categories),
  }
}

function sumCategory(
  key: ModifierKey<number>,
  mods: ActiveMods,
  categories: Map<string, Statuseffectcategories>
): ModifierResult {
  return categorySum({
    key: key,
    mods: mods,
    categories: categories,
    base: 1,
  })
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
