import { type IVec3 } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import { Spline, SplineWidth } from './Spline'

function expectVec(actual: IVec3, expected: number[], digits = 4) {
  expect(actual.x).toBeCloseTo(expected[0], digits)
  expect(actual.y).toBeCloseTo(expected[1], digits)
  expect(actual.z).toBeCloseTo(expected[2], digits)
}

describe('Spline', () => {
  it('linear: length, addressing, position and normal', () => {
    const spline = new Spline({
      type: 'Linear',
      closed: false,
      vertices: [
        [0, 0, 0],
        [10, 0, 0],
        [10, 10, 0],
      ],
    })
    expect(spline.segmentCount).toBe(2)
    expect(spline.length).toBeCloseTo(20)

    const address = spline.addressByDistance(15)
    expect(address.segment).toBe(1)
    expect(address.fraction).toBeCloseTo(0.5)
    expectVec(spline.position(address), [10, 5, 0])

    // tangent +x on the first segment, normal is the tangent rotated around z
    expectVec(spline.normal(spline.addressByDistance(5)), [0, 1, 0])
    expectVec(spline.normal(address), [-1, 0, 0])

    // past the end clamps to the last vertex
    expectVec(spline.position(spline.addressByDistance(100)), [10, 10, 0])
    expect(spline.lengthAtVertex(1)).toBeCloseTo(10)
    expect(spline.lengthAtVertex(2)).toBeCloseTo(20)
  })

  it('linear closed: includes the segment back to the first vertex', () => {
    const spline = new Spline({
      type: 'Linear',
      closed: true,
      vertices: [
        [0, 0, 0],
        [10, 0, 0],
        [10, 10, 0],
        [0, 10, 0],
      ],
    })
    expect(spline.segmentCount).toBe(4)
    expect(spline.length).toBeCloseTo(40)
    expectVec(spline.position(spline.addressByDistance(35)), [0, 5, 0])
  })

  it('bezier: real road data, straight with control points', () => {
    // r_+03_+01, 41_Decal_G, control points are absolute in entity space
    const spline = new Spline({
      type: 'Bezier',
      closed: false,
      granularity: 8,
      vertices: [
        [0, -11.311295, 0],
        [0, 2.4927309, 0],
      ],
      bezier: [
        { back: [0, -11.311295, 0], forward: [0, -6.709953, 0], angle: 0 },
        { back: [0, -2.1086113, 0], forward: [0, 2.4927309, 0], angle: 0 },
      ],
    })
    expect(spline.length).toBeCloseTo(13.804, 2)
    expectVec(spline.position({ segment: 0, fraction: 0 }), [0, -11.311295, 0])
    expectVec(spline.position({ segment: 0, fraction: 1 }), [0, 2.4927309, 0])
    // tangent +y, normal -x
    expectVec(spline.normal({ segment: 0, fraction: 0.5 }), [-1, 0, 0])
  })

  it('bezier: curved segment, tangent follows the control points', () => {
    const spline = new Spline({
      type: 'Bezier',
      closed: false,
      granularity: 64,
      vertices: [
        [0, 0, 0],
        [10, 10, 0],
      ],
      bezier: [
        { back: [0, 0, 0], forward: [10, 0, 0], angle: 0 },
        { back: [10, 0, 0], forward: [10, 10, 0], angle: 0 },
      ],
    })
    expectVec(spline.tangent({ segment: 0, fraction: 0 }), [1, 0, 0])
    expectVec(spline.tangent({ segment: 0, fraction: 1 }), [0, 1, 0])
    // longer than the chord, shorter than the control polygon
    expect(spline.length).toBeGreaterThan(Math.SQRT2 * 10)
    expect(spline.length).toBeLessThan(20)
  })

  it('catmull rom: open spline spans from the second to the second last vertex', () => {
    const spline = new Spline({
      type: 'CatmullRom',
      closed: false,
      granularity: 16,
      knotParameterization: 0.5,
      vertices: [
        [-10, 0, 0],
        [0, 0, 0],
        [10, 0, 0],
        [20, 0, 0],
        [30, 0, 0],
      ],
    })
    expect(spline.segmentCount).toBe(2)
    expect(spline.begin).toBe(1)
    expect(spline.length).toBeCloseTo(20, 3)
    expectVec(spline.position(spline.addressByDistance(0)), [0, 0, 0])
    expectVec(spline.position(spline.addressByDistance(spline.length)), [20, 0, 0])
    expectVec(spline.position(spline.addressByDistance(10)), [10, 0, 0], 3)
    expectVec(spline.normal(spline.addressByDistance(5)), [0, 1, 0])
  })
})

describe('SplineWidth', () => {
  it('adds eased per vertex offsets to the default width', () => {
    const spline = new Spline({
      type: 'Linear',
      closed: false,
      vertices: [
        [0, 0, 0],
        [10, 0, 0],
      ],
    })
    const width = new SplineWidth(4, [0, 2], spline)
    expect(width.at(0)).toBeCloseTo(4)
    expect(width.at(5)).toBeCloseTo(5)
    expect(width.at(10)).toBeCloseTo(6)
    // ease in out, slower than linear at the start
    expect(width.at(2.5)).toBeLessThan(4.5)
  })

  it('uses the default width without per vertex widths', () => {
    const spline = new Spline({
      type: 'Linear',
      closed: false,
      vertices: [
        [0, 0, 0],
        [10, 0, 0],
      ],
    })
    expect(new SplineWidth(8, undefined, spline).at(3)).toBe(8)
  })
})
