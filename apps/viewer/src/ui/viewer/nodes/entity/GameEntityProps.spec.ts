import { describe, expect, it } from 'vitest'
import { sourceFiles } from './GameEntityProps.store'

describe('sourceFiles', () => {
  it('is empty without a mesh loader', () => {
    expect(sourceFiles(null)).toEqual([])
  })

  it('lists the model alone when it has no material', () => {
    const files = sourceFiles({ data: { mesh: 'objects/props/crate.cgf' } } as any)
    expect(files.map((it) => it.label)).toEqual(['Model'])
    expect(files[0].material).toBeUndefined()
  })

  it('lists the model with its material, and the material', () => {
    const files = sourceFiles({ data: { mesh: 'objects/props/crate.cgf', material: 'objects/props/crate' } } as any)
    expect(files.map((it) => it.label)).toEqual(['Model', 'Material'])
    expect(files[0].material).toBe(files[1].path)
  })
})
