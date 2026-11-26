import { describe, expect, it } from 'vitest'
import { formatTimeOfDay } from './TimeOfDayButton.store'

describe('formatTimeOfDay', () => {
  it('pads hours and minutes', () => {
    expect(formatTimeOfDay(0)).toBe('00:00')
    expect(formatTimeOfDay(6.5)).toBe('06:30')
    expect(formatTimeOfDay(13.75)).toBe('13:45')
  })

  it('shows full minutes', () => {
    expect(formatTimeOfDay(8.1)).toBe('08:06')
    expect(formatTimeOfDay(12.999)).toBe('12:59')
    for (let minutes = 0; minutes < 24 * 60; minutes++) {
      const expected = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      expect(formatTimeOfDay(minutes / 60)).toBe(expected)
    }
  })

  it('shows the end of the day as midnight', () => {
    expect(formatTimeOfDay(24)).toBe('00:00')
  })
})
