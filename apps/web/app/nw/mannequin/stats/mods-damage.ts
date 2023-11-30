import {
  damageForWeapon,
  damageScaleAttrs,
  getDamageTypesOfCategory,
  getItemIconPath,
  isItemOfAnyClass,
} from '@nw-data/common'
import { Damagetable, ItemClass, ItemDefinitionMaster, PvpbalanceArena } from '@nw-data/generated'

import { eachModifier, modifierAdd, ModifierKey, modifierResult, modifierSum } from '../modifier'
import { ActiveMods, ActiveWeapon, DbSlice, MannequinState } from '../types'
import { humanize } from '~/utils'

export function selectWeaponDamage(
  mods: ActiveMods,
  activeWeapon: ActiveWeapon,
  attack: Damagetable,
  equipLoad: number,
  db: DbSlice,
  state: MannequinState
) {
  const { weapon, item, ammo, gearScore } = activeWeapon

  const pvpBalance = selectPvpBalance(item, db, state)
  const splitAffix = mods.perks.find(
    (it) => it.affix?.DamagePercentage && it.weapon?.WeaponID === weapon?.WeaponID
  )?.affix
  const percentAffix = splitAffix?.DamagePercentage || 0
  const percentWeapon = 1 - percentAffix

  let scaleAffix = damageScaleAttrs(splitAffix)
  let scaleWeapon = damageScaleAttrs(weapon)
  const attrSums = {
    str: mods.attributes.str.scale,
    dex: mods.attributes.dex.scale,
    int: mods.attributes.int.scale,
    foc: mods.attributes.foc.scale,
    con: mods.attributes.con.scale,
  }

  // modifierAdd(baseDamageMod, {
  //   value: pvpBalance?.value || 0,
  //   scale: 1,
  //   source: {
  //     label: 'PvP Balance'
  //   }
  // })
  // modifierAdd(convertDamageMod, {
  //   value: pvpBalance?.value || 0,
  //   scale: 1,
  //   source: {
  //     label: 'PvP Balance'
  //   }
  // })

  const critMod = selectCritMod(mods, activeWeapon, state)
  const mainDamageMod = sumCategory('BaseDamage', mods, attack.DamageType)
  const affixDamageMod = sumCategory('BaseDamage', mods, splitAffix?.DamageType)
  const healMod = sumCategory('HealScalingValueMultiplier', mods, attack.DamageType)
  if (equipLoad < 13) {
    modifierAdd(mainDamageMod, { value: 0.2, scale: 1, source: { label: 'Light Equip Load' } })
    modifierAdd(affixDamageMod, { value: 0.2, scale: 1, source: { label: 'Light Equip Load' } })
    modifierAdd(healMod, { value: 0.3, scale: 1, source: { label: 'Light Equip Load' } })
  } else if (equipLoad < 23) {
    modifierAdd(mainDamageMod, { value: 0.1, scale: 1, source: { label: 'Medium Equip Load' } })
    modifierAdd(affixDamageMod, { value: 0.1, scale: 1, source: { label: 'Medium Equip Load' } })
  } else {
    modifierAdd(healMod, { value: -0.3, scale: 1, source: { label: 'Heavy Equip Load' } })
  }

  // console.debug('calc main damage')
  const mainDamage = damageForWeapon({
    playerLevel: state.level,
    weaponBaseDamage: weapon?.BaseDamage,
    weaponGearScore: gearScore,
    weaponScale: scaleWeapon,
    attrSums: attrSums,
    dmgCoef: attack?.DmgCoef,
  })
  // console.debug('calc elem damage')
  const elemDamage = damageForWeapon({
    playerLevel: state.level,
    weaponBaseDamage: weapon?.BaseDamage,
    weaponGearScore: gearScore,
    weaponScale: scaleAffix,
    attrSums: attrSums,
    dmgCoef: attack?.DmgCoef,
  })

  if (elemDamage > mainDamage) {
    // console.debug('use element scaling')
    // TODO: uncomment for next PTR
    // scaleWeapon = scaleAffix
  } else {
    // console.debug('use main scaling')
    scaleAffix = scaleWeapon
  }

  // console.debug('calc main damage (mods)')
  const mainDamageStandard = damageForWeapon({
    playerLevel: state.level,
    weaponBaseDamage: weapon?.BaseDamage,
    weaponGearScore: gearScore,
    weaponScale: scaleWeapon,
    attrSums: attrSums,
    dmgCoef: attack?.DmgCoef,
    dmgMod: mainDamageMod.value,
  })

  // console.debug('calc elem damage (mods)')
  const elemDamageStandard = damageForWeapon({
    playerLevel: state.level,
    weaponBaseDamage: weapon?.BaseDamage,
    weaponGearScore: gearScore,
    weaponScale: scaleAffix,
    attrSums: attrSums,
    dmgCoef: attack?.DmgCoef,
    dmgMod: affixDamageMod.value,
  })

  // console.debug('calc main damage (mods + crits)')
  const mainDamageCrit = damageForWeapon({
    playerLevel: state.level,
    weaponBaseDamage: weapon?.BaseDamage,
    weaponGearScore: gearScore,
    weaponScale: scaleWeapon,
    attrSums: attrSums,
    dmgCoef: attack?.DmgCoef,
    dmgMod: mainDamageMod.value,
    critMod: critMod.value,
  })

  // console.debug('calc elem damage (mods + crits)')
  const elemDamageCrit = damageForWeapon({
    playerLevel: state.level,
    weaponBaseDamage: weapon?.BaseDamage,
    weaponGearScore: gearScore,
    weaponScale: scaleAffix,
    attrSums: attrSums,
    dmgCoef: attack?.DmgCoef,
    dmgMod: affixDamageMod.value,
    critMod: critMod.value,
  })

  return {
    MainDamageType: attack.DamageType,
    MainDamage: mainDamage * percentWeapon,
    MainDamageStandard: mainDamageStandard * percentWeapon,
    MainDamageCrit: mainDamageCrit * percentWeapon,
    //
    ElemDamageType: splitAffix?.DamageType,
    ElemDamage: elemDamage * percentAffix,
    ElemDamageStandard: elemDamageStandard * percentAffix,
    ElemDamageCrit: elemDamageCrit * percentAffix,
    //
    HealMod: healMod,
    MainDamageMod: mainDamageMod,
    ElemDamageMod: affixDamageMod,
    DamageCoef: modifierResult({
      value: attack.DmgCoef,
      scale: 1,
      source: { label: humanize(attack.DamageID) },
    }),
    DamageCoefAmmo: ammo
      ? modifierResult({
          value: ammo.DamageModifier,
          scale: 1,
          source: { label: humanize(ammo.AmmoType)  },
        })
      : null,
    DamagePvpBalance: pvpBalance,
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
    (it) => it.BalanceCategory === 'ItemClass' && isItemOfAnyClass(item, [it.BalanceTarget as ItemClass])
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
