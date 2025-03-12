import { getDamageTypes, getDamageTypesOfCategory } from '@nw-data/common'
import { ModifierKey, ModifierResult, eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveMods } from '../types'
import { DamageType } from '@nw-data/generated'

export function selectModsBaseDamage(mods: ActiveMods) {
  return sumDamageTypes('BaseDamage', mods)
}

function sumDamageTypes(key: ModifierKey<number>, mods: ActiveMods) {
  const result: Partial<Record<DamageType, ModifierResult>> = {}
  for (const mod of eachModifier(key, mods)) {
    let types: string[]
    if (mod.source.ability?.DamageTypes?.length) {
      types = mod.source.ability?.DamageTypes
    } else if (mod.source.ability?.DamageCategory) {
      types = getDamageTypesOfCategory(mod.source.ability?.DamageCategory)
    } else {
      types = getDamageTypes()
    }
    for (const type of types) {
      result[type] = result[type] || modifierResult()
      modifierAdd(result[type], mod)
    }
  }
  return result
}
