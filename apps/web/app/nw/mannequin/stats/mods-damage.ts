import {
  damageFactorForAttrs,
  damageFactorForGS,
  damageFactorForLevel,
  damageScaleAttrs,
  getDamageTypesOfCategory,
  getItemIconPath,
  isItemOfAnyClass,
} from '@nw-data/common'
import { Damagetable, ItemClass, ItemDefinitionMaster, PvpbalanceArena } from '@nw-data/generated'

import { eachModifier, modifierAdd, ModifierKey, modifierResult, modifierSum } from '../modifier'
import { ActiveMods, ActiveWeapon, DbSlice, MannequinState } from '../types'

export function selectWeaponDamage(
  mods: ActiveMods,
  { item, weapon, ammo, gearScore }: ActiveWeapon,
  attack: Damagetable,
  equipLoad: number,
  db: DbSlice,
  state: MannequinState
) {
  const pvpBalance = selectPvpBalance(item, db, state)
  const split = mods.perks.find((it) => it.affix?.DamagePercentage && it.weapon?.WeaponID === weapon?.WeaponID)
  const scale = 1 - (split?.affix?.DamagePercentage || 0)
  const base = (weapon?.BaseDamage || 0) * damageFactorForGS(gearScore)
  const scaleLevel = damageFactorForLevel(state.level)
  const scaleAttrs = damageFactorForAttrs({
    weapon: damageScaleAttrs(weapon),
    attrSums: {
      str: mods.attributes.str.scale,
      dex: mods.attributes.dex.scale,
      int: mods.attributes.int.scale,
      foc: mods.attributes.foc.scale,
      con: mods.attributes.con.scale,
    },
  })

  const mainDamage = modifierResult()
  modifierAdd(mainDamage, { value: base * scale, scale: 1, source: { label: 'GS Base Damage' } })
  modifierAdd(mainDamage, {
    value: base * scale,
    scale: scaleLevel,
    source: { label: `Level (x${scaleLevel.toFixed(3)})` },
  })
  modifierAdd(mainDamage, {
    value: base * scale,
    scale: scaleAttrs,
    source: { label: `Attributes (x${scaleAttrs.toFixed(3)})` },
  })
  const convertDamage = modifierResult()

  if (split) {
    const scale = split.affix.DamagePercentage
    const scaleSplit = damageFactorForAttrs({
      weapon: damageScaleAttrs(split.affix),
      attrSums: {
        str: mods.attributes.str.scale,
        dex: mods.attributes.dex.scale,
        int: mods.attributes.int.scale,
        foc: mods.attributes.foc.scale,
        con: 0,
      },
    })

    modifierAdd(convertDamage, { value: base * scale, scale: 1, source: { label: 'GS Base Damage' } })
    modifierAdd(convertDamage, {
      value: base * scale,
      scale: scaleLevel,
      source: { label: `Level (x${scaleLevel.toFixed(3)})` },
    })

    if (split.affix.PreferHigherScaling && scaleSplit > scaleAttrs) {
      modifierAdd(convertDamage, {
        value: base * scale,
        scale: scaleSplit,
        source: { label: `Attributes (x${scaleSplit.toFixed(3)} of Gem)` },
      })
    } else {
      modifierAdd(convertDamage, {
        value: base * scale,
        scale: scaleAttrs,
        source: { label: `Attributes (x${scaleAttrs.toFixed(3)})` },
      })
    }
  }
  const baseDamageMod = sumCategory('BaseDamage', mods, attack.DamageType)
  // modifierAdd(baseDamageMod, {
  //   value: pvpBalance?.value || 0,
  //   scale: 1,
  //   source: {
  //     label: 'PvP Balance'
  //   }
  // })

  const convertDamageMod = sumCategory('BaseDamage', mods, split?.affix?.DamageType)
  // modifierAdd(convertDamageMod, {
  //   value: pvpBalance?.value || 0,
  //   scale: 1,
  //   source: {
  //     label: 'PvP Balance'
  //   }
  // })

  const healMod = sumCategory('HealScalingValueMultiplier', mods, attack.DamageType)
  if (equipLoad < 13) {
    modifierAdd(baseDamageMod, { value: 0.2, scale: 1, source: { label: 'Light Equip Load' } })
    modifierAdd(healMod, { value: 0.3, scale: 1, source: { label: 'Light Equip Load' } })
  } else if (equipLoad < 23) {
    modifierAdd(baseDamageMod, { value: 0.1, scale: 1, source: { label: 'Medium Equip Load' } })
  } else {
    modifierAdd(healMod, { value: -0.3, scale: 1, source: { label: 'Heavy Equip Load' } })
  }

  return {
    BaseDamage: mainDamage,
    BaseDamageType: attack.DamageType,
    BaseDamageMod: baseDamageMod,
    ConvertedDamage: convertDamage,
    ConvertedDamageType: split?.affix?.DamageType,
    ConvertedDamageMod: convertDamageMod,
    HealMod: healMod,

    DamageCoef: modifierResult({
      value: attack.DmgCoef,
      scale: 1,
      source: { label: 'Attack Stat' },
    }),
    DamageCoefAmmo: ammo
      ? modifierResult({
          value: ammo.DamageModifier,
          scale: 1,
          source: { label: 'Ammo Stat' },
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
    ChritChance: selectCritChanceMod(mods, weapon, state),
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
