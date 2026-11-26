import { describe, expect, it } from 'vitest'
import { toolOf } from './tools'

describe('toolOf', () => {
  it('names the tool of a path', () => {
    expect(toolOf('/data/ItemData')).toBe('data')
    expect(toolOf('/browser')).toBe('browser')
    expect(toolOf('/other')).toBeNull()
    expect(toolOf('')).toBeNull()
  })
})
