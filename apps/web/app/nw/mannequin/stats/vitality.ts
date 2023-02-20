import { eachModifier, modifierAdd, ModifierResult, modifierSum } from '../modifier'
import { ActiveMods, DbSlice, MannequinState } from '../types'
import { selectPhysicalRatingBase } from './armoring'

export function selectMaxHealth(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  // HINT: 778 base value is from vitals.json "VitalsID": "Player"
  const healthFromLevel = 778 + 1.5 * Math.pow(state.level - 1, 2)
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

  const physicalRating = selectPhysicalRatingBase(db, mods, state).value
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

export function selectMaxMana(mods: ActiveMods) {
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
      source
    })
  }
  // HINT: currently there are no perks giving MaxManaMod
  for (const { value, scale, source } of eachModifier<number>('MaxManaMod', mods)) {
    modifierAdd(result, {
      value: base * value,
      scale: scale,
      source
    })
  }
  return result
}

export function selectMaxStamina(mods: ActiveMods) {
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
      source
    })
  }
  return result
}

export function selectLeeching(mods: ActiveMods) {
  return modifierSum('DmgPctToHealth', mods)
}
