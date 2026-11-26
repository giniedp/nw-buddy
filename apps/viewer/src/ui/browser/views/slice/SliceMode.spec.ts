import { describe, expect, it } from 'vitest'
import type { BrowseSlice } from '../../../../api/browse'
import { sliceInfo } from './SliceMode.store'

describe('sliceInfo', () => {
  it('counts the meshes and the slices', () => {
    const slices = { a: {}, b: {}, c: {} } as unknown as BrowseSlice['slices']
    expect(sliceInfo({ meshes: 12, slices })).toBe('12 meshes in 3 slices')
  })
})
