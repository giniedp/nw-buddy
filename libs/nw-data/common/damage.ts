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

export function damageForWeapon(
  options: {
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
  },
  trace?: Tracer,
) {
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

  trace?.log(`baseDamage                          : ${baseDamage}`)
  trace?.log(` * damageCoef                       :  * ${damageCoef}`)
  trace?.log(` * factorFromGS                     :  * ${factorFromGS}`)
  trace?.log(` * (1 + pvpMod)                     :  * (1 + ${pvpMod})`)
  trace?.log(` * (1 + levelScaling + statsScaling):  * (1 + ${levelScaling} + ${statsScaling})`)
  trace?.log(` * (1 + ammoMod)                    :  * (1 + ${ammoMod})`)
  trace?.log(` * (1 + baseMod + critMod)          :  * (1 + ${baseMod} + ${critMod})`)
  trace?.log(` * (1 + empowerMod)                 :  * (1 + ${empowerMod})`)
  trace?.log(` * (1 - absMod)                     :  * (1 - ${absMod})`)
  trace?.log(` * (1 + wknMod)                     :  * (1 + ${wknMod})`)
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

export function armorSetRating(gearScore: number, trace?: Tracer) {
  const result = Math.pow(gearScore, NW_ARMOR_SET_RATING_EXPONENT)
  trace?.log(`pow(gs, EXPONENT)`)
  trace?.log(`= pow(${gearScore}, ${NW_ARMOR_SET_RATING_EXPONENT})`)
  trace?.log(`= ${result}`)
  return result
}

export function armorRating(options: { gearScore: number; mitigation: number }) {
  const x = armorSetRating(options.gearScore)
  const y = options.mitigation
  return Math.floor((x * y) / (1 - y))
}

export function armorMitigation(options: { gearScore: number; armorRating: number }, trace?: Tracer) {
  // 1 / (1 + ARMORRATING*(1+MIN(MAX(FORT-REND,-0.7),2)) / (WeaponGS+DefendersAverageGS-AttackersAvgGS)^1.2)
  // 1 / (1 + FINAL_ARMOR_RATING) / SET_RATING

  //      1 / (1 + (x / y))  = y / (x + y)
  // 1 - (1 / (1 + (x / y))) = x / (y + x)

  trace?.log(`setRating =`)
  const setRating = armorSetRating(options.gearScore, trace?.nested())
  trace?.log(`rating = ${options.armorRating}`)
  const rating = options.armorRating
  const result = rating / (setRating + rating)
  trace?.log(`= rating / (setRating + rating)`)
  trace?.log(`= ${rating} / (${setRating} + ${rating})`)
  trace?.log(`= ${result}`)
  return clamp(result, NW_MIN_ARMOR_MITIGATION, NW_MAX_ARMOR_MITIGATION)
}

export function damageMitigationPercent({
  gearScore,
  armorRating,
  armorPenetration,
}: {
  gearScore: number
  armorRating: number
  armorPenetration: number
}, trace?: Tracer) {
  trace?.log(`mitigation =`)
  const mitigation = armorMitigation({
    gearScore: gearScore,
    armorRating: armorRating,
  }, trace?.nested())
  const result = mitigation * (1 - armorPenetration)
  trace?.log(`mitigation * (1 - armorPenetration)`)
  trace?.log(`= ${mitigation} * (1 - ${armorPenetration})`)
  trace?.log(`= ${result}`)
  return clamp(result, 0, 1)
}

export function pvpGearScore(
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

export function pvpScaling(options: { attackerLevel: number; defenderLevel: number }, trace?: Tracer) {
  const delta = options.attackerLevel - options.defenderLevel
  const scaling = delta < 0 ? -0.0225 : -0.0150
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
  options.attackerGearScore = Math.floor(options.attackerGearScore)
  const trace = tracer()
  console.table(options)
  trace.log('inputs:')
  trace.nested().log(JSON.stringify(options, null, 2))

  const attributes = options.attributes

  const convertPercent = options.convertPercent ?? 0
  const convertScale = damageFactorForAttrs({
    weapon: options.convertScaling,
    attributes: attributes,
  })
  trace.log(`convertScale: ${convertScale}`)

  const weaponPercent = 1 - convertPercent
  const weaponScale = damageFactorForAttrs({
    weapon: options.weaponScaling,
    attributes: attributes,
  })
  trace.log(`weaponScale: ${weaponScale}`)

  let convertScaling = options.convertScaling
  let weaponScaling = options.weaponScaling
  if (options.preferHigherScaling) {
    if (weaponScale > convertScale) {
      trace.log('higher scaling is weaponScaling, use that')
      convertScaling = weaponScaling
    } else {
      trace.log('higher scaling is convertScaling, use that')
      weaponScaling = convertScaling
    }
  }

  const isPvp = options.attackerIsPlayer && options.defenderIsPlayer
  trace.log(`isPvp: ${isPvp}`)
  let effectiveGearScore = 0
  let pvpScale = 0
  if (isPvp) {
    trace.log(`effectiveGearScore =`)
    effectiveGearScore = pvpGearScore(
      {
        attackerAvgGearScore: options.attackerGearScore,
        defenderAvgGearScore: options.defenderGearScore,
        weaponGearScore: options.weaponGearScore,
      },
      trace.nested(),
    )
    trace.log(`pvpScaling =`)
    pvpScale = pvpScaling(
      {
        attackerLevel: options.attackerLevel,
        defenderLevel: options.defenderLevel,
      },
      trace.nested(),
    )
  } else {
    effectiveGearScore = options.weaponGearScore
    pvpScale = 0
  }

  console.table({
    isPvp,
    effectiveGearScore,
    pvpScale,
  })

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

  trace.log(`weaponDamage =`)
  const weaponDamage = damageForWeapon(
    {
      ...inputs,
      weaponScale: weaponScaling,
      critMod: 0,
    },
    trace.nested(),
  )
  const weaponDamageScaled = weaponDamage * weaponPercent * (1 + pvpScale)
  trace.log(`weaponDamageScaled = weaponDamage * weaponPercent * (1 + pvpScale)`)
  trace.log(`                   = ${weaponDamage} * ${weaponPercent} * (1 + ${pvpScale})`)
  trace.log(`                   = ${weaponDamageScaled}`)

  trace.log(`weaponDamageCrit =`)
  const weaponDamageCrit = damageForWeapon(
    {
      ...inputs,
      weaponScale: weaponScaling,
    },
    trace.nested(),
  )

  const weaponDamageCritScaled = weaponDamageCrit * weaponPercent * (1 + pvpScale)
  trace.log(`weaponDamageCritScaled = weaponDamageCrit * weaponPercent * (1 + pvpScale)`)
  trace.log(`                   = ${weaponDamageCrit} * ${weaponPercent} * (1 + ${pvpScale})`)
  trace.log(`                   = ${weaponDamageCritScaled}`)

  trace.log(`mitigationPercent =`)
  const weaponMitigated = damageMitigationPercent({
    armorPenetration: options.armorPenetration,
    armorRating: options.defenderRatingWeapon,
    gearScore: effectiveGearScore,
  }, trace?.nested())

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
    gearScore: effectiveGearScore,
  })

  const weapon = {
    std: Math.floor(weaponDamageScaled),
    stdMitigated: Math.floor(weaponDamageScaled * weaponMitigated),
    stdFinal: Math.floor(weaponDamageScaled * (1 - weaponMitigated)),

    crit: Math.floor(weaponDamageCritScaled),
    critMitigated: Math.floor(weaponDamageCritScaled * weaponMitigated),
    critFinal: Math.floor(weaponDamageCritScaled * (1 - weaponMitigated)),
  }
  const converted = {
    std: Math.floor(convertedDamage),
    stdMitigated: Math.floor(convertedDamage * convertedMitigated),
    stdFinal: Math.floor(convertedDamage * (1 - convertedMitigated)),

    crit: Math.floor(convertedDamageCrit),
    critMitigated: Math.floor(convertedDamageCrit * convertedMitigated),
    critFinal: Math.floor(convertedDamageCrit * (1 - convertedMitigated)),
  }
  const total = {
    std: Math.floor(weapon.std + converted.std),
    stdMitigated: Math.floor(weapon.stdMitigated + converted.stdMitigated),
    stdFinal: Math.floor(weapon.stdFinal + converted.stdFinal),

    crit: Math.floor(weapon.crit + converted.crit),
    critMitigated: Math.floor(weapon.critMitigated + converted.critMitigated),
    critFinal: Math.floor(weapon.critFinal + converted.critFinal),
  }

  trace.log(`result =`)
  trace.log(JSON.stringify(weapon, null, 2))

  console.table({
    weapon,
    converted,
    total,
  })
  console.log(trace.text())
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
    nested: () => tracer(log, indent + 1),
    log: (message: string) => {
      for (const line of message.split('\n')) {
        log.push('  '.repeat(indent) + line)
      }
    },
    text: () => log.join('\n'),
  }
}
