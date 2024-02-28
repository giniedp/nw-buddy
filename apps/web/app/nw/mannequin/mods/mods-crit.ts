import { getItemIconPath } from '@nw-data/common'
import { ModifierKey, eachModifier, modifierAdd, modifierResult, modifierSum } from '../modifier'
import { ActiveMods, ActiveWeapon, CritType } from '../types'

export function selectModsCrit(mods: ActiveMods, weapon: ActiveWeapon, critType: CritType) {
  return {
    Chance: selectCritChanceMod(mods, weapon),
    Damage: selectCritMod(mods, weapon, critType),
    DamageReduction: modifierSum('CritDamageReduction', mods),
  } as const
}

function selectCritMod(mods: ActiveMods, { weapon, item }: ActiveWeapon, critType: CritType) {
  const result = modifierResult()
  if (weapon?.CritDamageMultiplier > 1) {
    modifierAdd(result, {
      value: weapon.CritDamageMultiplier - 1,
      scale: 1,
      source: { label: 'Weapon', icon: getItemIconPath(item) },
    })
  }
  let keys: ModifierKey<number>[] = []
  if (critType === 'crit') {
    keys = ['CritDamage']
  }
  if (critType === 'backstab') {
    keys = ['CritDamage', 'HitFromBehindDamage']
  }
  if (critType === 'headshot') {
    keys = ['CritDamage', 'HeadshotDamage']
  }
  if (keys.length) {
    const iterator = eachModifier<number>((it) => {
      if (!it) {
        return null
      }
      if ('key' in it) {
        return keys.includes(it.key) ? it.value : null
      }
      return Math.max(...keys.map((key) => it[key] || 0))
    }, mods)
    for (const mod of iterator) {
      modifierAdd(result, mod)
    }
  }
  return result
}

function selectCritChanceMod(mods: ActiveMods, { weapon, item }: ActiveWeapon) {
  const critChance = modifierResult()
  if (weapon?.CritChance) {
    modifierAdd(critChance, {
      value: weapon.CritChance,
      scale: 1,
      source: { label: 'Weapon', icon: getItemIconPath(item) },
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
