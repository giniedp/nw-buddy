import { AbilityData, ComparisonType, EquipLoadCategory } from '@nw-data/generated'
import { MannequinState } from './types'

export function checkAllConditions(ability: AbilityData, equipLoadCategory: EquipLoadCategory, state: MannequinState) {
  return (
    checkHealthCondition(state, ability) &&
    checkManaCondition(state, ability) &&
    checkStaminaCondition(state, ability) &&
    checkAmmoCountCondition(state, ability) &&
    checkAbilityCooldownCondition(state, ability) &&
    checkNumberOfHitsCondition(state, ability) &&
    checkNumAroundMeCondition(state, ability) &&
    checkTargetHealthCondition(state, ability) &&
    checkDistanceCondition(state, ability) &&
    checkTargetEffectCondition(state, ability) &&
    checkNumConsecutiveHits(state, ability) &&
    checkEquipLoadCategory(ability, equipLoadCategory)
  )
}

export function checkHealthCondition(state: MannequinState, ability: AbilityData) {
  return !!ability && checkCondition(state.myHealthPercent, ability.MyHealthPercent / 100, ability.MyComparisonType)
}
export function checkManaCondition(state: MannequinState, ability: AbilityData) {
  return !!ability && checkCondition(state.myManaPercent, ability.MyManaPercent / 100, ability.MyManaComparisonType)
}
export function checkStaminaCondition(state: MannequinState, ability: AbilityData) {
  return (
    !!ability && checkCondition(state.myStaminaPercent, ability.MyStaminaPercent / 100, ability.MyStaminaComparisonType)
  )
}
export function checkAmmoCountCondition(state: MannequinState, ability: AbilityData) {
  return !!ability // && checkCondition(0, ability.LoadedAmmoCount, ability.LoadedAmmoCountComparisonType)
}
export function checkAbilityCooldownCondition(state: MannequinState, ability: AbilityData) {
  return !!ability // && checkCondition(0, 0, ability.AbilityCooldownComparisonType)
}
export function checkNumberOfHitsCondition(state: MannequinState, ability: AbilityData) {
  return !!ability && checkCondition(state.numHits, ability.NumberOfTrackedHits, ability.NumberOfHitsComparisonType)
}
export function checkNumAroundMeCondition(state: MannequinState, ability: AbilityData) {
  return !!ability && checkCondition(state.numAroundMe, ability.NumAroundMe, ability.NumAroundComparisonType)
}
export function checkTargetHealthCondition(state: MannequinState, ability: AbilityData) {
  return !!ability && checkCondition(1, ability.TargetHealthPercent / 100, ability.TargetComparisonType)
}
export function checkDistanceCondition(state: MannequinState, ability: AbilityData) {
  return !!ability && checkCondition(1, ability.DistFromDefender, ability.DistComparisonType)
}
export function checkTargetEffectCondition(state: MannequinState, ability: AbilityData) {
  if (!ability) {
    return false
  }
  if (ability.TargetStatusEffect) {
    return checkCondition('', ability.TargetStatusEffect, ability.TargetStatusEffectComparison as ComparisonType)
  }
  if (ability.TargetStatusEffectCategory) {
    return checkCondition(
      '',
      ability.TargetStatusEffectCategory?.[0],
      ability.TargetStatusEffectComparison as ComparisonType,
    )
  }
  return true
}
export function checkNumConsecutiveHits(state: MannequinState, ability: AbilityData) {
  if (!ability) {
    return false
  }
  if (ability.NumConsecutiveHits == null) {
    return true
  }
  const actual = state.numHits
  const limit = ability.NumConsecutiveHits
  return actual >= limit
}
export function checkEquipLoadCategory(ability: AbilityData, equipLoadCategory: EquipLoadCategory) {
  if (!ability) {
    return false
  }
  if (!ability.EquipLoadCategory?.length) {
    return true
  }
  return ability.EquipLoadCategory.includes(equipLoadCategory)
}
function checkCondition<T extends string | number>(actual: T, limit: T, comparison: ComparisonType) {
  if (!comparison) {
    return true
  }
  switch (comparison) {
    case 'Equal':
      return actual === limit
    case 'GreaterThan':
      return actual > limit
    case 'GreaterThanOrEqual':
      return actual >= limit
    case 'LessThan':
      return actual < limit
    case 'LessThanOrEqual':
      return actual <= limit
  }
  return false
}
