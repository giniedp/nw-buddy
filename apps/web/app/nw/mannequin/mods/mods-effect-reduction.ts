import { StatusEffectCategory } from '@nw-data/generated'
import { ModifierResult, ModifierValue, eachModifier } from '../modifier'
import { ActiveMods } from '../types'
import { categorySumFromList } from './category-sum'

export function selectModsEffectReduction(mods: ActiveMods): Partial<Record<StatusEffectCategory, ModifierResult>> {
  const result: Partial<Record<StatusEffectCategory, ModifierResult>> = {}
  const groups: Partial<Record<StatusEffectCategory, Array<ModifierValue<number>>>> = {}
  for (const mod of eachModifier<number>('StatusEffectDurationReduction', mods)) {
    if (mod.source?.ability?.StatusEffectDurationCats?.length) {
      for (const cat of mod.source.ability.StatusEffectDurationCats) {
        if (!groups[cat]) {
          groups[cat] = []
        }
        groups[cat].push(mod)
      }
    }
  }

  for (const mod of eachModifier<any>('EffectDurationMods', mods)) {
    if (mod.source?.effect?.EffectDurationMods?.length) {
      for (const entry of mod.source.effect.EffectDurationMods) {
        const [cat, value] = entry.split('=')
        if (!groups[cat]) {
          groups[cat] = []
        }
        groups[cat].push({
          ...mod,
          value: Number(value),
        })
      }
    }
  }

  for (const cat of Object.keys(groups) as Array<StatusEffectCategory>) {
    result[cat] = categorySumFromList({
      base: 0,
      modifiers: groups[cat]!,
      categoryLimit: () => null,
    })
  }

  return result
}
