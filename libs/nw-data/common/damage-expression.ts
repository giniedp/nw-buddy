import { AttributeRef } from './attributes'
import {
  NW_ARMOR_SET_RATING_EXPONENT,
  NW_BASE_DAMAGE_COMPOUND_INCREASE,
  NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL,
  NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER,
  NW_DIMINISHING_GEAR_SCORE_THRESHOLD,
  NW_LEVEL_DAMAGE_MULTIPLIER,
  NW_MAX_ARMOR_MITIGATION,
  NW_MIN_ARMOR_MITIGATION,
  NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE,
} from './constants'
import { AttackerStats, DefenderStats } from './damage'
import { patchPrecision } from './precision'

export type ExpressionOperator =
  | 'variable'
  | 'constant'
  | 'value'
  | 'floor'
  | 'min'
  | 'max'
  | 'pow'
  | 'sum'
  | 'mul'
  | 'div'
  | 'sub'
  | 'negate'
export interface ExpressionNode {
  name?: string
  operator: ExpressionOperator
  operands: ExpressionNode[]
  value: number
}

function variable(name: string, node: ExpressionNode): ExpressionNode {
  return {
    name,
    operator: 'variable',
    operands: [node],
    get value() {
      return node.value
    },
  }
}

function constant(value: number): ExpressionNode {
  return {
    operator: 'constant',
    operands: [],
    get value() {
      return value
    },
  }
}

function value(name: string, value: number): ExpressionNode {
  return {
    name,
    operator: 'value',
    operands: [],
    get value() {
      return value
    },
  }
}

function floor(node: ExpressionNode): ExpressionNode {
  return {
    operator: 'floor',
    operands: [node],
    get value() {
      return Math.floor(node.value)
    },
  }
}

function pow(node: ExpressionNode, power: ExpressionNode): ExpressionNode {
  return {
    operator: 'pow',
    operands: [node, power],
    get value() {
      return Math.pow(node.value, power.value)
    },
  }
}

function min(...node: ExpressionNode[]): ExpressionNode {
  return {
    operator: 'min',
    operands: node,
    get value() {
      return Math.min(...node.map((it) => it.value))
    },
  }
}

function max(...node: ExpressionNode[]): ExpressionNode {
  return {
    operator: 'max',
    operands: node,
    get value() {
      return Math.max(...node.map((it) => it.value))
    },
  }
}

function sum(...nodes: ExpressionNode[]): ExpressionNode {
  return {
    operator: 'sum',
    operands: nodes,
    get value() {
      let result = 0
      for (const node of nodes) {
        result += node.value
      }
      return patchPrecision(result)
    },
  }
}

function mul(...nodes: ExpressionNode[]): ExpressionNode {
  return {
    operator: 'mul',
    operands: nodes,
    get value() {
      let result = 1
      for (const node of nodes) {
        result *= node.value
      }
      return patchPrecision(result)
    },
  }
}

function div(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
  return {
    operator: 'div',
    operands: [left, right],
    get value() {
      return patchPrecision(left.value / right.value)
    },
  }
}

function sub(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
  return {
    operator: 'sub',
    operands: [left, right],
    get value() {
      return left.value - right.value
    },
  }
}

function negate(node: ExpressionNode): ExpressionNode {
  return {
    operator: 'negate',
    operands: [node],
    get value() {
      return -node.value
    },
  }
}

function oneMinusX(x: ExpressionNode) {
  return sub(constant(1), x)
}

const GS_MIN = value('GS_MIN', NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE)
const GS_ROUNDING = value('GS_ROUNDING', NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL)
const GS_DIMINISH_TRESHOLD = value('GS_DIMINISH_TRESHOLD', NW_DIMINISHING_GEAR_SCORE_THRESHOLD)
const BDM_COMPOUND_INCREASE = value('BDM_COMPOUND_INCREASE', NW_BASE_DAMAGE_COMPOUND_INCREASE)
const BDM_COMPOUND_DIMINSH_MUL = value('BDM_COMPOUND_DIMINSH_MUL', NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER)
const LEVEL_DAMAGE_MULTIPLIER = value('LEVEL_DAMAGE_MULTIPLIER', NW_LEVEL_DAMAGE_MULTIPLIER)

