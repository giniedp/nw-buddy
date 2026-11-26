import { describe, expect, it } from 'vitest'
import { formatStat } from './StatsBar.store'

describe('formatStat', () => {
  it('rounds to the fraction digits', () => {
    expect(formatStat(12.345, 2)).toBe('12.35')
    expect(formatStat(12.6)).toBe('13')
  })

  it('pads with zeros to the width, so the bar does not jump', () => {
    expect(formatStat(7, 0, 3)).toBe('007')
    expect(formatStat(1.5, 2, 5)).toBe('01.50')
  })

  it('keeps values longer than the width', () => {
    expect(formatStat(12345, 0, 3)).toBe('12345')
  })

  it('shows - for values that are not finite', () => {
    expect(formatStat(NaN, 2, 5)).toBe('-')
    expect(formatStat(Infinity)).toBe('-')
  })
})
