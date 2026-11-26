import { describe, expect, it } from 'vitest'
import { materialInfo } from './MaterialMode.store'

describe('materialInfo', () => {
  it('counts the sub materials, loading without any', () => {
    expect(materialInfo(0)).toBe('loading')
    expect(materialInfo(1)).toBe('1 sub material')
    expect(materialInfo(4)).toBe('4 sub materials')
  })
})