function damageScalingSum({
  weapon,
  modifierSums,
}: {
  weapon: Record<AttributeRef, number>
  modifierSums: Record<AttributeRef, number>
}) {
  const str = mul(value('modSTR', modifierSums.str || 0), value('wpnSTR', weapon?.str || 0))
  const dex = mul(value('modDEX', modifierSums.dex || 0), value('wpnDEX', weapon?.dex || 0))
  const int = mul(value('modINT', modifierSums.int || 0), value('wpnINT', weapon?.int || 0))
  const foc = mul(value('modFOC', modifierSums.foc || 0), value('wpnFOC', weapon?.foc || 0))
  const nodes: ExpressionNode[] = []
  if (str.value) {
    nodes.push(str)
  }
  if (dex.value) {
    nodes.push(dex)
  }
  if (int.value) {
    nodes.push(int)
  }
  if (foc.value) {
    nodes.push(foc)
  }
  if (!nodes.length) {
    nodes.push(str, dex, int, foc)
  }
  return sum(...nodes)
}

function clamp(value: ExpressionNode, minVal: number, maxVal: number) {
  return min(constant(maxVal), max(constant(minVal), value))
}

export function damageScalingForLevel(level: ExpressionNode) {
  // LEVEL_DAMAGE_MULTIPLIER * (level - 1)
  return mul(LEVEL_DAMAGE_MULTIPLIER, sub(level, constant(1)))
}

export function damageFactorForGearScore(gearScore: ExpressionNode) {
  const gsMin = GS_MIN
  const gsMax = GS_DIMINISH_TRESHOLD
  const gsRounding = GS_ROUNDING
  const baseDamageCompound = BDM_COMPOUND_INCREASE
  const compoundDiminishMul = BDM_COMPOUND_DIMINSH_MUL

  // powerLow    = FLOOR((MIN(GS_MAX, MAX(gearScore, GS_MIN)) - gsMin) / gsRounding)
  const powerLow = floor(div(sub(min(gsMax, max(gearScore, gsMin)), gsMin), gsRounding))

  // powerHigh   = FLOOR((MAX(gearScore, GS_MAX) - GS_MAX) / GS_ROUNDING)
  const powerHigh = floor(div(sub(max(gearScore, gsMax), gsMax), gsRounding))

  // factorLow    = pow(1 + BASE_DMG_COMPOUND_INC, powerLow)
  const factorLow = pow(sum(constant(1), baseDamageCompound), powerLow)

  // factorHigh    = pow(1 + BASE_DMG_COMPOUND_INC * COMPOUND_DIMINISHING_MULTI, powerHigh)
  const factorHigh = pow(sum(constant(1), mul(baseDamageCompound, compoundDiminishMul)), powerHigh)

  // result     = factorLow * factorHigh
  return mul(factorLow, factorHigh)
}

export function damageForWeapon(options: {
  level: number
  gearScore: number
  weaponDamage: number
  weaponScale: Record<AttributeRef, number>
  modifierSums: Record<AttributeRef, number>
  damageCoef: number
  damageAdd: number
  modPvP: number
  modAmmo: number
  modBase: number
  modCrit: number
  modDMG: number
  modABS: number
  modWKN: number
  reductionBase: number
  reductionCrit: number
  mitigation: ExpressionNode
  pvpScale: ExpressionNode
  conversionScale: ExpressionNode
}) {
  const level = value('level', options.level ?? 1)
  const gearScore = variable('gearScore', floor(constant(options.gearScore)))
  const baseDamage = value('baseDamage', options.weaponDamage ?? 0)
  const damageCoef = value('damageCoef', options.damageCoef)
  const damageConv = variable('factorConversion', options.conversionScale)
  const damageAdd = value('damageAdd', options.damageAdd ?? 0)
  const factorFromGS = variable('factorFromGS', damageFactorForGearScore(gearScore))
  const levelScaling = variable('levelScaling', damageScalingForLevel(level))
  const statsScaling = variable(
    'statsScaling',
    damageScalingSum({
      weapon: options.weaponScale,
      modifierSums: options.modifierSums,
    }),
  )

  const modPvP = value('modPvP', options.modPvP ?? 0)
  const modAmmo = value('modAmmo', options.modAmmo ?? 0)
  const modBase = value('modBase', Math.max(-1, (options.modBase ?? 0) - (options.reductionBase ?? 0)))
  const modCrit = value('modCrit', Math.max(0, (options.modCrit ?? 0) - (options.reductionCrit ?? 0)))
  const modDMG = value('modDMG', options.modDMG ?? 0)
  const modABS = value('modABS', options.modABS ?? 0)
  const modWKN = value('modWKN', options.modWKN ?? 0)
  const mitigation = variable('mitigation', options.mitigation)
  const pvpScale = variable('pvpScale', options.pvpScale)

  return sum(
    mul(
      baseDamage,
      damageCoef,
      damageConv,
      factorFromGS,
      sum(constant(1), modPvP),
      sum(constant(1), levelScaling, statsScaling),
      sum(constant(1), modAmmo),
      sum(constant(1), modBase, modCrit),
      sum(constant(1), modDMG),
      oneMinusX(modABS),
      sum(constant(1), modWKN),
      sum(constant(1), pvpScale),
      oneMinusX(mitigation),
    ),
    damageAdd,
  )
}

