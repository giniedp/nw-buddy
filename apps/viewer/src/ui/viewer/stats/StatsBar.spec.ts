import { describe, expect, it } from 'vitest'
import { formatStat, taskCountColor } from './StatsBar.store'

describe('taskCountColor', () => {
  it('keeps the text color up to 50', () => {
    expect(taskCountColor(0)).toBeNull()
    expect(taskCountColor(50)).toBeNull()
  })

  it('blends to orange at 500 and to red at 1000', () => {
    expect(taskCountColor(275)).toBe('color-mix(in oklab, orange 50%, var(--nw-text))')
    expect(taskCountColor(500)).toBe('color-mix(in oklab, red 0%, orange)')
    expect(taskCountColor(750)).toBe('color-mix(in oklab, red 50%, orange)')
  })

  it('stays red from 1000', () => {
    expect(taskCountColor(1000)).toBe('red')
    expect(taskCountColor(5000)).toBe('red')
  })
})

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
