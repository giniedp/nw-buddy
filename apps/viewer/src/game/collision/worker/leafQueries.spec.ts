import { mat4Identity, vec3 } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import { rnrLeaves } from './colliders'
import { closestPointOnLeaf, LeafContact, raycastLeaf } from './leafQueries'
import type { RnrAsset, RnrShape } from '../../../formats/rnr/types'

function asset(shape: RnrShape): RnrAsset {
  return {
    version: 3,
    objects: [],
    guid: null,
    materialFilter: { enabled: false, secondaryGeometry: false, indices: new Uint16Array() },
    shapes: [shape],
  }
}

const base = { localTransform: null, extra: null }
const DOWN = vec3(0, 0, -1)

// unit cube [-1, 1]^3 as hull, planes with `dot(n, p) - w` convention (w = +1)
const cubeVertices = new Float32Array([
  -1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1,
])
const cubePlanes = new Float32Array([1, 0, 0, 1, -1, 0, 0, 1, 0, 1, 0, 1, 0, -1, 0, 1, 0, 0, 1, 1, 0, 0, -1, 1])

describe('leafQueries', () => {
  it('hull: detects the plane convention and casts rays', () => {
    const [leaf] = rnrLeaves(
      asset({
        ...base,
        kind: 'convexHull',
        vertices: cubeVertices,
        planes: cubePlanes,
        convexRadius: 0,
        extraIndices: null,
      }),
    )
    expect(raycastLeaf(leaf, vec3(0, 0, 5), DOWN, 10)).toBeCloseTo(4)
    expect(raycastLeaf(leaf, vec3(0, 0, 0), DOWN, 10)).toBeNaN()
    const out = vec3()
    expect(closestPointOnLeaf(leaf, vec3(1.5, 0, 0), 1, out)).toBe(LeafContact.Outside)
    expect(out.x).toBeCloseTo(1)
    expect(closestPointOnLeaf(leaf, vec3(0.8, 0, 0), 1, out)).toBe(LeafContact.Inside)
    expect(out.x).toBeCloseTo(1)
  })

  it('mesh: two sided ray and closest point', () => {
    // quad at z = 1, wound so that its normal points down
    const vertices = new Float32Array([-1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1])
    const indices = new Uint16Array([0, 1, 2, 2, 1, 3])
    const bvh = {
      version: 1,
      payload: new Uint8Array(),
      quantizedNodeCount: 0,
      subtreeInfoCount: 0,
      triangleIndexCount: 0,
      flags: 0,
    } as const
    const [leaf] = rnrLeaves(
      asset({ ...base, kind: 'mesh', streamHeader: 0, vertices, indices, adjacentTriangles: null, bvh }),
    )
    expect(raycastLeaf(leaf, vec3(0.5, 0.5, 3), DOWN, 10)).toBeCloseTo(2)
    const out = vec3()
    expect(closestPointOnLeaf(leaf, vec3(0, 0, 1.2), 0.5, out)).toBe(LeafContact.Outside)
    expect(out.z).toBeCloseTo(1)
    expect(closestPointOnLeaf(leaf, vec3(0, 0, 3), 0.5, out)).toBe(LeafContact.None)
  })

  it('capsule and cylinder rays (Y aligned)', () => {
    const [capsule, cylinder] = rnrLeaves({
      ...asset({ ...base, kind: 'capsule', halfHeight: 1, radius: 0.5 }),
      shapes: [
        { ...base, kind: 'capsule', halfHeight: 1, radius: 0.5 },
        { ...base, kind: 'cylinder', halfHeight: 1, radius: 0.5, convexRadius: 0 },
      ],
    })
    // straight down onto the side of the horizontal capsule (axis along y)
    expect(raycastLeaf(capsule, vec3(0, 0, 3), DOWN, 10)).toBeCloseTo(2.5, 2)
    // down onto the rounded end of the capsule at y = 1.25 (above the cap sphere at y = 1)
    expect(raycastLeaf(capsule, vec3(0, 1.25, 3), DOWN, 10)).toBeCloseTo(3 - Math.sqrt(0.25 - 0.0625), 2)
    expect(raycastLeaf(cylinder, vec3(0, 0, 3), DOWN, 10)).toBeCloseTo(2.5, 2)
    // beyond the flat cap
    expect(raycastLeaf(cylinder, vec3(0, 1.25, 3), DOWN, 10)).toBeNaN()
  })

  it('leaves keep the local transform of the tree', () => {
    const leaves = rnrLeaves(asset({ ...base, kind: 'box', halfExtents: { x: 1, y: 1, z: 1 }, convexRadius: 0 }))
    expect(Array.from(leaves[0].local)).toEqual(Array.from(mat4Identity()))
  })
})
