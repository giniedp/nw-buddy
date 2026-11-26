import { describe, expect, it } from 'vitest'
import { formatBytes, formatBytesExact } from './format'

describe('formatBytes', () => {
  it('picks the unit', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KiB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MiB')
    expect(formatBytes(1.25 * 1024 * 1024 * 1024)).toBe('1.25 GiB')
  })

  it('adds the exact count', () => {
    expect(formatBytesExact(1536)).toBe(`1.5 KiB (${(1536).toLocaleString()} bytes)`)
  })
})
