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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getDamageScalingForLevel(level: number) {
  return NW_LEVEL_DAMAGE_MULTIPLIER * (level - 1)
}

export function getDamageFactorForGearScore(gearScore: number) {
  gearScore = Math.floor(gearScore)
  const gsMin = NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE
  const gsMax = NW_DIMINISHING_GEAR_SCORE_THRESHOLD
  const gsRounding = NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL
  const baseDamageCompund = NW_BASE_DAMAGE_COMPOUND_INCREASE
  const compoundDiminishingMulti = NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER

  const powerLow = Math.floor((Math.min(gsMax, Math.max(gearScore, gsMin)) - gsMin) / gsRounding)
  const powerHigh = Math.floor((Math.max(gearScore, gsMax) - gsMax) / gsRounding)

  const factorLow = Math.pow(1 + baseDamageCompund, powerLow)
  const factorHigh = Math.pow(1 + baseDamageCompund * compoundDiminishingMulti, powerHigh)
  const result = factorLow * factorHigh
  // console.table({
  //   gearScore,
  //   powerLow,
  //   powerHigh,
  //   factorLow,
  //   factorHigh,
  //   damageFactorForGS: result,
  // })
  return result
}

export function getDamageScalingForWeapon(
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

export function getDamageScalingSumForWeapon({
  weapon,
  modifierSums,
}: {
  weapon: Record<AttributeRef, number>
  modifierSums: Record<AttributeRef, number>
}) {
  const str = (modifierSums.str || 0) * (weapon?.str || 0)
  const dex = (modifierSums.dex || 0) * (weapon?.dex || 0)
  const int = (modifierSums.int || 0) * (weapon?.int || 0)
  const foc = (modifierSums.foc || 0) * (weapon?.foc || 0)
  return str + dex + int + foc
}

const WEAPON_COEF_FOR_TIP = {
  Heal: 1.07,
  Greatsword: 0.9,
  Blunderbuss: 1.38, // 6 x 0.23
}

export function getDamageCoefForWeaponTag(tag: string) {
  return WEAPON_COEF_FOR_TIP[tag] || 1
}

export function getDamageForTooltip({
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
  return getDamageForWeapon({
    level: playerLevel,
    weaponDamage: weapon.BaseDamage,
    gearScore: gearScore,
    weaponScale: weaponScale || getDamageScalingForWeapon(weapon),
    modifierSums: attrSums,
    damageCoef: getDamageCoefForWeaponTag(getWeaponTagFromWeapon(weapon)),
  })
}

export function getDamageForWeapon(
  options: {
    level: number
    gearScore: number
    weaponDamage: number
    weaponScale: Record<AttributeRef, number>
    modifierSums: Record<AttributeRef, number>
    damageCoef: number
    damageAdd?: number
    modPvP?: number
    modAmmo?: number
    modBase?: number
    modCrit?: number
    modDMG?: number
    modABS?: number
    modWKN?: number
    reductionBase?: number
    reductionCrit?: number
    mitigation?: number
  },
  trace?: Tracer,
) {
  const baseDamage = options.weaponDamage ?? 0
  const damageCoef = options.damageCoef ?? 1
  const damageAdd = options.damageAdd ?? 0

  const factorFromGS = getDamageFactorForGearScore(options.gearScore) ?? 1
  const levelScaling = getDamageScalingForLevel(options.level) ?? 0
  const statsScaling =
    getDamageScalingSumForWeapon({
      weapon: options.weaponScale,
      modifierSums: options.modifierSums,
    }) ?? 0
  const modPvP = options.modPvP ?? 0
  const modAmmo = options.modAmmo ?? 0
  const modBase = Math.max(0, (options.modBase ?? 0) - (options.reductionBase ?? 0))
  const modCrit = Math.max(0, (options.modCrit ?? 0) - (options.reductionCrit ?? 0))
  const modDMG = options.modDMG ?? 0
  const modABS = options.modABS ?? 0
  const modWKN = options.modWKN ?? 0
  const mitigation = options.mitigation ?? 0

  const result =
    baseDamage *
      damageCoef *
      factorFromGS *
      (1 + modPvP) *
      (1 + levelScaling + statsScaling) *
      (1 + modAmmo) *
      (1 + modBase + modCrit) *
      (1 + modDMG) *
      (1 - modABS) *
      (1 + modWKN) *
      (1 - mitigation) +
    damageAdd

  trace?.log(`baseDamage                          | ${baseDamage}`)
  trace?.log(` * damageCoef                       |  * ${damageCoef}`)
  trace?.log(` * factorFromGS                     |  * ${factorFromGS}`)
  trace?.log(` * (1 + modPvP)                     |  * (1 + ${modPvP})`)
  trace?.log(` * (1 + levelScaling + statsScaling)|  * (1 + ${levelScaling} + ${statsScaling})`)
  trace?.log(` * (1 + modAmmo)                    |  * (1 + ${modAmmo})`)
  trace?.log(` * (1 + modBase + modCrit)          |  * (1 + ${modBase} + ${modCrit})`)
  trace?.log(` * (1 + modDMG)                     |  * (1 + ${modDMG})`)
  trace?.log(` * (1 - modABS)                     |  * (1 - ${modABS})`)
  trace?.log(` * (1 + modWKN)                     |  * (1 + ${modWKN})`)
  trace?.log(` * (1 - mitigation)                 |  * (1 - ${mitigation})`)
  trace?.log(` + damageAdd                        |  + ${damageAdd}`)
  trace?.log(`= ${result}`)
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

export function getArmorSetRating(gearScore: number, trace?: Tracer) {
  const result = Math.pow(gearScore, NW_ARMOR_SET_RATING_EXPONENT)
  trace?.log(`pow(gs, EXPONENT)`)
  trace?.log(`= pow(${gearScore}, ${NW_ARMOR_SET_RATING_EXPONENT})`)
  trace?.log(`= ${result}`)
  return result
}

export function getArmorRating(options: { gearScore: number; mitigation: number }) {
  const x = getArmorSetRating(options.gearScore)
  const y = options.mitigation
  return Math.floor((x * y) / (1 - y))
}

export function getArmorMitigation(options: { gearScore: number; armorRating: number }, trace?: Tracer) {
  // 1 / (1 + ARMORRATING*(1+MIN(MAX(FORT-REND,-0.7),2)) / (WeaponGS+DefendersAverageGS-AttackersAvgGS)^1.2)
  // 1 / (1 + FINAL_ARMOR_RATING) / SET_RATING

  //      1 / (1 + (x / y))  = y / (x + y)
  // 1 - (1 / (1 + (x / y))) = x / (y + x)

  trace?.log(`setRating =`)
  const setRating = getArmorSetRating(options.gearScore, trace?.indent())
  trace?.log(`rating = ${options.armorRating}`)
  const rating = options.armorRating
  const result = rating / (setRating + rating)
  trace?.log(`= rating / (setRating + rating)`)
  trace?.log(`= ${rating} / (${setRating} + ${rating})`)
  trace?.log(`= ${result}`)
  return clamp(result, NW_MIN_ARMOR_MITIGATION, NW_MAX_ARMOR_MITIGATION)
}

export function getDamageMitigationPercent(
  {
    gearScore,
    armorRating,
    armorPenetration,
  }: {
    gearScore: number
    armorRating: number
    armorPenetration: number
  },
  trace?: Tracer,
) {
  trace?.log(`mitigation =`)
  const mitigation = getArmorMitigation(
    {
      gearScore: gearScore,
      armorRating: armorRating,
    },
    trace?.indent(),
  )
  const result = mitigation * (1 - armorPenetration)
  trace?.log(`mitigation * (1 - armorPenetration)`)
  trace?.log(`= ${mitigation} * (1 - ${armorPenetration})`)
  trace?.log(`= ${result}`)
  return clamp(result, 0, 1)
}

export function getPvPGearScore(
  options: {
    weaponGearScore: number
    attackerAvgGearScore: number
    defenderAvgGearScore: number
  },
  trace?: Tracer,
) {
  const gearScore = options.weaponGearScore + options.defenderAvgGearScore - options.attackerAvgGearScore
  const result = Math.max(NW_MIN_GEAR_SCORE, gearScore)
  trace?.log(`weaponGearScore + defenderAvgGearScore - attackerAvgGearScore`)
  trace?.log(`= ${options.weaponGearScore} + ${options.defenderAvgGearScore} - ${options.attackerAvgGearScore}`)
  trace?.log(`= ${result}`)
  return result
}

export function getPvPScaling(options: { attackerLevel: number; defenderLevel: number }, trace?: Tracer) {
  const delta = options.attackerLevel - options.defenderLevel
  const scaling = delta < 0 ? -0.0225 : -0.015
  const result = scaling * delta
  trace?.log(`      delta = attackerLevel - defenderLevel`)
  trace?.log(`            = ${options.attackerLevel} - ${options.defenderLevel}`)
  trace?.log(`            = ${delta}`)
  trace?.log(`    scaling = delta < 0 ? -0.0225 : -0.015`)
  trace?.log(`            = ${delta} < 0 ? -0.0225 : -0.015`)
  trace?.log(`            = ${scaling}`)
  trace?.log(`scaling * delta`)
  trace?.log(`= ${scaling} * ${delta}`)
  trace?.log(`= ${result}`)
  return result
}

export interface AttackerStats {
  isPlayer: boolean
  level: number
  gearScore: number
  attributeModSums: Record<AttributeRef, number>

  preferHigherScaling: boolean
  convertPercent: number
  convertScaling: Record<AttributeRef, number>

  weaponScaling: Record<AttributeRef, number>
  weaponGearScore: number
  weaponDamage: number
  damageCoef: number
  damageAdd: number
  armorPenetration: number

  modPvp: number
  modAmmo: number
  modBase: number
  modBaseAFfix: number
  modCrit: number
  modDMG: number
  modDMGAffix: number
}

export interface DefenderStats {
  isPlayer: boolean
  level: number
  gearScore: number
  armorRating: number
  armorRatingAffix: number
  reductionBase: number
  reductionBaseAffix: number
  reductionCrit: number
  modABS: number
  modABSAffix: number
  modWKN: number
  modWKNAffix: number
}

export function calculateDamage({ attacker, defender }: { attacker: AttackerStats; defender: DefenderStats }) {
  attacker.gearScore = Math.floor(attacker.gearScore)
  const trace = tracer()
  trace.log('inputs:')
  //trace.indent().log(JSON.stringify(options, null, 2))

  const modifierSums = attacker.attributeModSums

  const convertPercent = attacker.convertPercent ?? 0
  const convertScale = getDamageScalingSumForWeapon({
    weapon: attacker.convertScaling,
    modifierSums: modifierSums,
  })
  trace.log(`convertScale: ${convertScale}`)

  const weaponPercent = 1 - convertPercent
  const weaponScale = getDamageScalingSumForWeapon({
    weapon: attacker.weaponScaling,
    modifierSums: modifierSums,
  })
  trace.log(`weaponScale: ${weaponScale}`)

  let convertScaling = attacker.convertScaling
  let weaponScaling = attacker.weaponScaling
  if (attacker.preferHigherScaling) {
    if (weaponScale > convertScale) {
      trace.log('higher scaling is weaponScaling, use that')
      convertScaling = weaponScaling
    } else {
      trace.log('higher scaling is convertScaling, use that')
      weaponScaling = convertScaling
    }
  }

  const isPvp = attacker.isPlayer && defender.isPlayer
  trace.log(`isPvp: ${isPvp}`)
  let effectiveGearScore = 0
  let pvpScale = 0
  if (isPvp) {
    trace.log(`effectiveGearScore =`)
    effectiveGearScore = getPvPGearScore(
      {
        attackerAvgGearScore: attacker.gearScore,
        defenderAvgGearScore: defender.gearScore,
        weaponGearScore: attacker.weaponGearScore,
      },
      trace.indent(),
    )
    trace.log(`pvpScaling =`)
    pvpScale = getPvPScaling(
      {
        attackerLevel: attacker.level,
        defenderLevel: defender.level,
      },
      trace.indent(),
    )
  } else {
    effectiveGearScore = attacker.weaponGearScore
    pvpScale = 0
  }

  // console.table({
  //   isPvp,
  //   effectiveGearScore,
  //   pvpScale,
  // })

  const inputs = {
    level: attacker.level,
    weaponDamage: attacker.weaponDamage,
    gearScore: attacker.weaponGearScore,
    weaponScale: weaponScaling,
    modifierSums: modifierSums,
    damageCoef: attacker.damageCoef,
    damageAdd: attacker.damageAdd,
    modPvP: attacker.modPvp,
    modAmmo: attacker.modAmmo,
    modBase: attacker.modBase,
    modCrit: attacker.modCrit,
    modDMG: attacker.modDMG,
    modABS: defender.modABS,
    modWKN: defender.modWKN,
    reductionBase: defender.reductionBase,
    reductionCrit: defender.reductionCrit,
    mitigation: 0,
  } satisfies Parameters<typeof getDamageForWeapon>[0]

  trace.log(`weaponDamage =`)
  const weaponDamage = getDamageForWeapon(
    {
      ...inputs,
      weaponScale: weaponScaling,
      modCrit: 0,
    },
    trace.indent(),
  )
  const weaponDamageScaled = weaponDamage * weaponPercent * (1 + pvpScale)
  trace.log(`weaponDamageScaled = weaponDamage * weaponPercent * (1 + pvpScale)`)
  trace.log(`                   = ${weaponDamage} * ${weaponPercent} * (1 + ${pvpScale})`)
  trace.log(`                   = ${weaponDamageScaled}`)

  trace.log(`weaponDamageCrit =`)
  const weaponDamageCrit = getDamageForWeapon(
    {
      ...inputs,
      weaponScale: weaponScaling,
    },
    trace.indent(),
  )

  const weaponDamageCritScaled = weaponDamageCrit * weaponPercent * (1 + pvpScale)
  trace.log(`weaponDamageCritScaled = weaponDamageCrit * weaponPercent * (1 + pvpScale)`)
  trace.log(`                   = ${weaponDamageCrit} * ${weaponPercent} * (1 + ${pvpScale})`)
  trace.log(`                   = ${weaponDamageCritScaled}`)

  trace.log(`mitigationPercent =`)
  const weaponMitigated = getDamageMitigationPercent(
    {
      armorPenetration: attacker.armorPenetration,
      armorRating: defender.armorRating,
      gearScore: effectiveGearScore,
    },
    trace?.indent(),
  )

  const convertedDamage =
    convertPercent *
    getDamageForWeapon({
      ...inputs,
      weaponScale: convertScaling,
      modCrit: 0,
      modBase: attacker.modBaseAFfix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
    })
  const convertedDamageCrit =
    convertPercent *
    getDamageForWeapon({
      ...inputs,
      weaponScale: convertScaling,
      modBase: attacker.modBaseAFfix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
    })
  const convertedMitigated = getDamageMitigationPercent({
    armorPenetration: attacker.armorPenetration,
    armorRating: defender.armorRatingAffix,
    gearScore: effectiveGearScore,
  })

  const weapon = {
    std: Math.floor(weaponDamageScaled),
    stdMitigated: Math.floor(weaponDamageScaled * weaponMitigated),
    stdFinal: Math.floor(weaponDamageScaled * (1 - weaponMitigated)),

    crit: Math.floor(weaponDamageCritScaled),
    critMitigated: Math.floor(weaponDamageCritScaled * weaponMitigated),
    critFinal: Math.floor(weaponDamageCritScaled * (1 - weaponMitigated)),

    mitigation: weaponMitigated,
  }
  const converted = {
    std: Math.floor(convertedDamage),
    stdMitigated: Math.floor(convertedDamage * convertedMitigated),
    stdFinal: Math.floor(convertedDamage * (1 - convertedMitigated)),

    crit: Math.floor(convertedDamageCrit),
    critMitigated: Math.floor(convertedDamageCrit * convertedMitigated),
    critFinal: Math.floor(convertedDamageCrit * (1 - convertedMitigated)),

    mitigation: convertedMitigated,
  }
  const total = {
    std: Math.floor(weapon.std + converted.std),
    stdMitigated: Math.floor(weapon.stdMitigated + converted.stdMitigated),
    stdFinal: Math.floor(weapon.stdFinal + converted.stdFinal),

    crit: Math.floor(weapon.crit + converted.crit),
    critMitigated: Math.floor(weapon.critMitigated + converted.critMitigated),
    critFinal: Math.floor(weapon.critFinal + converted.critFinal),

    mitigation: weaponMitigated * weaponPercent + convertedMitigated * convertPercent,
  }

  trace.log(`result =`)
  trace.log(JSON.stringify(weapon, null, 2))

  // console.table({
  //   weapon,
  //   converted,
  //   total,
  // })

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

export type Tracer = ReturnType<typeof tracer>
function tracer(log: string[] = [], indent = 0) {
  return {
    indent: () => tracer(log, indent + 1),
    log: (message: string) => {
      for (const line of message.split('\n')) {
        log.push('  '.repeat(indent) + line)
      }
    },
    text: () => log.join('\n'),
  }
}
