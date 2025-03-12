import { StatusEffectCategoryData } from '@nw-data/generated'
import { ModifierKey, ModifierResult, eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveMods, DbSlice } from '../types'
import { categorySum } from './category-sum'
import { byDamageType } from './by-damage-type'

export function selectModsDMG({ effectCategories }: DbSlice, mods: ActiveMods) {
  return {
    byDamageType: byDamageType((type) => sumCategory(`DMG${type}` as any, mods, effectCategories)),
    byVitalsType: sumVitalsCategory(mods),
  } as const
}

function sumCategory(
  key: ModifierKey<number>,
  mods: ActiveMods,
  categories: Map<string, StatusEffectCategoryData>,
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
          limit: Number.POSITIVE_INFINITY,
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
        limit: Number.POSITIVE_INFINITY,
      })
    }
  }
  return results
}