function armorSetRating(gearScore: ExpressionNode) {
  // pow(gs, EXPONENT)
  return pow(gearScore, constant(NW_ARMOR_SET_RATING_EXPONENT))
}

function armorRating(options: { gearScore: ExpressionNode; mitigation: ExpressionNode }) {
  const rating = armorSetRating(options.gearScore)
  const mitigation = options.mitigation
  // Math.floor((rating * mitigation) / (1 - mitigation))
  return floor(div(sum(rating, mitigation), oneMinusX(mitigation)))
}

function armorMitigation(options: { gearScore: ExpressionNode; armorRating: ExpressionNode }) {
  // 1 / (1 + ARMORRATING*(1+MIN(MAX(FORT-REND,-0.7),2)) / (WeaponGS+DefendersAverageGS-AttackersAvgGS)^1.2)
  // 1 / (1 + FINAL_ARMOR_RATING) / SET_RATING

  //      1 / (1 + (x / y))  = y / (x + y)
  // 1 - (1 / (1 + (x / y))) = x / (y + x)

  // trace?.log(`setRating =`)
  const setRating = armorSetRating(options.gearScore)
  // trace?.log(`rating = ${options.armorRating}`)
  const rating = options.armorRating
  // rating / (setRating + rating)
  const result = div(rating, sum(setRating, rating))
  return clamp(result, NW_MIN_ARMOR_MITIGATION, NW_MAX_ARMOR_MITIGATION)
}

function damageMitigationFactor({
  gearScore,
  armorRating,
  armorPenetration,
}: {
  gearScore: ExpressionNode
  armorRating: ExpressionNode
  armorPenetration: ExpressionNode
}) {
  const mitigation = armorMitigation({
    gearScore: gearScore,
    armorRating: armorRating,
  })
  // clamp(mitigation * (1 - armorPenetration), 0, 1)
  return clamp(mul(mitigation, oneMinusX(armorPenetration)), 0, 1)
}

function pvpGearScore(options: {
  weaponGearScore: ExpressionNode
  attackerAvgGearScore: ExpressionNode
  defenderAvgGearScore: ExpressionNode
}) {
  // max(GS_MIN, weaponGearScore + defenderAvgGearScore - attackerAvgGearScore)
  return max(
    value('GS_MIN', NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE),
    sum(options.weaponGearScore, options.defenderAvgGearScore, negate(options.attackerAvgGearScore)),
  )
}

function pvpScaling(options: { attackerLevel: ExpressionNode; defenderLevel: ExpressionNode }) {
  const delta = sub(options.attackerLevel, options.defenderLevel)
  const scaling = delta.value < 0 ? -0.0225 : -0.015
  const result = mul(constant(scaling), delta)
  return result
}

