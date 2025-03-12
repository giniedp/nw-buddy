import { DamageType, StatusEffectCategoryData } from '@nw-data/generated'
import { ModifierKey, ModifierResult, eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveMods, DbSlice } from '../types'
import { categorySum } from './category-sum'
import { byDamageType } from './by-damage-type'

export function selectModsABS({ effectCategories }: DbSlice, mods: ActiveMods) {
  return {
    DamageCategories: byDamageType((type) => sumCategory(`ABS${type}` as any, mods, effectCategories)),
    VitalsCategories: sumVitalsCategory(mods),
  }
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
    base: 0,
  })
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
