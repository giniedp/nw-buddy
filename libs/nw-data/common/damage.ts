import { ItemdefinitionsWeapons, WeaponTag } from '@nw-data/generated'
import type { AttributeRef } from './attributes'
import {
  NW_ARMOR_SET_RATING_EXPONENT,
  NW_BASE_DAMAGE_COMPOUND_INCREASE,
  NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL,
  NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER,
  NW_DIMINISHING_GEAR_SCORE_THRESHOLD,
  NW_LEVEL_DAMAGE_MULTIPLIER,
  NW_MAX_ARMOR_MITIGATION,
  NW_MIN_ARMOR_MITIGATION,
  NW_MIN_GEAR_SCORE,
  NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE,
} from './constants'

export function damageFactorForLevel(level: number) {
  return NW_LEVEL_DAMAGE_MULTIPLIER * (level - 1)
}

export function damageFactorForGS(gearScore: number) {
  const gsMin = NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE
  const gsMax = NW_DIMINISHING_GEAR_SCORE_THRESHOLD
  const gsRounding = NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL
  const baseDamageCompund = NW_BASE_DAMAGE_COMPOUND_INCREASE
  const compoundDiminishingMulti = NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER

  const powerLow = Math.floor((Math.min(gsMax, Math.max(gearScore, gsMin)) - gsMin) / gsRounding)
  const powerHigh = Math.floor((Math.max(gearScore, gsMax) - gsMax) / gsRounding)

  const factorLow = Math.pow(1 + baseDamageCompund, powerLow)
  const factorHigh = Math.pow(1 + baseDamageCompund * compoundDiminishingMulti, powerHigh)

  return factorLow * factorHigh
}

export function damageScaleAttrs(
  weapon: Pick<ItemdefinitionsWeapons, 'ScalingDexterity' | 'ScalingStrength' | 'ScalingIntelligence' | 'ScalingFocus'>,
): Record<AttributeRef, number> {
  return {
    str: weapon?.ScalingStrength || 0,
    dex: weapon?.ScalingDexterity || 0,
    int: weapon?.ScalingIntelligence || 0,
    foc: weapon?.ScalingFocus || 0,
    con: 0,
  }
}

export function damageFactorForAttrs({
  weapon,
  attributes,
}: {
  weapon: Record<AttributeRef, number>
  attributes: Record<AttributeRef, number>
}) {
  const str = (attributes.str || 0) * (weapon?.str || 0)
  const dex = (attributes.dex || 0) * (weapon?.dex || 0)
  const int = (attributes.int || 0) * (weapon?.int || 0)
  const foc = (attributes.foc || 0) * (weapon?.foc || 0)
  return str + dex + int + foc
}

const WEAPON_COEF_FOR_TIP = {
  Heal: 1.07,
  Greatsword: 0.9,
  Blunderbuss: 1.38, // 6 x 0.23
}

export function damageCoefForWeaponTag(tag: string) {
  return WEAPON_COEF_FOR_TIP[tag] || 1
}

export function damageForTooltip({
  playerLevel,
  gearScore,
  weapon,
  weaponScale,
  attrSums,
}: {
  playerLevel: number
  gearScore: number
  weapon: ItemdefinitionsWeapons
  weaponScale?: Record<AttributeRef, number>
  attrSums: Record<AttributeRef, number>
}) {
  return damageForWeapon({
    playerLevel,
    baseDamage: weapon.BaseDamage,
    weaponGearScore: gearScore,
    weaponScale: weaponScale || damageScaleAttrs(weapon),
    attributes: attrSums,
    damageCoef: damageCoefForWeaponTag(getWeaponTagFromWeapon(weapon)),
  })
}

