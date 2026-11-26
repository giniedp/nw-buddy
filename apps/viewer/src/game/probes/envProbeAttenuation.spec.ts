import { describe, expect, it } from 'vitest'
import { envProbeAttenuation } from './envProbeAttenuation'

// prettier-ignore
const identityAt = (x: number, y: number, z: number) => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  x, y, z, 1,
]

const extents = { x: 10, y: 20, z: 5 }

describe('envProbeAttenuation', () => {
  it('is 1 at the probe center', () => {
    expect(envProbeAttenuation(identityAt(1, 2, 3), extents, 0.3, { x: 1, y: 2, z: 3 })).toBe(1)
  })

  it('is 0 outside of the box', () => {
    expect(envProbeAttenuation(identityAt(0, 0, 0), extents, 0.3, { x: 10, y: 0, z: 0 })).toBe(0)
    expect(envProbeAttenuation(identityAt(0, 0, 0), extents, 0.3, { x: 0, y: 0, z: -5.01 })).toBe(0)
  })

  it('is measured relative to the extents of each axis', () => {
    const onX = envProbeAttenuation(identityAt(0, 0, 0), extents, 1, { x: 9, y: 0, z: 0 })
    const onZ = envProbeAttenuation(identityAt(0, 0, 0), extents, 1, { x: 0, y: 0, z: 4.5 })
    expect(onX).toBeGreaterThan(0)
    expect(onX).toBeCloseTo(onZ, 6)
  })

  it('reaches full strength earlier with a small falloff', () => {
    const point = { x: 8, y: 0, z: 0 }
    const small = envProbeAttenuation(identityAt(0, 0, 0), extents, 0.1, point)
    const large = envProbeAttenuation(identityAt(0, 0, 0), extents, 1, point)
    expect(small).toBeGreaterThan(large)
  })

  it('follows the probe rotation', () => {
    // 90° around z: local x points along world y
    // prettier-ignore
    const rotated = [
      0, 1, 0, 0,
      -1, 0, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
    // inside of the 20 extent of local y (world -x), outside of the 10 extent of local x (world y)
    expect(envProbeAttenuation(rotated, extents, 0.3, { x: 15, y: 0, z: 0 })).toBeGreaterThan(0)
    expect(envProbeAttenuation(rotated, extents, 0.3, { x: 0, y: 15, z: 0 })).toBe(0)
  })

  it('clamps the falloff to avoid a division by zero', () => {
    expect(envProbeAttenuation(identityAt(0, 0, 0), extents, 0, { x: 1, y: 0, z: 0 })).toBe(1)
  })
})