export function damageExpression({ attacker, defender }: { attacker: AttackerStats; defender: DefenderStats }) {
  attacker.gearScore = Math.floor(attacker.gearScore)

  const affixFactor = constant(attacker.affixPercent ?? 0)
  const affixScale = variable(
    'affixScale',
    damageScalingSum({
      weapon: attacker.affixScaling,
      modifierSums: attacker.attributeModSums,
    }),
  )

  const weaponFactor = oneMinusX(affixFactor)
  const weaponScale = variable(
    'weaponScale',
    damageScalingSum({
      weapon: attacker.weaponScaling,
      modifierSums: attacker.attributeModSums,
    }),
  )

  let affixScaling = attacker.affixScaling
  let weaponScaling = attacker.weaponScaling
  if (attacker.preferHigherScaling) {
    if (weaponScale.value > affixScale.value) {
      affixScaling = weaponScaling
    } else {
      weaponScaling = affixScaling
    }
  }

  const isPvp = attacker.isPlayer && defender.isPlayer
  let effectiveGearScore: ExpressionNode
  let pvpScale: ExpressionNode
  if (isPvp) {
    effectiveGearScore = variable(
      'pvpGS',
      pvpGearScore({
        attackerAvgGearScore: value('attackerGS', attacker.gearScore),
        defenderAvgGearScore: value('defenderGS', defender.gearScore),
        weaponGearScore: value('weaponGS', attacker.weaponGearScore),
      }),
    )
    pvpScale = variable(
      'pvpScaling',
      pvpScaling({
        attackerLevel: value('attackerLevel', attacker.level),
        defenderLevel: value('defenderLevel', defender.level),
      }),
    )
  } else {
    effectiveGearScore = value('weaponGS', attacker.weaponGearScore)
    pvpScale = value('pvpScaling', 0)
  }

  const inputs = {
    level: attacker.level,
    weaponDamage: attacker.weaponDamage,
    gearScore: attacker.weaponGearScore,
    weaponScale: weaponScaling,
    modifierSums: attacker.attributeModSums,
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
    mitigation: constant(0),
    conversionScale: constant(1),
  } satisfies Parameters<typeof damageForWeapon>[0]

  // WEAPON

  const weaponMitigationFactor = variable(
    'weaponMitigationFactor',
    damageMitigationFactor({
      armorPenetration: value('attackerArmorPenetration', attacker.armorPenetration),
      armorRating: value('defenderArmorRating', defender.armorRating),
      gearScore: effectiveGearScore,
    }),
  )

  const weaponNoCritNoMitigation = variable(
    'weaponNoCritNoMitigation',
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
      conversionScale: weaponFactor,
      modCrit: 0,
      mitigation: constant(0),
    }),
  )

  const weaponNoCrit = variable(
    'weaponNoCrit',
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
      conversionScale: weaponFactor,
      modCrit: 0,
      mitigation: weaponMitigationFactor,
    }),
  )

  const weaponCritNoMitigation = variable(
    'weaponCritNoMitigation',
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
      conversionScale: weaponFactor,
      mitigation: constant(0),
    }),
  )

  const weaponCrit = variable(
    'weaponCrit',
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
      conversionScale: weaponFactor,
      mitigation: weaponMitigationFactor,
    }),
  )

  // AFFIX

  const affixMitigationFactor = variable(
    'affixMitigationFactor',
    damageMitigationFactor({
      armorPenetration: value('attackerArmorPenetration', attacker.armorPenetration),
      armorRating: value('defenderArmorRating', defender.armorRatingAffix),
      gearScore: effectiveGearScore,
    }),
  )

  const affixNoCritNoMitigation = variable(
    'affixNoCritNoMitigation',
    damageForWeapon({
      ...inputs,
      weaponScale: affixScaling,
      damageCoef: attacker.damageCoef,
      reductionBase: defender.reductionBaseAffix,
      modCrit: 0,
      mitigation: constant(0),
      conversionScale: affixFactor,
      modBase: attacker.modBaseAffix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
    }),
  )

  const affixNoCrit = variable(
    'affixNoCrit',
    damageForWeapon({
      ...inputs,
      weaponScale: affixScaling,
      damageCoef: attacker.damageCoef,
      reductionBase: defender.reductionBaseAffix,
      modCrit: 0,
      mitigation: affixMitigationFactor,
      conversionScale: affixFactor,
      modBase: attacker.modBaseAffix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
    }),
  )

  const affixCritNoMitigation = variable(
    'affixCritNoMitigation',
    damageForWeapon({
      ...inputs,
      weaponScale: affixScaling,
      damageCoef: attacker.damageCoef,
      reductionBase: defender.reductionBaseAffix,
      // modCrit: 0,
      mitigation: constant(0),
      conversionScale: affixFactor,
      modBase: attacker.modBaseAffix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
    }),
  )

  const affixCrit = variable(
    'affixCrit',
    damageForWeapon({
      ...inputs,
      weaponScale: affixScaling,
      damageCoef: attacker.damageCoef,
      reductionBase: defender.reductionBaseAffix,
      // modCrit: 0,
      mitigation: affixMitigationFactor,
      conversionScale: affixFactor,
      modBase: attacker.modBaseAffix,
      modDMG: attacker.modDMGAffix,
      modABS: defender.modABSAffix,
      modWKN: defender.modWKNAffix,
    }),
  )

  // DOT

  const dotTicks = variable(
    'dotTicks',
    floor(div(value('dotDuration', attacker.dotDuration ?? 0), value('dotRate', attacker.dotRate ?? 1))),
  )
  const dotMitigationFactor = variable(
    'dotMitigationFactor',
    damageMitigationFactor({
      armorPenetration: value('attackerArmorPenetration', attacker.armorPenetration),
      armorRating: value('defenderArmorRatingDot', defender.armorRatingDot),
      gearScore: effectiveGearScore,
    }),
  )
  const dotDamagePerTick = variable(
    'dotDamagePerTick',
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
      damageCoef: (attacker.dotCoef ?? 0) * (1 + (attacker.dotPotency ?? 0)),
      damageAdd: 0,
      reductionBase: defender.reductionBaseDot,
      mitigation: dotMitigationFactor,
      modCrit: 0,
      modBase: attacker.modBaseDot,
      modDMG: attacker.modDMGDot,
      modABS: defender.modABSDot,
      modWKN: defender.modWKNDot,
    }),
  )
  const dotDamagePerTickNoMitigation = variable(
    'dotDamagePerTickNoMitigation',
    damageForWeapon({
      ...inputs,
      weaponScale: weaponScaling,
      damageCoef: (attacker.dotCoef ?? 0) * (1 + (attacker.dotPotency ?? 0)),
      damageAdd: 0,
      reductionBase: defender.reductionBaseDot,
      modCrit: 0,
      mitigation: constant(0),
      modBase: attacker.modBaseDot,
      modDMG: attacker.modDMGDot,
      modABS: defender.modABSDot,
      modWKN: defender.modWKNDot,
    }),
  )
  const dotDamageAccumulated = variable('dotDamageAccumulated', mul(dotTicks, floor(dotDamagePerTick)))
  const dotDamageAccumulatedNoMitigation = variable(
    'dotDamageAccumulatedNoMitigation',
    mul(dotTicks, floor(dotDamagePerTickNoMitigation)),
  )

  // SUMS

  const weapon = {
    noCritNoMitigation: weaponNoCritNoMitigation,
    noCrit: weaponNoCrit,

    critNoMitigation: weaponCritNoMitigation,
    crit: weaponCrit,

    mitigationNoCrit: weaponNoCritNoMitigation.value - weaponNoCrit.value,
    mitigationCrit: weaponCritNoMitigation.value - weaponCrit.value,
    mitigation: weaponMitigationFactor.value,

    factor: weaponFactor.value,
  }
  const affix = {
    noCritNoMitigation: affixNoCritNoMitigation,
    noCrit: affixNoCrit,

    critNoMitigation: affixCritNoMitigation,
    crit: affixCrit,

    mitigationNoCrit: affixNoCritNoMitigation.value - affixNoCrit.value,
    mitigationCrit: affixCritNoMitigation.value - affixCrit.value,
    mitigation: affixMitigationFactor.value,

    factor: affixFactor.value,
  }
  const dot = {
    ticks: dotTicks,

    perTick: dotDamagePerTick,
    perTickNoMitigation: dotDamagePerTickNoMitigation,

    damage: dotDamageAccumulated,
    damageNoMitigation: dotDamageAccumulatedNoMitigation,

    mitigationPerTick: dotDamagePerTickNoMitigation.value - dotDamagePerTick.value,
    mitigationTotal: dotDamageAccumulatedNoMitigation.value - dotDamageAccumulated.value,
    mitigation: dotMitigationFactor.value,
  }
  const total = {
    noCritNoMitigation: weaponNoCritNoMitigation.value + affixNoCritNoMitigation.value,
    noCrit: weaponNoCrit.value + affixNoCrit.value,

    critNoMitigation: weaponCritNoMitigation.value + affixCritNoMitigation.value,
    crit: weaponCrit.value + affixCrit.value,
  }

  return {
    weapon,
    affix,
    total,
    dot,
  }
}
