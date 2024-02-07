import { getItemIconPath } from '@nw-data/common'
import { eachModifier, modifierAdd, modifierResult, modifierSum } from '../modifier'
import { ActiveMods, ActiveWeapon } from '../types'

export function selectModsCrit(mods: ActiveMods, weapon: ActiveWeapon) {
  return {
    Chance: selectCritChanceMod(mods, weapon),
    Damage: selectCritMod(mods, weapon),
    HeadshotDamage: modifierSum('HeadshotDamage', mods),
    HitFromBehindDamage: modifierSum('HitFromBehindDamage', mods),
    DamageReduction: modifierSum('CritDamageReduction', mods)
  } as const
}

function selectCritMod(mods: ActiveMods, { weapon, item }: ActiveWeapon) {
  const result = modifierResult()
  if (weapon?.CritDamageMultiplier > 1) {
    modifierAdd(result, {
      value: weapon.CritDamageMultiplier - 1,
      scale: 1,
      source: { label: 'Weapon Stat', icon: getItemIconPath(item) },
    })
  }
  for (const mod of eachModifier<number>('CritDamage', mods)) {
    modifierAdd(result, mod)
  }
  return result
}

function selectCritChanceMod(mods: ActiveMods, { weapon, item }: ActiveWeapon) {
  const critChance = modifierResult()
  if (weapon?.CritChance) {
    modifierAdd(critChance, {
      value: weapon.CritChance,
      scale: 1,
      source: { label: 'Weapon Stat', icon: getItemIconPath(item) },
    })
  }
  for (const mod of eachModifier<number>('CritChance', mods)) {
    modifierAdd(critChance, mod)
  }
  for (const mod of eachModifier<number>('CritChanceModifier', mods)) {
    // fromt status effect ()
    modifierAdd(critChance, mod)
  }
  return critChance
}
