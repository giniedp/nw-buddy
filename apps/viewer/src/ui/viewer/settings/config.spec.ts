import { describe, expect, it } from 'vitest'
import type { ConfigSchema } from '../../../config'
import { configGroups, parseNumberList, stepDecimals } from './config'

describe('configGroups', () => {
  const schema = {
    a: { group: 'Render' },
    b: {},
    c: { group: 'Render' },
    d: { group: 'Audio' },
  } as unknown as ConfigSchema

  it('groups the names, groups in the order of their first property', () => {
    expect(configGroups(schema, ['a', 'b', 'c', 'd'])).toEqual([
      { title: 'Render', names: ['a', 'c'] },
      { title: 'General', names: ['b'] },
      { title: 'Audio', names: ['d'] },
    ])
  })

  it('is empty without names', () => {
    expect(configGroups(schema, [])).toEqual([])
  })

  it('leaves out hidden properties', () => {
    const withHidden = { ...schema, e: { group: 'Render', hidden: true } } as unknown as ConfigSchema
    expect(configGroups(withHidden, ['a', 'e'])).toEqual([{ title: 'Render', names: ['a'] }])
  })
})

describe('stepDecimals', () => {
  it('shows the fraction digits of the step', () => {
    expect(stepDecimals(0.0005)).toBe(4)
    expect(stepDecimals(0.1)).toBe(1)
    expect(stepDecimals(5)).toBe(0)
  })

  it('shows 3 digits without a step', () => {
    expect(stepDecimals(undefined)).toBe(3)
    expect(stepDecimals(0)).toBe(3)
  })
})

describe('parseNumberList', () => {
  it('reads comma separated numbers', () => {
    expect(parseNumberList('1, 2.5 ,3')).toEqual([1, 2.5, 3])
  })
})
