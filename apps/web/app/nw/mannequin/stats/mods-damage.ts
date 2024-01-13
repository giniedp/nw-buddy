import {
  calculateDamage,
  damageScaleAttrs,
  getDamageTypesOfCategory,
  getItemIconPath,
  hasAffixDamageConversion,
  isItemOfAnyClass,
} from '@nw-data/common'
import { Damagetable, ItemClass, ItemDefinitionMaster, PvpbalanceArena } from '@nw-data/generated'

import { humanize } from '~/utils'
import { eachModifier, modifierAdd, ModifierKey, modifierResult, modifierSum } from '../modifier'
import { ActiveMods, ActiveWeapon, DbSlice, MannequinState } from '../types'

export function selectWeaponDamage(
  mods: ActiveMods,
  activeWeapon: ActiveWeapon,
  attack: Damagetable,
  equipLoad: number,
  db: DbSlice,
  state: MannequinState,
) {
  const { weapon, item, ammo, gearScore } = activeWeapon

  const convertPerk = mods.perks.find(
    (it) => hasAffixDamageConversion(it.affix) && it.weapon?.WeaponID === weapon?.WeaponID,
  )
  const convertAffix = convertPerk?.affix
  const convertPercent = convertAffix?.DamagePercentage || 0

  const damageCoef = modifierResult({
    value: attack.DmgCoef,
    scale: 1,
    source: { label: humanize(attack.DamageID) },
  })
  const modAmmo = ammo
    ? modifierResult({
        value: ammo.DamageModifier,
        scale: 1,
        source: { label: humanize(ammo.AmmoType) },
      })
    : null
  const modPvp = selectPvpBalance(item, db, state)
  const modCrit = selectCritMod(mods, activeWeapon, state)
  const modBase = sumCategory('BaseDamage', mods, attack.DamageType)
  const modBaseConvert = sumCategory('BaseDamage', mods, convertAffix?.DamageType)
  const modHeal = sumCategory('HealScalingValueMultiplier', mods, attack.DamageType)
  if (equipLoad < 13) {
    modifierAdd(modBase, { value: 0.2, scale: 1, source: { label: 'Light Equip Load' } })
    modifierAdd(modBaseConvert, { value: 0.2, scale: 1, source: { label: 'Light Equip Load' } })
    modifierAdd(modHeal, { value: 0.3, scale: 1, source: { label: 'Light Equip Load' } })
  } else if (equipLoad < 23) {
    modifierAdd(modBase, { value: 0.1, scale: 1, source: { label: 'Medium Equip Load' } })
    modifierAdd(modBaseConvert, { value: 0.1, scale: 1, source: { label: 'Medium Equip Load' } })
  } else {
    modifierAdd(modHeal, { value: -0.3, scale: 1, source: { label: 'Heavy Equip Load' } })
  }

  const damage = calculateDamage({
    attackerLevel: state.level,
    attackerIsPlayer: true,
    attackerGearScore: 0,
    attributes: {
      str: mods.attributes.str.scale,
      dex: mods.attributes.dex.scale,
      int: mods.attributes.int.scale,
      foc: mods.attributes.foc.scale,
      con: mods.attributes.con.scale,
    },

    preferHigherScaling: !!convertAffix?.PreferHigherScaling,
    convertPercent: convertPercent,
    convertScaling: damageScaleAttrs(convertAffix),

    weaponScaling: damageScaleAttrs(weapon),
    weaponGearScore: gearScore,
    baseDamage: weapon?.BaseDamage,
    damageCoef: damageCoef.value,

    modPvp: modPvp?.value || 0,
    modAmmo: modAmmo?.value || 0,
    modBase: modBase.value,
    modBaseConvert: modBaseConvert.value,
    modCrit: modCrit.value,
    modEmpower: 0,
    modEmpowerConvert: 0,

    armorPenetration: 0,
    defenderLevel: 0,
    defenderGearScore: 0,
    defenderIsPlayer: false,
    defenderRatingWeapon: 0,
    defenderRatingConvert: 0,
    defenderABSWeapon: 0,
    defenderABSConvert: 0,
    defenderWKNWeapon: 0,
    defenderWKNConvert: 0,
  })

  return {
    Result: damage,
    //
    DamageCoef: damageCoef,
    DamageType: attack.DamageType,
    //
    ConvertPercent: convertPercent,
    ConvertAffix: convertAffix,
    ConvertType: convertAffix?.DamageType,
    //
    ModHeal: modHeal,
    ModBase: modBase,
    ModBaseConvert: modBaseConvert,
    ModCrit: modCrit,
    ModAmmo: modAmmo,
    ModPvp: modPvp,
  }
}

function selectPvpBalance(item: ItemDefinitionMaster, db: DbSlice, state: MannequinState) {
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

export function selectDamageMods(mods: ActiveMods, weapon: ActiveWeapon, state: MannequinState) {
  return {
    Threat: modifierSum('ThreatDamage', mods),

    Crit: selectCritMod(mods, weapon, state),
    CritChance: selectCritChanceMod(mods, weapon, state),
    Headshot: modifierSum('HeadshotDamage', mods),
    Backstab: modifierSum('HitFromBehindDamage', mods),

    StaggerDamage: modifierSum('StaggerDamage', mods),

    BaseReduction: modifierSum('BaseDamageReduction', mods),
    CritReduction: modifierSum('CritDamageReduction', mods),
    StaggerDamageReduction: modifierSum('StaggerDamageReduction', mods),

    ArmorPenetration: modifierSum('ArmorPenetration', mods),
    ArmorPenetrationBack: modifierSum('HitFromBehindArmorPenetration', mods),
    ArmorPenetrationHead: modifierSum('HeadshotArmorPenetration', mods),
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

function selectCritMod(mods: ActiveMods, { weapon, item }: ActiveWeapon, state: MannequinState) {
  const critDamage = modifierResult()
  if (weapon?.CritDamageMultiplier > 1) {
    modifierAdd(critDamage, {
      value: weapon.CritDamageMultiplier - 1,
      scale: 1,
      source: { label: 'Weapon Stat', icon: getItemIconPath(item) },
    })
  }
  for (const mod of eachModifier<number>('CritDamage', mods)) {
    modifierAdd(critDamage, mod)
  }
  return critDamage
}

function selectCritChanceMod(mods: ActiveMods, { weapon, item }: ActiveWeapon, state: MannequinState) {
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
