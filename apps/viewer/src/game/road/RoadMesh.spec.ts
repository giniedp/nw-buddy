import type { GeometryBuilder } from '@gglib/graphics'
import { BoundingBox } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import type { ViewerRoadComponent } from '../../api'
import { buildRiverMesh, buildRoadMesh } from './RoadMesh'

function road(overrides: Partial<ViewerRoadComponent> = {}): ViewerRoadComponent {
  return {
    type: 'Road',
    material: 'test.mtl',
    width: 4,
    segmentLength: 2,
    tileLength: 5,
    sortPriority: 0,
    minSpec: 1,
    viewDistanceMultiplier: 1,
    spline: {
      type: 'Linear',
      closed: false,
      vertices: [
        [0.3, 0.2, 0],
        [10.3, 0.2, 0],
      ],
    },
    ...overrides,
  }
}

// column major translation
const translate = (x: number, y: number, z: number) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]

function vertices(mesh: GeometryBuilder) {
  return Array.from({ length: mesh.vertexCount }, (_, i) => mesh.readVertex(i))
}

/**
 * Signed area seen from above of each triangle, counter clockwise is positive
 */
function triangleAreas(mesh: GeometryBuilder) {
  const p = vertices(mesh).map((v) => v['position'])
  const result: number[] = []
  for (let t = 0; t < mesh.indexCount; t += 3) {
    const [a, b, c] = [p[mesh.indices[t]], p[mesh.indices[t + 1]], p[mesh.indices[t + 2]]]
    result.push(((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2)
  }
  return result
}

/**
 * Height of the terrain mesh: cells split along (x0, y0) - (x1, y1) like buildPatch 'forward'
 */
function terrainTriangleHeight(h: (x: number, y: number) => number, x: number, y: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const h00 = h(x0, y0)
  const h11 = h(x0 + 1, y0 + 1)
  if (fx >= fy) {
    // triangle (x0, y0), (x1, y0), (x1, y1)
    const h10 = h(x0 + 1, y0)
    return h00 + (h10 - h00) * fx + (h11 - h10) * fy
  }
  // triangle (x0, y0), (x1, y1), (x0, y1)
  const h01 = h(x0, y0 + 1)
  return h00 + (h01 - h00) * fy + (h11 - h01) * fx
}

describe('buildRoadMesh', () => {
  it('covers exactly the road area with u along and v across the road', () => {
    const mesh = buildRoadMesh(road(), translate(100, 200, 0), () => 10)!
    // 10m long, 4m wide
    expect(triangleAreas(mesh).reduce((a, b) => a + b)).toBeCloseTo(40, 4)
    for (const { position, texture } of vertices(mesh)) {
      const x = position[0] - 100.3
      const y = position[1] - 200.2
      expect(position[2]).toBeCloseTo(10.06)
      // u = distance / tileLength, v = 0 on the left (+y, the normal of a +x tangent)
      expect(texture[0]).toBeCloseTo(x / 5, 4)
      expect(texture[1]).toBeCloseTo((2 - y) / 4, 4)
    }
    const box = mesh.toGeometryOptions().boundingBox as BoundingBox
    expect(box.min.x).toBeCloseTo(100.3)
    expect(box.max.x).toBeCloseTo(110.3)
    expect(box.min.y).toBeCloseTo(198.2)
    expect(box.max.y).toBeCloseTo(202.2)
  })

  it('puts vertices on the terrain triangles, also on curved terrain', () => {
    const h = (x: number, y: number) => 0.3 * x * y - 0.1 * x * x
    const mesh = buildRoadMesh(road(), translate(20, 30, 0), h)!
    for (const { position } of vertices(mesh)) {
      expect(position[2]).toBeCloseTo(terrainTriangleHeight(h, position[0], position[1]) + 0.06, 3)
    }
  })

  it('fades open roads in over the first and out over the last sector', () => {
    const mesh = buildRoadMesh(road(), translate(0, 0, 0), () => 0)!
    for (const { position, color } of vertices(mesh)) {
      const d = position[0] - 0.3
      const expected = Math.min(1, d / 2, (10 - d) / 2)
      expect(color[3]).toBeCloseTo(Math.max(0, expected), 4)
    }

    const closed = buildRoadMesh(
      road({
        spline: {
          type: 'Linear',
          closed: true,
          vertices: [
            [0, 0, 0],
            [10, 0, 0],
            [10, 10, 0],
          ],
        },
      }),
      translate(0, 0, 0),
      () => 0,
    )!
    for (const { color } of vertices(closed)) {
      expect(color[3]).toBe(1)
    }
  })

  it('winds triangles counter clockwise seen from above', () => {
    const mesh = buildRoadMesh(road(), translate(0, 0, 0), () => 0)!
    for (const area of triangleAreas(mesh)) {
      expect(area).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it('tangent runs along the road, bitangent = cross(n, t) * w along +v', () => {
    const mesh = buildRoadMesh(road(), translate(0, 0, 0), () => 0)!
    const { tangent } = mesh.readVertex(0)
    expect(tangent[0]).toBeCloseTo(1)
    expect(tangent[1]).toBeCloseTo(0)
    // n = +z, cross(n, t) = +y, v grows towards -y (left to right), so w = -1
    expect(tangent[3]).toBe(-1)
  })

  it('takes normals from the terrain like the terrain shader, falls back to the spline without terrain', () => {
    // terrain rises with x by 0.5 per meter, shader normal (h(x-1) - h(x+1), h(y-1) - h(y+1), 1)
    const sloped = buildRoadMesh(road(), translate(0, 0, 0), (x) => x * 0.5)!
    const expected = [-1, 0, 1].map((v) => v / Math.SQRT2)
    const { normal } = sloped.readVertex(0)
    for (let k = 0; k < 3; k++) {
      expect(normal[k]).toBeCloseTo(expected[k])
    }

    const floating = buildRoadMesh(road(), translate(0, 0, 42), () => undefined)!
    const vertex = floating.readVertex(0)
    expect(vertex['position'][2]).toBeCloseTo(42)
    expect(vertex['normal'][2]).toBe(1)
  })

  it('returns null for degenerate splines', () => {
    expect(
      buildRoadMesh(
        road({ spline: { type: 'Linear', closed: false, vertices: [[0, 0, 0]] } }),
        translate(0, 0, 0),
        () => 0,
      ),
    ).toBeNull()
  })
})

describe('buildRiverMesh', () => {
  const options = { tileWidth: 20, fogColor: [0.1, 0.2, 0.3], fogDensity: 0.5 }
  const river = () =>
    road({
      type: 'River',
      spline: {
        type: 'Linear',
        closed: false,
        // z drifts slightly like real river splines, the surface must still be flat
        vertices: [
          [0, 0, 0],
          [10, 0, 0.1],
          [20, 5, 0.2],
        ],
      },
    })

  it('is flat on the fog plane through the first point', () => {
    const mesh = buildRiverMesh(river(), translate(100, 200, 50), options)!
    for (const { position } of vertices(mesh)) {
      expect(position[2]).toBeCloseTo(50, 5)
    }
  })

  it('builds a fan of 4 counter clockwise triangles per sector', () => {
    const mesh = buildRiverMesh(river(), translate(0, 0, 0), options)!
    expect(mesh.vertexCount % 5).toBe(0)
    expect(mesh.indexCount).toBe((mesh.vertexCount / 5) * 12)
    for (const area of triangleAreas(mesh)) {
      expect(area).toBeGreaterThan(0)
    }
  })

  it('maps u along the river in tiles and v across to tileWidth', () => {
    const mesh = buildRiverMesh(river(), translate(0, 0, 0), options)!
    const vs = vertices(mesh)
    const us = vs.map((v) => v['texture'][0])
    const across = vs.map((v) => v['texture'][1])
    expect(Math.min(...us)).toBeCloseTo(0)
    // linear spline length: 10 + hypot(10, 5), tileLength 5
    expect(Math.max(...us)).toBeCloseTo((10 + Math.hypot(10, 5)) / 5, 2)
    expect(Math.min(...across)).toBeCloseTo(0)
    expect(Math.max(...across)).toBeCloseTo(20)
    // v = 0 on the left (+y of a +x running river)
    const first = vs[0]
    expect(first['position'][1]).toBeCloseTo(2)
    expect(first['texture'][1]).toBe(0)
  })

  it('carries the fog in the vertex color and faces up', () => {
    const mesh = buildRiverMesh(river(), translate(0, 0, 0), options)!
    for (const { color, normal, tangent } of vertices(mesh)) {
      expect(color).toEqual([expect.closeTo(0.1), expect.closeTo(0.2), expect.closeTo(0.3), expect.closeTo(0.5)])
      expect(normal[2]).toBeCloseTo(1)
      // bitangent = cross(n, t) * w points along +v, which is -y for a +x river
      const by = (normal[2] * tangent[0] - normal[0] * tangent[2]) * tangent[3]
      if (Math.abs(tangent[0]) > 0.9) {
        expect(by).toBeLessThan(0)
      }
    }
  })

  it('fades the ends and banks over the fade distances', () => {
    const straight = road({
      type: 'River',
      width: 10,
      spline: {
        type: 'Linear',
        closed: false,
        vertices: [
          [0, 0, 0],
          [20, 0, 0],
        ],
      },
    })
    const mesh = buildRiverMesh(straight, translate(0, 0, 0), {
      ...options,
      lengthStartFade: 2,
      lengthEndFade: 4,
      widthFade: 5,
    })!
    for (const { position, fade } of vertices(mesh)) {
      const along = position[0]
      const fromLeft = 5 - position[1]
      expect(fade[0]).toBeCloseTo(along / 2, 4)
      expect(fade[1]).toBeCloseTo((20 - along) / 4, 4)
      expect(fade[2]).toBeCloseTo(fromLeft / 5, 4)
      expect(fade[3]).toBeCloseTo((10 - fromLeft) / 5, 4)
    }
    // no fade distances: all terms stay at 1
    for (const { fade } of vertices(buildRiverMesh(straight, translate(0, 0, 0), options)!)) {
      expect(fade).toEqual([1, 1, 1, 1])
    }
  })

  it('follows a tilted entity plane', () => {
    // rotation of 0.1 rad around x: the entity up axis tilts towards -y
    const c = Math.cos(0.1)
    const s = Math.sin(0.1)
    const tilted = [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]
    const mesh = buildRiverMesh(river(), tilted, options)!
    const vs = vertices(mesh).map((v) => v['position'])
    // z changes with y only, along the plane slope
    const p0 = vs[0]
    for (const p of vs) {
      expect(p[2] - p0[2]).toBeCloseTo((p[1] - p0[1]) * Math.tan(0.1), 4)
    }
  })
})
