import { ModifierResult, eachModifier, modifierAdd } from '../modifier'
import { ActiveMods } from '../types'

export function selectModMaxStamina(mods: ActiveMods) {
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
  for (const { value, scale, source } of eachModifier<number>('MaxStaminaMod', mods)) {
    modifierAdd(result, {
      value: base * value,
      scale: scale,
      source,
    })
  }
  return result
}
