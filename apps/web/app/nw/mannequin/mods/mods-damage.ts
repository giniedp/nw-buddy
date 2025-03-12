import { getDamageTypesOfCategory, hasAffixDamageConversion, isItemOfAnyClass } from '@nw-data/common'
import { DamageData, ItemClass, ArenaBalanceData } from '@nw-data/generated'

import { humanize } from '~/utils'
import { eachModifier, modifierAdd, ModifierKey, modifierResult } from '../modifier'
import { ActiveMods, ActiveWeapon, DbSlice, MannequinState } from '../types'
import { byDamageType } from './by-damage-type'

export function selectModBaseDamage(mods: ActiveMods, attack: DamageData, weapon: ActiveWeapon) {
  return {
    Base: byDamageType((type) => sumCategory('BaseDamage', mods, type)),
    Reduction: byDamageType((type) => sumCategory('BaseDamageReduction', mods, type)),
    Weapon: {
      Damage: sumCategory('BaseDamage', mods, attack?.DamageType),
      Type: attack?.DamageType,
      Coef: attack?.DmgCoef,
    },
    Affix: selectModBaseDamageConversion(mods, weapon),
  }
}

function selectModBaseDamageConversion(mods: ActiveMods, { weapon }: ActiveWeapon) {
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
  let balance: Array<Pick<ArenaBalanceData, 'BalanceCategory' | 'BalanceTarget' | 'WeaponBaseDamageAdjustment'>> = []
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

export function selectDamageCoef(attack: DamageData) {
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
