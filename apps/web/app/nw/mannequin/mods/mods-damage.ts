import { getDamageTypesOfCategory, hasAffixDamageConversion, isItemOfAnyClass } from '@nw-data/common'
import { Damagetable, ItemClass, PvpbalanceArena } from '@nw-data/generated'

import { humanize } from '~/utils'
import { eachModifier, modifierAdd, ModifierKey, modifierResult } from '../modifier'
import { ActiveMods, ActiveWeapon, DbSlice, MannequinState } from '../types'

export function selectModBaseDamage(mods: ActiveMods, attack: Damagetable) {
  return {
    Damage: sumCategory('BaseDamage', mods, attack?.DamageType),
    Type: attack?.DamageType,
    Coef: attack?.DmgCoef,
  }
}

export function selectModBaseDamageConversion(mods: ActiveMods, { weapon }: ActiveWeapon) {
  const perk = mods.perks.find((it) => hasAffixDamageConversion(it.affix) && it.weapon?.WeaponID === weapon?.WeaponID)
  const affix = perk?.affix
  const percent = affix?.DamagePercentage || 0
  return {
    Damage: sumCategory('BaseDamage', mods, affix?.DamageType),
    Type: affix?.DamageType ?? null,
    Percent: percent,
    Affix: affix,
  }
}

function sumCategory(key: ModifierKey<number>, mods: ActiveMods, type: string) {
  const result = modifierResult()
  if (!type) {
    return result
  }
  for (const mod of eachModifier(key, mods)) {
    let types: string[]
    if (mod.source.ability?.DamageTypes?.length) {
      types = mod.source.ability?.DamageTypes
    } else if (mod.source.ability?.DamageCategory) {
      types = getDamageTypesOfCategory(mod.source.ability?.DamageCategory)
    } else {
      types = [type]
    }
    for (const t of types) {
      if (t === type) {
        modifierAdd(result, mod)
      }
    }
  }
  return result
}

export function selectPvpBalance(db: DbSlice, state: MannequinState, { item }: ActiveWeapon) {
  let balance: Array<Pick<PvpbalanceArena, 'BalanceCategory' | 'BalanceTarget' | 'WeaponBaseDamageAdjustment'>> = []
  let source: string
  if (state.combatMode === 'pvpArena') {
    balance = db.pvpBalanceArena
    source = 'PvP Arena'
  }
  if (state.combatMode === 'pvpOpenworld') {
    balance = db.pvpBalanceOpenworld
    source = 'PvP Open World'
  }
  if (state.combatMode === 'pvpWar') {
    balance = db.pvpBalanceWar
    source = 'PvP War'
  }
  if (state.combatMode === 'pvpOutpostrush') {
    balance = db.pvpBalanceOutpostrush
    source = 'PvP Outpost Rush'
  }

  const balanceRow = balance.find(
    (it) => it.BalanceCategory === 'ItemClass' && isItemOfAnyClass(item, [it.BalanceTarget as ItemClass]),
  )
  if (!balanceRow) {
    return null
  }

  return modifierResult({
    value: balanceRow.WeaponBaseDamageAdjustment,
    scale: 1,
    source: { label: source },
  })
}

export function selectDamageCoef(attack: Damagetable) {
  const result = modifierResult()
  if (attack) {
    modifierAdd(result, {
      value: attack.DmgCoef,
      scale: 1,
      source: { label: humanize(attack.DamageID) },
    })
  }
  return result
}

export function selectModAmmo({ ammo }: ActiveWeapon) {
  const result = modifierResult()
  if (ammo) {
    modifierAdd(result, {
      value: ammo.DamageModifier,
      scale: 1,
      source: { label: humanize(ammo.AmmoType) },
    })
  }
  return result
}

// export function selectModsDamage(
//   mods: ActiveMods,
//   activeWeapon: ActiveWeapon,
//   attack: Damagetable,
//   equipLoad: number,
//   db: DbSlice,
//   state: MannequinState,
// ) {
//   const conversion = selectConversion(mods, activeWeapon)

//   //const modHeal = sumCategory('HealScalingValueMultiplier', mods, attack?.DamageType)

//   // const damage = calculateDamage({
//   //   attackerLevel: state.level,
//   //   attackerIsPlayer: true,
//   //   attackerGearScore: 0,
//   //   attributes: {
//   //     str: mods.attributes.str.scale,
//   //     dex: mods.attributes.dex.scale,
//   //     int: mods.attributes.int.scale,
//   //     foc: mods.attributes.foc.scale,
//   //     con: mods.attributes.con.scale,
//   //   },

//   //   preferHigherScaling: !!convertAffix?.PreferHigherScaling,
//   //   convertPercent: convertPercent,
//   //   convertScaling: damageScaleAttrs(convertAffix),

//   //   weaponScaling: damageScaleAttrs(weapon),
//   //   weaponGearScore: gearScore,
//   //   baseDamage: weapon?.BaseDamage,
//   //   damageCoef: damageCoef.value,

//   //   modPvp: modPvp?.value || 0,
//   //   modAmmo: modAmmo?.value || 0,
//   //   modBase: modBase.value,
//   //   modBaseConvert: modBaseConvert.value,
//   //   modCrit: modCrit.value,
//   //   modEmpower: 0,
//   //   modEmpowerConvert: 0,

//   //   armorPenetration: 0,
//   //   defenderLevel: 0,
//   //   defenderGearScore: 0,
//   //   defenderIsPlayer: false,
//   //   defenderRatingWeapon: 0,
//   //   defenderRatingConvert: 0,
//   //   defenderABSWeapon: 0,
//   //   defenderABSConvert: 0,
//   //   defenderWKNWeapon: 0,
//   //   defenderWKNConvert: 0,
//   // })

//   return {
//     DamageCoef: selectDamageCoef(attack),

//     ModPvp: selectPvpBalance(db, state, activeWeapon),
//     ModAmmo: selectModAmmo(activeWeapon),

//     ModBase: {
//       Damage: sumCategory('BaseDamage', mods, attack?.DamageType),
//       Type: attack?.DamageType,
//     },
//     ModConverted: {
//       Damage: sumCategory('BaseDamage', mods, conversion?.affix?.DamageType),
//       Type: conversion.affix?.DamageType ?? null,
//       Percent: conversion.percent ?? 0,
//     },
//   }
// }
