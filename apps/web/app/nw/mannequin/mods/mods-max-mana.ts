import { ModifierResult, eachModifier, modifierAdd } from '../modifier'
import { ActiveMods } from '../types'

export function selectModMaxMana(mods: ActiveMods) {
  const result: ModifierResult = {
    value: 0,
    source: [],
  }
  const base = 100
  modifierAdd(result, {
    value: base,
    scale: 1,
    source: { label: 'Base' },
  })
  for (const { value, scale, source } of eachModifier<number>('MaxMana', mods)) {
    modifierAdd(result, {
      value: base * value,
      scale: scale,
      source,
    })
  }
  // HINT: currently there are no perks giving MaxManaMod
  for (const { value, scale, source } of eachModifier<number>('MaxManaMod', mods)) {
    modifierAdd(result, {
      value: base * value,
      scale: scale,
      source,
    })
  }
  return result
}
