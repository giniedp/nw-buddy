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
    expect(checkHealthCondition({} as any, null)).toBe(false)
    expect(checkHealthCondition({} as any, empty)).toBe(true)
    expect(
      checkHealthCondition({ myHealthPercent: 0.5 } as any, { ...empty, MyComparisonType: 'Equal', MyHealthPercent: 50 }),
    ).toBe(true)
    expect(
      checkHealthCondition({ myHealthPercent: 0.4 } as any, { ...empty, MyComparisonType: 'Equal', MyHealthPercent: 50 }),
    ).toBe(false)
    expect(
      checkHealthCondition({ myHealthPercent: 0.4 } as any, { ...empty, MyComparisonType: 'LessThan', MyHealthPercent: 50 }),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 } as any,
        { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 50 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 } as any,
        { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 40 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 } as any,
        { ...empty, MyComparisonType: 'LessThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(false)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 } as any,
        { ...empty, MyComparisonType: 'GreaterThan', MyHealthPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.4 } as any,
        { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.3 } as any,
        { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkHealthCondition(
        { myHealthPercent: 0.2 } as any,
        { ...empty, MyComparisonType: 'GreaterThanOrEqual', MyHealthPercent: 30 },
      ),
    ).toBe(false)
  })

  it('checkManaCondition', () => {
    expect(checkManaCondition({} as any, null)).toBe(false)
    expect(checkManaCondition({} as any, empty)).toBe(true)
    expect(
      checkManaCondition({ myManaPercent: 0.5 } as any, { ...empty, MyManaComparisonType: 'Equal', MyManaPercent: 50 }),
    ).toBe(true)
    expect(
      checkManaCondition({ myManaPercent: 0.4 } as any, { ...empty, MyManaComparisonType: 'Equal', MyManaPercent: 50 }),
    ).toBe(false)
    expect(
      checkManaCondition({ myManaPercent: 0.4 } as any, { ...empty, MyManaComparisonType: 'LessThan', MyManaPercent: 50 }),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 } as any,
        { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 50 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 } as any,
        { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 40 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 } as any,
        { ...empty, MyManaComparisonType: 'LessThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(false)
    expect(
      checkManaCondition({ myManaPercent: 0.4 } as any, { ...empty, MyManaComparisonType: 'GreaterThan', MyManaPercent: 30 }),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.4 } as any,
        { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.3 } as any,
        { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(true)
    expect(
      checkManaCondition(
        { myManaPercent: 0.2 } as any,
        { ...empty, MyManaComparisonType: 'GreaterThanOrEqual', MyManaPercent: 30 },
      ),
    ).toBe(false)
  })

  it('checkAmmoCountCondition', () => {
    expect(checkAmmoCountCondition({} as any, null)).toBe(false)
    expect(checkAmmoCountCondition({} as any, empty)).toBe(true)
  })

  it('checkAbilityCooldownCondition', () => {
    expect(checkAbilityCooldownCondition({} as any, null)).toBe(false)
    expect(checkAbilityCooldownCondition({} as any, empty)).toBe(true)
  })

  it('checkTargetEffectCondition', () => {
    expect(checkTargetEffectCondition({} as any, null)).toBe(false)
    expect(checkTargetEffectCondition({} as any, empty)).toBe(true)
  })
})
