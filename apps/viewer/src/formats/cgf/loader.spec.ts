import { describe, expect, it } from 'vitest'
import { ENGINE_MAX_LOD_LEVEL } from '../../constants'
import { siblingLodCount, siblingLodLevels } from './loader'

describe('siblingLodCount', () => {
  it('reads the count of the server', () => {
    expect(siblingLodCount(new Headers({ 'X-Lod-Count': '2' }))).toBe(2)
    expect(siblingLodCount(new Headers({ 'X-Lod-Count': '0' }))).toBe(0)
  })

  it('is unknown without a valid header', () => {
    expect(siblingLodCount(new Headers())).toBeNull()
    expect(siblingLodCount(new Headers({ 'X-Lod-Count': 'x' }))).toBeNull()
    expect(siblingLodCount(null)).toBeNull()
  })
})

describe('siblingLodLevels', () => {
  it('takes the levels the server reports', () => {
    expect(siblingLodLevels({ haveAutoLods: true, siblingLods: 2 })).toBe(2)
    expect(siblingLodLevels({ haveAutoLods: true, siblingLods: 0 })).toBe(0)
  })

  it('probes up to the engine maximum when unknown', () => {
    expect(siblingLodLevels({ haveAutoLods: true, siblingLods: null })).toBe(ENGINE_MAX_LOD_LEVEL)
  })

  it('has none without the auto lods flag', () => {
    expect(siblingLodLevels({ haveAutoLods: false, siblingLods: 3 })).toBe(0)
  })
})
