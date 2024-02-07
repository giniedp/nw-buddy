import { eachModifier, modifierAdd, ModifierResult, modifierSum } from '../modifier'
import { ActiveMods, DbSlice, MannequinState } from '../types'
import { selectPhysicalRatingBase } from './armoring'

export function selectModMaxHealth(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  // HINT: 856 base value is from vitals.json "VitalsID": "Player"
  const healthFromLevel = 856 + 1.75 * Math.pow(state.level - 1, 2)
  const healthFromConst = mods.attributes.con.health

  const result: ModifierResult = {
    value: 0,
    source: [],
  }
  modifierAdd(result, {
    value: healthFromLevel,
    scale: 1,
    source: { label: 'Level' },
  })
  modifierAdd(result, {
    value: healthFromConst,
    scale: 1,
    source: { label: 'Constitution' },
  })

  for (const { value, scale, source } of eachModifier<number>('MaxHealth', mods)) {
    modifierAdd(result, {
      value: value * (healthFromLevel + healthFromConst),
      scale: scale,
      source: source,
    })
  }

  for (const { value, scale, source } of eachModifier<number>('MaxHealthMod', mods)) {
    modifierAdd(result, {
      value: value * (healthFromLevel + healthFromConst),
      scale: scale,
      source: source,
    })
  }

  const physicalRating = selectPhysicalRatingBase(db, state).value
  const physicalBonus = modifierSum('PhysicalArmor', mods).value
  for (const { value, scale, source } of eachModifier<number>('PhysicalArmorMaxHealthMod', mods)) {
    modifierAdd(result, {
      value: value * physicalRating * (1 + physicalBonus),
      scale: scale,
      source: source,
    })
  }

  return result
}
