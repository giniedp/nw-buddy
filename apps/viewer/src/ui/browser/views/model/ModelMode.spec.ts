import { describe, expect, it } from 'vitest'
import { lodInfo } from './ModelMode.store'

describe('lodInfo', () => {
  it('tells the rendered level', () => {
    expect(lodInfo(1, 3)).toBe('LOD 1 of 3')
  })

  it('tells a model without levels', () => {
    expect(lodInfo(0, 0)).toBe('no levels of detail')
  })
})
