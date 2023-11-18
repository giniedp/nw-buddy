import { Ability, ComparisonType } from '@nw-data/generated'
import { MannequinState } from './types'

export function checkAllConditions(ability: Ability, state: MannequinState) {
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
    checkNumConsecutiveHits(state, ability)
  )
}

export function checkHealthCondition(state: MannequinState, ability: Ability) {
  return !!ability && checkCondition(state.myHealthPercent, ability.MyHealthPercent, ability.MyComparisonType)
}
export function checkManaCondition(state: MannequinState, ability: Ability) {
  return !!ability && checkCondition(state.myManaPercent, ability.MyManaPercent, ability.MyManaComparisonType)
}
export function checkStaminaCondition(state: MannequinState, ability: Ability) {
  return !!ability && checkCondition(state.myStaminaPercent, ability.MyStaminaPercent, ability.MyStaminaComparisonType)
}
export function checkAmmoCountCondition(state: MannequinState, ability: Ability) {
  return false // !!ability && checkCondition(0, ability.LoadedAmmoCount, ability.LoadedAmmoCountComparisonType)
}
export function checkAbilityCooldownCondition(state: MannequinState, ability: Ability) {
  return false // !!ability && checkCondition(0, 0, ability.AbilityCooldownComparisonType)
}
export function checkNumberOfHitsCondition(state: MannequinState, ability: Ability) {
  return !!ability && checkCondition(state.numHits, ability.NumberOfTrackedHits, ability.NumberOfHitsComparisonType)
}
export function checkNumAroundMeCondition(state: MannequinState, ability: Ability) {
  return !!ability && checkCondition(state.numAroundMe, ability.NumAroundMe, ability.NumAroundComparisonType)
}
export function checkTargetHealthCondition(state: MannequinState, ability: Ability) {
  return !!ability && checkCondition(1, ability.TargetHealthPercent, ability.TargetComparisonType)
}
export function checkDistanceCondition(state: MannequinState, ability: Ability) {
  return !!ability && checkCondition(1, ability.DistFromDefender, ability.DistComparisonType)
}
export function checkTargetEffectCondition(state: MannequinState, ability: Ability) {
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
  return false
}
export function checkNumConsecutiveHits(state: MannequinState, ability: Ability) {
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
