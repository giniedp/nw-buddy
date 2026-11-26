import { describe, expect, it } from 'vitest'
import { longestKey } from './LocMode.store'

describe('longestKey', () => {
  it('counts the characters of the longest key', () => {
    expect(longestKey([])).toBe(0)
    expect(
      longestKey([
        { key: 'a', value: 'x' },
        { key: 'abc', value: '' },
        { key: 'ab', value: 'y' },
      ]),
    ).toBe(3)
  })

  it('handles more rows than a spread into Math.max can', () => {
    const rows = Array.from({ length: 200_000 }, (_, i) => ({ key: String(i), value: '' }))
    expect(longestKey(rows)).toBe(6)
  })
})
