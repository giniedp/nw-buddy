import type { GeometryBuilder } from '@gglib/graphics'
import { describe, expect, it } from 'vitest'
import type { ViewerShape } from '../../api'
import { buildWaterVolumeMesh, shapeOutline, triangulate } from './WaterVolumeMesh'

// column major translation
const translate = (x: number, y: number, z: number) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
const options = { uScale: 0.5, vScale: 0.25, fogColor: [0.1, 0.2, 0.3], fogDensity: 0.4 }

function vertices(mesh: GeometryBuilder) {
  return Array.from({ length: mesh.vertexCount }, (_, i) => mesh.readVertex(i))
}

function triangleAreas(mesh: GeometryBuilder) {
  const p = vertices(mesh).map((v) => v['position'])
  const result: number[] = []
  for (let t = 0; t < mesh.indexCount; t += 3) {
    const [a, b, c] = [p[mesh.indices[t]], p[mesh.indices[t + 1]], p[mesh.indices[t + 2]]]
    result.push(((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2)
  }
  return result
}

// an L shaped pool, clockwise, 3 x 3 minus the top right 2 x 2 quarter: area 5
const lShape: ViewerShape = {
  kind: 'prism',
  height: 2,
  vertices: [
    [0, 0],
    [0, 3],
    [1, 3],
    [1, 1],
    [3, 1],
    [3, 0],
  ],
}

describe('buildWaterVolumeMesh', () => {
  it('puts the surface on top of the prism, flat at the entity height + prism height', () => {
    const mesh = buildWaterVolumeMesh(lShape, translate(100, 200, 50), options)!
    for (const { position } of vertices(mesh)) {
      expect(position[2]).toBeCloseTo(52)
    }
  })

  it('triangulates concave outlines counter clockwise, covering the polygon area', () => {
    const mesh = buildWaterVolumeMesh(lShape, translate(0, 0, 0), options)!
    const areas = triangleAreas(mesh)
    for (const area of areas) {
      expect(area).toBeGreaterThan(0)
    }
    expect(areas.reduce((a, b) => a + b)).toBeCloseTo(5)
  })

  it('maps uv from the world offset to the first vertex times the surface scale', () => {
    const mesh = buildWaterVolumeMesh(lShape, translate(100, 200, 50), options)!
    for (const { position, texture } of vertices(mesh)) {
      expect(texture[0]).toBeCloseTo(0.5 * (position[0] - 100))
      expect(texture[1]).toBeCloseTo(0.25 * (position[1] - 200))
    }
  })

  it('carries the fog in the vertex color, without edge fade', () => {
    const mesh = buildWaterVolumeMesh(lShape, translate(0, 0, 0), options)!
    for (const { color, fade, normal } of vertices(mesh)) {
      expect(color).toEqual([expect.closeTo(0.1), expect.closeTo(0.2), expect.closeTo(0.3), expect.closeTo(0.4)])
      expect(fade).toEqual([1, 1, 1, 1])
      expect(normal[2]).toBeCloseTo(1)
    }
  })
})

describe('buildWaterVolumeMesh fog', () => {
  it('stores fog not affected by the sun as negative density', () => {
    const mesh = buildWaterVolumeMesh(lShape, translate(0, 0, 0), { ...options, fogAffectedBySun: false })!
    expect(mesh.readVertex(0)['color'][3]).toBeCloseTo(-0.4)
  })
})

describe('shapeOutline', () => {
  it('uses the top of box and cylinder shapes', () => {
    const box = shapeOutline({ kind: 'box', halfExtents: [2, 3, 1] })!
    expect(box).toHaveLength(4)
    for (const p of box) {
      expect(p.z).toBe(1)
      expect(Math.abs(p.x)).toBe(2)
      expect(Math.abs(p.y)).toBe(3)
    }
    const cylinder = shapeOutline({ kind: 'cylinder', radius: 2.5, height: 4 })!
    // segments: 4 per meter of the rounded up radius + 16
    expect(cylinder).toHaveLength(3 * 4 + 16)
    for (const p of cylinder) {
      expect(p.z).toBe(2)
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(2.5)
    }
  })
})

describe('triangulate', () => {
  it('returns no triangles for degenerate input', () => {
    expect(
      triangulate([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ]),
    ).toEqual([])
  })
})
