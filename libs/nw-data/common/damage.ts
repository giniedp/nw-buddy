import { WeaponItemDefinitions, WeaponTag } from '@nw-data/generated'
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
import { ExpressionNode } from './damage-expression'
import * as exp from './damage-expression'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getDamageScalingForLevel(level: number, trace?: Tracer) {
  const result = NW_LEVEL_DAMAGE_MULTIPLIER * (level - 1)
  if (trace) {
    trace?.log(`LEVEL_DAMAGE_MULTIPLIER * (level - 1)`)
    trace?.log(`${NW_LEVEL_DAMAGE_MULTIPLIER} * (${level} - 1)`)
    trace?.log(`${result}`)
  }
  return result
}

export function getDamageFactorForGearScore(gearScore: number, trace?: Tracer) {
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

  if (trace) {
    trace?.log(`powerLow   = FLOOR((MIN(GS_MAX, MAX(gearScore, GS_MIN)) - gsMin) / gsRounding)`)
    trace?.log(`           = FLOOR((MIN(${gsMax}, MAX(${gearScore}, ${gsMin})) - ${gsMin}) / ${gsRounding})`)
    trace?.log(`           = ${powerLow}`)
    trace?.log(`powerHigh  = FLOOR((MAX(gearScore, GS_MAX) - GS_MAX) / GS_ROUNDING)`)
    trace?.log(`           = FLOOR((MAX(${gearScore}, ${gsMax}) - ${gsMax}) / ${gsRounding})`)
    trace?.log(`           = ${powerHigh}`)
    trace?.log(`factorLow  = pow(1 + BASE_DMG_COMPOUND_INC, powerLow)`)
    trace?.log(`           = pow(1 + ${baseDamageCompund}, ${powerLow})`)
    trace?.log(`           = ${factorLow}`)
    trace?.log(`factorHigh = pow(1 + BASE_DMG_COMPOUND_INC * COMPOUND_DIMINISHING_MULTI, powerHigh)`)
    trace?.log(`           = pow(1 + ${baseDamageCompund} * ${compoundDiminishingMulti}, ${powerHigh})`)
    trace?.log(`           = ${factorHigh}`)
    trace?.log(`result     = factorLow * factorHigh`)
    trace?.log(`           = ${factorLow} * ${factorHigh}`)
    trace?.log(`           = ${result}`)
  }
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
  weapon: Pick<WeaponItemDefinitions, 'ScalingDexterity' | 'ScalingStrength' | 'ScalingIntelligence' | 'ScalingFocus'>,
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

const DMG_COEF_FOR_TOOLTIP = {
  Heal: 1.07,
  Greatsword: 0.9,
  Blunderbuss: 1.14,
  // all other weapons use 1 for primary attack
}

export function getDamageCoefForWeaponTag(tag: string) {
  return DMG_COEF_FOR_TOOLTIP[tag] || 1
}

export function getDamageForTooltip({
  playerLevel,
  gearScore,
  weapon,
  weaponScale,
  attrSums,
  damageCoef,
}: {
  playerLevel: number
  gearScore: number
  weapon: WeaponItemDefinitions
  weaponScale?: Record<AttributeRef, number>
  attrSums: Record<AttributeRef, number>
  damageCoef?: number
}) {
  return getDamageForWeapon({
    level: playerLevel,
    weaponDamage: weapon.BaseDamage,
    gearScore: gearScore,
    weaponScale: weaponScale || getDamageScalingForWeapon(weapon),
    modifierSums: attrSums,
    damageCoef: damageCoef ?? getDamageCoefForWeaponTag(getWeaponTagFromWeapon(weapon)),
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
    pvpScale?: number
  },
  trace?: Tracer,
) {
  const baseDamage = options.weaponDamage ?? 0
  const damageCoef = options.damageCoef ?? 1
  const damageAdd = options.damageAdd ?? 0
  trace?.log(`factorFromGS =`)
  const factorFromGS = getDamageFactorForGearScore(options.gearScore, trace?.indent()) ?? 1
  trace?.log(`levelScaling =`)
  const levelScaling = getDamageScalingForLevel(options.level, trace?.indent()) ?? 0
  const statsScaling =
    getDamageScalingSumForWeapon({
      weapon: options.weaponScale,
      modifierSums: options.modifierSums,
    }) ?? 0
  const modPvP = options.modPvP ?? 0
  const modAmmo = options.modAmmo ?? 0
  const modBase = Math.max(-1, (options.modBase ?? 0) - (options.reductionBase ?? 0))
  const modCrit = Math.max(0, (options.modCrit ?? 0) - (options.reductionCrit ?? 0))
  const modDMG = options.modDMG ?? 0
  const modABS = options.modABS ?? 0
  const modWKN = options.modWKN ?? 0
  const mitigation = options.mitigation ?? 0
  const pvpScale = options.pvpScale ?? 0

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
      (1 + pvpScale) *
      (1 - mitigation) +
    damageAdd

  if (trace) {
    trace.log(`baseDamage                          | ${baseDamage}`)
    trace.log(` * damageCoef                       |  * ${damageCoef}`)
    trace.log(` * factorFromGS                     |  * ${factorFromGS}`)
    trace.log(` * (1 + modPvP)                     |  * (1 + ${modPvP})`)
    trace.log(` * (1 + levelScaling + statsScaling)|  * (1 + ${levelScaling} + ${statsScaling})`)
    trace.log(` * (1 + modAmmo)                    |  * (1 + ${modAmmo})`)
    trace.log(` * (1 + modBase + modCrit)          |  * (1 + ${modBase} + ${modCrit})`)
    trace.log(` * (1 + modDMG)                     |  * (1 + ${modDMG})`)
    trace.log(` * (1 - modABS)                     |  * (1 - ${modABS})`)
    trace.log(` * (1 + modWKN)                     |  * (1 + ${modWKN})`)
    trace.log(` * (1 + pvpScale)                   |  * (1 + ${pvpScale})`)
    trace.log(` * (1 - mitigation)                 |  * (1 - ${mitigation})`)
    trace.log(` + damageAdd                        |  + ${damageAdd}`)
    trace.log(`= ${result}`)
  }
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

  dotCoef: number
  dotPotency: number
  dotRate: number
  dotDuration: number

  preferHigherScaling: boolean
  affixPercent: number
  affixScaling: Record<AttributeRef, number>

  weaponScaling: Record<AttributeRef, number>
  weaponGearScore: number
  weaponDamage: number

  damageCoef: number
  damageAdd: number
  armorPenetration: number

  modPvp: number
  modAmmo: number
  modCrit: number
  modBase: number
  modBaseAffix: number
  modBaseDot: number
  modDMG: number
  modDMGAffix: number
  modDMGDot: number
}

export interface DefenderStats {
  isPlayer: boolean
  level: number
  gearScore: number
  armorRating: number
  armorRatingAffix: number
  armorRatingDot: number
  reductionBase: number
  reductionBaseAffix: number
  reductionBaseDot: number
  reductionCrit: number
  modABS: number
  modABSAffix: number
  modABSDot: number
  modWKN: number
  modWKNAffix: number
  modWKNDot: number
}

export function calculateDamage({ attacker, defender }: { attacker: AttackerStats; defender: DefenderStats }) {
  attacker.gearScore = Math.floor(attacker.gearScore)
  const trace = tracer()

  const modifierSums = attacker.attributeModSums

  const convertPercent = attacker.affixPercent ?? 0
  const affixScale = getDamageScalingSumForWeapon({
    weapon: attacker.affixScaling,
    modifierSums: modifierSums,
  })

  const weaponPercent = 1 - convertPercent
  const weaponScale = getDamageScalingSumForWeapon({
    weapon: attacker.weaponScaling,
    modifierSums: modifierSums,
  })

  let affixScaling = attacker.affixScaling
  let weaponScaling = attacker.weaponScaling
  if (attacker.preferHigherScaling) {
    trace.log(`affixScale: ${affixScale}`)
    trace.log(`weaponScale: ${weaponScale}`)
    if (weaponScale > affixScale) {
      trace.log(`weaponScale is higher, use that for affix`)
      affixScaling = weaponScaling
    } else {
      trace.log(`affixScale is higher, use that for weapon`)
      weaponScaling = affixScaling
    }
    trace.log(``)
  }

  const isPvp = attacker.isPlayer && defender.isPlayer
  let effectiveGearScore = 0
  let pvpScale = 0
  if (isPvp) {
    trace.log(`pvpGearScore =`)
    effectiveGearScore = getPvPGearScore(
      {
        attackerAvgGearScore: attacker.gearScore,
        defenderAvgGearScore: defender.gearScore,
        weaponGearScore: attacker.weaponGearScore,
      },
      trace.indent(),
    )
    trace.log(``)
    trace.log(`pvpScaling =`)
    pvpScale = getPvPScaling(
      {
        attackerLevel: attacker.level,
        defenderLevel: defender.level,
      },
      trace.indent(),
    )
    trace.log(``)
  } else {
    effectiveGearScore = attacker.weaponGearScore
    pvpScale = 0
  }

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
    pvpScale: pvpScale,
    mitigation: 0,
  } satisfies Parameters<typeof getDamageForWeapon>[0]

  trace.log(`--- WEAPON DAMAGE ---`)
  trace.log(``)
  trace.log(`mitigationPercent =`)
  const weaponMitigationPercent = getDamageMitigationPercent(
    {
      armorPenetration: attacker.armorPenetration,
      armorRating: defender.armorRating,
      gearScore: effectiveGearScore,
    },
    trace?.indent(),
  )
  trace.log(``)
  trace.log(`damagePreMitigation =`)
  const weaponStdPreMitigation = getDamageForWeapon(
    {
      ...inputs,
      weaponScale: weaponScaling,
      damageCoef: attacker.damageCoef * weaponPercent,
      modCrit: 0,
      mitigation: 0,
    },
    trace.indent(),
  )
  const weaponStdPostMitigation = getDamageForWeapon({
    ...inputs,
    weaponScale: weaponScaling,
    damageCoef: attacker.damageCoef * weaponPercent,
    mitigation: weaponMitigationPercent,
    modCrit: 0,
  })
  const weaponStdMitigated = weaponStdPostMitigation - weaponStdPreMitigation
  trace.log(`damagePostMitigation = ${weaponStdPostMitigation}`)
  trace.log(`damageMitigated = ${weaponStdPostMitigation} - ${weaponStdPreMitigation} = ${weaponStdMitigated}`)

  trace.log(``)
  trace.log(`critPreMitigation =`)
  const weaponCritPreMitigation = getDamageForWeapon(
    {
      ...inputs,
      weaponScale: weaponScaling,
      damageCoef: attacker.damageCoef * weaponPercent,
      mitigation: 0,
    },
    trace.indent(),
  )
  const weaponCritPostMitigation = getDamageForWeapon({
    ...inputs,
    weaponScale: weaponScaling,
    damageCoef: attacker.damageCoef * weaponPercent,
    mitigation: weaponMitigationPercent,
  })
  const weaponCritMitigated = weaponCritPostMitigation - weaponCritPreMitigation
  trace.log(`critPostMitigation = ${weaponCritPostMitigation}`)
  trace.log(`critMitigated = ${weaponCritPostMitigation} - ${weaponCritPreMitigation} = ${weaponCritMitigated}`)

  trace.log(``)
  trace.log(`--- AFFIX DAMAGE ---`)
  trace.log(``)
  trace.log(`affixMitigationPercent =`)
  const affixMitigationPercent = getDamageMitigationPercent(
    {
      armorPenetration: attacker.armorPenetration,
      armorRating: defender.armorRatingAffix,
      gearScore: effectiveGearScore,
    },
    trace.indent(),
  )
  trace.log(``)
  trace.log(`affixDamageStd =`)
  const affixStdPreMitigation = getDamageForWeapon(
    {
      ...inputs,
      weaponScale: affixScaling,
      damageCoef: attacker.damageCoef * convertPercent,
      reductionBase: defender.reductionBaseAffix,
      modCrit: 0,
      mitigation: 0,
      modBase: attacker.modBaseAffix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
    },
    trace.indent(),
  )
  const affixStdPostMitigation = getDamageForWeapon({
    ...inputs,
    weaponScale: affixScaling,
    damageCoef: attacker.damageCoef * convertPercent,
    reductionBase: defender.reductionBaseAffix,
    modCrit: 0,
    modBase: attacker.modBaseAffix,
    modDMG: attacker.modDMGAffix,
    modABS: defender.modABSAffix,
    modWKN: defender.modWKNAffix,
    mitigation: affixMitigationPercent,
  })
  const affixStdMitigated = affixStdPostMitigation - affixStdPreMitigation
  trace.log(`damagePostMitigation = ${affixStdPostMitigation}`)
  trace.log(`damageMitigated = ${affixStdPostMitigation} - ${affixStdPreMitigation} = ${affixStdMitigated}`)

  trace.log(``)
  trace.log(`affixDamageCrit =`)
  const affixCritPreMitigation = getDamageForWeapon(
    {
      ...inputs,
      weaponScale: affixScaling,
      damageCoef: attacker.damageCoef * convertPercent,
      reductionBase: defender.reductionBaseAffix,
      modBase: attacker.modBaseAffix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
      mitigation: 0,
    },
    trace.indent(),
  )
  const affixCritPostMitigation = getDamageForWeapon({
    ...inputs,
    weaponScale: affixScaling,
    damageCoef: attacker.damageCoef * convertPercent,
    reductionBase: defender.reductionBaseAffix,
    modBase: attacker.modBaseAffix,
    modDMG: attacker.modDMGAffix,
    modABS: defender.modABSAffix,
    modWKN: defender.modWKNAffix,
    mitigation: affixMitigationPercent,
  })
  const affixCritMitigated = affixCritPostMitigation - affixCritPreMitigation
  trace.log(`damagePostMitigation = ${affixCritPostMitigation}`)
  trace.log(`damageMitigated = ${affixCritPostMitigation} - ${affixCritPreMitigation} = ${affixCritMitigated}`)

  trace.log(``)

  const dotDamage = getDamageForWeapon({
    ...inputs,
    weaponScale: weaponScaling,
    damageCoef: (attacker.dotCoef ?? 0) * (1 + (attacker.dotPotency ?? 0)),
    damageAdd: 0,
    reductionBase: defender.reductionBaseDot,
    modCrit: 0,
    modBase: attacker.modBaseDot,
    modDMG: attacker.modDMGDot,
    modABS: defender.modABSDot,
    modWKN: defender.modWKNDot,
  })
  const dotTicks = Math.floor((attacker.dotDuration ?? 0) / (attacker.dotRate ?? 1))
  const dotMitigationPct = getDamageMitigationPercent({
    armorPenetration: attacker.armorPenetration,
    armorRating: defender.armorRatingDot,
    gearScore: effectiveGearScore,
  })

  const weapon = {
    std: Math.floor(weaponStdPreMitigation),
    stdMitigated: Math.floor(weaponStdPreMitigation * weaponMitigationPercent),
    stdFinal: Math.floor(weaponStdPreMitigation * (1 - weaponMitigationPercent)),

    crit: Math.floor(weaponCritPreMitigation),
    critMitigated: Math.floor(weaponCritPreMitigation * weaponMitigationPercent),
    critFinal: Math.floor(weaponCritPreMitigation * (1 - weaponMitigationPercent)),

    mitigation: weaponMitigationPercent,
  }
  const affix = {
    std: Math.floor(affixStdPreMitigation),
    stdMitigated: Math.floor(affixStdPreMitigation * affixMitigationPercent),
    stdFinal: Math.floor(affixStdPreMitigation * (1 - affixMitigationPercent)),

    crit: Math.floor(affixCritPreMitigation),
    critMitigated: Math.floor(affixCritPreMitigation * affixMitigationPercent),
    critFinal: Math.floor(affixCritPreMitigation * (1 - affixMitigationPercent)),

    mitigation: affixMitigationPercent,
  }
  const dot = {
    tick: Math.floor(dotDamage),
    tickMitigated: Math.floor(dotDamage * dotMitigationPct),
    tickFinal: Math.floor(dotDamage * (1 - dotMitigationPct)),

    sum: dotTicks * Math.floor(dotDamage),
    sumMitigated: dotTicks * Math.floor(dotDamage * dotMitigationPct),
    sumFinal: dotTicks * Math.floor(dotDamage * (1 - dotMitigationPct)),

    mitigation: dotMitigationPct,
  }
  const total = {
    std: Math.floor(weapon.std + affix.std),
    stdMitigated: Math.floor(weapon.stdMitigated + affix.stdMitigated),
    stdFinal: Math.floor(weapon.stdFinal + affix.stdFinal),

    crit: Math.floor(weapon.crit + affix.crit),
    critMitigated: Math.floor(weapon.critMitigated + affix.critMitigated),
    critFinal: Math.floor(weapon.critFinal + affix.critFinal),

    mitigation: weaponMitigationPercent * weaponPercent + affixMitigationPercent * convertPercent,
  }

  // console.log(trace.text())

  return {
    weapon,
    affix,
    total,
    dot,
    trace: trace.text(),
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

export function getWeaponTagFromWeapon(item: WeaponItemDefinitions | null): WeaponTag | null {
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