export function damageForWeapon(options: {
  playerLevel: number
  baseDamage: number
  weaponGearScore: number
  weaponScale: Record<AttributeRef, number>
  attributes: Record<AttributeRef, number>
  damageCoef: number
  pvpMod?: number
  ammoMod?: number
  baseMod?: number
  critMod?: number
  empowerMod?: number
  absMod?: number
  wknMod?: number
}) {
  const baseDamage = options.baseDamage ?? 0
  const damageCoef = options.damageCoef ?? 1

  const factorFromGS = damageFactorForGS(options.weaponGearScore) ?? 1
  const levelScaling = damageFactorForLevel(options.playerLevel) ?? 0
  const statsScaling =
    damageFactorForAttrs({
      weapon: options.weaponScale,
      attributes: options.attributes,
    }) ?? 0
  const pvpMod = options.pvpMod ?? 0
  const ammoMod = options.ammoMod ?? 0
  const baseMod = options.baseMod ?? 0
  const critMod = options.critMod ?? 0
  const empowerMod = options.empowerMod ?? 0
  const absMod = options.absMod ?? 0
  const wknMod = options.wknMod ?? 0

  const result =
    baseDamage *
    damageCoef *
    factorFromGS *
    (1 + pvpMod) *
    (1 + levelScaling + statsScaling) *
    (1 + ammoMod) *
    (1 + baseMod + critMod) *
    (1 + empowerMod) *
    // defender
    (1 - absMod) *
    (1 + wknMod)

  // console.table({
  //   dmgBase,
  //   dmgCoef,
  //   factorFromGS,
  //   levelScaling,
  //   statsScaling,
  //   ammoMod,
  //   dmgMod,
  //   critMod,
  //   empowerMod,
  // })
  // console.debug('damageForWeapon', result)
  return result
}

export function armorSetRating(gearScore: number) {
  return Math.pow(gearScore, NW_ARMOR_SET_RATING_EXPONENT)
}

export function armorRating(options: { gearScore: number; mitigation: number }) {
  const x = armorSetRating(options.gearScore)
  const y = options.mitigation
  return Math.floor((x * y) / (1 - y))
}

export function armorMitigation(options: { gearScore: number; rating: number }) {
  const x = armorSetRating(options.gearScore)
  const y = options.rating
  return Math.min(NW_MAX_ARMOR_MITIGATION, Math.max(NW_MIN_ARMOR_MITIGATION, y / (x + y)))
}

export function damageMitigationPercent(options: { gearScore: number; armorRating: number; armorPenetration: number }) {
  const mitigation = armorMitigation({
    gearScore: options.gearScore,
    rating: options.armorRating,
  })
  return Math.min(1, Math.max(0, mitigation - options.armorPenetration))
}

export function pvpGearScore(options: {
  weaponGearScore: number
  attackerAvgGearScore: number
  defenderAvgGearScore: number
}) {
  const gearScore = options.weaponGearScore + options.defenderAvgGearScore - options.attackerAvgGearScore
  return Math.max(NW_MIN_GEAR_SCORE, gearScore)
}

