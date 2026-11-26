import { describe, expect, it } from 'vitest'
import { popoverLeft } from './TabStrip.store'

describe('popoverLeft', () => {
  it('keeps a popover below its anchor inside the window', () => {
    expect(popoverLeft(100, 200, 1000)).toBe(100)
    expect(popoverLeft(900, 200, 1000)).toBe(796)
    expect(popoverLeft(-10, 200, 1000)).toBe(4)
  })
})
