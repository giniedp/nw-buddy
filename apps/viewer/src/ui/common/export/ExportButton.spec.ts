import { describe, expect, it } from 'vitest'
import { progressText } from './ExportButton.store'

describe('progressText', () => {
  it('tells the percent when the size is known', () => {
    expect(progressText(512, 1024)).toBe('50%')
  })

  it('tells the bytes loaded without a size', () => {
    expect(progressText(10 * 1024, 0)).toBe('10 KB')
    expect(progressText(3.5 * 1024 * 1024, 0)).toBe('3.5 MB')
  })
})