export function calculateDamage(options: {
  attackerLevel: number
  attackerGearScore: number
  attackerIsPlayer: boolean
  attributes: Record<AttributeRef, number>

  preferHigherScaling: boolean
  convertPercent: number
  convertScaling: Record<AttributeRef, number>

  weaponScaling: Record<AttributeRef, number>
  weaponGearScore: number
  baseDamage: number
  damageCoef: number

  modPvp: number
  modAmmo: number
  modBase: number
  modBaseConvert: number
  modCrit: number
  modEmpower: number
  modEmpowerConvert: number

  armorPenetration: number
  defenderLevel: number
  defenderGearScore: number
  defenderIsPlayer: boolean
  defenderRatingWeapon: number
  defenderRatingConvert: number
  defenderABSWeapon: number
  defenderABSConvert: number
  defenderWKNWeapon: number
  defenderWKNConvert: number
}) {
  const attributes = options.attributes

  const convertPercent = options.convertPercent ?? 0
  const convertScale = damageFactorForAttrs({
    weapon: options.convertScaling,
    attributes: attributes,
  })

  const weaponPercent = 1 - convertPercent
  const weaponScale = damageFactorForAttrs({
    weapon: options.weaponScaling,
    attributes: attributes,
  })

  let convertScaling = options.convertScaling
  let weaponScaling = options.weaponScaling
  if (options.preferHigherScaling) {
    if (weaponScale > convertScale) {
      convertScaling = weaponScaling
    } else {
      weaponScaling = convertScaling
    }
  }

  const inputs = {
    playerLevel: options.attackerLevel,
    baseDamage: options.baseDamage,
    weaponGearScore: options.weaponGearScore,
    weaponScale: weaponScaling,
    attributes: attributes,
    damageCoef: options.damageCoef,
    pvpMod: options.modPvp,
    ammoMod: options.modAmmo,
    baseMod: options.modBase,
    critMod: options.modCrit,
    empowerMod: options.modEmpower,
    absMod: options.defenderABSWeapon,
    wknMod: options.defenderWKNWeapon,
  } satisfies Parameters<typeof damageForWeapon>[0]

  const weaponDamage =
    weaponPercent *
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
      critMod: 0,
    })
  const weaponDamageCrit =
    weaponPercent *
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
    })
  const weaponMitigated = damageMitigationPercent({
    armorPenetration: options.armorPenetration,
    armorRating: options.defenderRatingWeapon,
    gearScore: pvpGearScore({
      attackerAvgGearScore: options.attackerGearScore,
      defenderAvgGearScore: options.defenderGearScore,
      weaponGearScore: options.weaponGearScore,
    }),
  })

  const convertedDamage =
    convertPercent *
    damageForWeapon({
      ...inputs,
      weaponScale: convertScaling,
      critMod: 0,
      baseMod: options.modBaseConvert,
      empowerMod: options.modEmpowerConvert,
      absMod: options.defenderABSConvert,
      wknMod: options.defenderWKNConvert,
    })
  const convertedDamageCrit =
    convertPercent *
    damageForWeapon({
      ...inputs,
      weaponScale: convertScaling,
      baseMod: options.modBaseConvert,
      empowerMod: options.modEmpowerConvert,
      absMod: options.defenderABSConvert,
      wknMod: options.defenderWKNConvert,
    })
  const convertedMitigated = damageMitigationPercent({
    armorPenetration: options.armorPenetration,
    armorRating: options.defenderRatingConvert,
    gearScore: pvpGearScore({
      attackerAvgGearScore: options.attackerGearScore,
      defenderAvgGearScore: options.defenderGearScore,
      weaponGearScore: options.weaponGearScore,
    }),
  })

  const weapon = {
    std: weaponDamage,
    stdMitigated: weaponDamage * weaponMitigated,
    stdFinal: weaponDamage * (1 - weaponMitigated),

    crit: weaponDamageCrit,
    critMitigated: weaponDamageCrit * weaponMitigated,
    critFinal: weaponDamageCrit * (1 - weaponMitigated),
  }
  const converted = {
    std: convertedDamage,
    stdMitigated: convertedDamage * convertedMitigated,
    stdFinal: convertedDamage * (1 - convertedMitigated),

    crit: convertedDamageCrit,
    critMitigated: convertedDamageCrit * convertedMitigated,
    critFinal: convertedDamageCrit * (1 - convertedMitigated),
  }
  const total = {
    std: weapon.std + converted.std,
    stdMitigated: weapon.stdMitigated + converted.stdMitigated,
    stdFinal: weapon.stdFinal + converted.stdFinal,

    crit: weapon.crit + converted.crit,
    critMitigated: weapon.critMitigated + converted.critMitigated,
    critFinal: weapon.critFinal + converted.critFinal,
  }
  return {
    weapon,
    converted,
    total,
  }
}

const WEAPON_EFFECT_TO_TAG: Record<string, WeaponTag> = {
  Axe: 'Axe',
  Blunderbuss: 'Blunderbuss',
  Bow: 'Bow',
  Fire: 'Fire',
  FireStaff: 'Fire',
  GreatAxe: 'GreatAxe',
  Greatsword: 'Greatsword',
  GreatSword: 'Greatsword',
  Hatchet: 'Axe',
  Heal: 'Heal',
  Ice: 'Ice',
  IceGauntlet: 'Ice',
  LifeStaff: 'Heal',
  Musket: 'Rifle',
  Rapier: 'Rapier',
  Rifle: 'Rifle',
  Spear: 'Spear',
  Sword: 'Sword',
  VoidGauntlet: 'VoidGauntlet',
  Warhammer: 'Warhammer',
  Flail: 'Flail',
}

export function getWeaponTagFromWeapon(item: ItemdefinitionsWeapons | null): WeaponTag | null {
  return WEAPON_EFFECT_TO_TAG[item?.WeaponEffectId]
}

const WEAPON_TAG_TO_AMMO_TYPE: Partial<Record<WeaponTag, string>> = {
  Bow: 'Arrow',
  Blunderbuss: 'Shot',
  Rifle: 'Shot',
}

export function getAmmoTypeFromWeaponTag(weaponTag: WeaponTag) {
  return WEAPON_TAG_TO_AMMO_TYPE[weaponTag]
}
