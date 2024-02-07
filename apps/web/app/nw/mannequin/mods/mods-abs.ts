import { DamageType, Statuseffectcategories } from '@nw-data/generated'
import { ModifierKey, ModifierResult, eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveMods, DbSlice } from '../types'
import { categorySum } from './category-sum'

export function selectModsABS({ effectCategories }: DbSlice, mods: ActiveMods) {
  return {
    DamageCategories: sumDamageCategories(mods, effectCategories),
    VitalsCategories: sumVitalsCategory(mods),
  }
}

function sumDamageCategories(
  mods: ActiveMods,
  categories: Map<string, Statuseffectcategories>
): Record<DamageType, ModifierResult> {
  return {
    Acid: sumCategory('ABSAcid', mods, categories),
    Arcane: sumCategory('ABSArcane', mods, categories),
    Corruption: sumCategory('ABSCorruption', mods, categories),
    Fire: sumCategory('ABSFire', mods, categories),
    Ice: sumCategory('ABSIce', mods, categories),
    Lightning: sumCategory('ABSLightning', mods, categories),
    Nature: sumCategory('ABSNature', mods, categories),
    Siege: sumCategory('ABSSiege', mods, categories),
    Slash: sumCategory('ABSSlash', mods, categories),
    Standard: sumCategory('ABSStandard', mods, categories),
    Strike: sumCategory('ABSStrike', mods, categories),
    Thrust: sumCategory('ABSThrust', mods, categories),
  } as Record<DamageType, ModifierResult>
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
