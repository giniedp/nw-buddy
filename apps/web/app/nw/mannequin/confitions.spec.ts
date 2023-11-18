import { Ability } from '@nw-data/generated'
import { checkHealthCondition, checkManaCondition } from './conditions'

fdescribe('Mannequin / Conditions', () => {
  const empty: Ability = {} as Ability
  it('checkHealthCondition', () => {
    expect(checkHealthCondition({}, null)).toBe(false)
    expect(checkHealthCondition({}, empty)).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.5 }, { ...empty, MyComparisonType: 'Equal', MyHealthPercent: 0.5 })).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'Equal', MyHealthPercent: 0.5 })).toBe(false)
    expect(checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'LessThan', MyHealthPercent: 0.5 })).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 0.5 })).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 0.4 })).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 0.3 })).toBe(false)
    expect(checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'GreaterThan', MyHealthPercent: 0.3 })).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.4 }, { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 0.3 })).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.3 }, { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 0.3 })).toBe(true)
    expect(checkHealthCondition({ myHealthPercent: 0.2 }, { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 0.3 })).toBe(false)
  })

  it('checkManaCondition', () => {
    expect(checkManaCondition({}, null)).toBe(false)
    expect(checkManaCondition({}, empty)).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.5 }, { ...empty, MyManaComparisonType: 'Equal', MyManaPercent: 0.5 })).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'Equal', MyManaPercent: 0.5 })).toBe(false)
    expect(checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'LessThan', MyManaPercent: 0.5 })).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 0.5 })).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 0.4 })).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 0.3 })).toBe(false)
    expect(checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'GreaterThan', MyManaPercent: 0.3 })).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.4 }, { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 0.3 })).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.3 }, { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 0.3 })).toBe(true)
    expect(checkManaCondition({ myManaPercent: 0.2 }, { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 0.3 })).toBe(false)
  })
})
