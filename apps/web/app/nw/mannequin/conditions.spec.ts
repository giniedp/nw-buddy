import { AbilityData } from '@nw-data/generated'
import {
  checkAbilityCooldownCondition,
  checkAmmoCountCondition,
  checkHealthCondition,
  checkManaCondition,
  checkTargetEffectCondition,
} from './conditions'

describe('Mannequin / Conditions', () => {
  const empty: AbilityData = {} as AbilityData
  it('checkHealthCondition', () => {
    expect(checkHealthCondition({}, null)).toBe(false)
    expect(checkHealthCondition({}, empty)).toBe(true)
    expect(
      checkHealthCondition({ myHealthPercent: 0.5 }, { ...empty, MyComparisonType: 'Equal', MyHealthPercent: 50 }),
    ).toBe(true)
    expect(
      checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'Equal', MyHealthPercent: 50 }),
    ).toBe(false)
    expect(
      checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'LessThan', MyHealthPercent: 50 }),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 },
        { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 50 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 },
        { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 40 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 },
        { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(false)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 },
        { ...empty, MyComparisonType: 'GreaterThan', MyHealthPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 },
        { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.3 },
        { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.2 },
        { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(false)
  })

  it('checkManaCondition', () => {
    expect(checkManaCondition({}, null)).toBe(false)
    expect(checkManaCondition({}, empty)).toBe(true)
    expect(
      checkManaCondition({ myManaPercent: 0.5 }, { ...empty, MyManaComparisonType: 'Equal', MyManaPercent: 50 }),
    ).toBe(true)
    expect(
      checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'Equal', MyManaPercent: 50 }),
    ).toBe(false)
    expect(
      checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'LessThan', MyManaPercent: 50 }),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 },
        { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 50 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 },
        { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 40 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 },
        { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(false)
    expect(
      checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'GreaterThan', MyManaPercent: 30 }),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 },
        { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.3 },
        { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.2 },
        { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(false)
  })

  it('checkAmmoCountCondition', () => {
    expect(checkAmmoCountCondition({}, null)).toBe(false)
    expect(checkAmmoCountCondition({}, empty)).toBe(true)
  })

  it('checkAbilityCooldownCondition', () => {
    expect(checkAbilityCooldownCondition({}, null)).toBe(false)
    expect(checkAbilityCooldownCondition({}, empty)).toBe(true)
  })

  it('checkTargetEffectCondition', () => {
    expect(checkTargetEffectCondition({}, null)).toBe(false)
    expect(checkTargetEffectCondition({}, empty)).toBe(true)
  })
})
