import { BoundingBox, mat4CreateScaleXYZ, mat4Identity, mat4Multiply, vec3, type IVec3, type Mat4 } from '@gglib/math'
import type { ViewerShape } from '../../../api/types'
import { rnrTransformToMat4 } from '../../../formats/rnr/parse'
import type { RnrAsset, RnrShape } from '../../../formats/rnr/types'
import { TriangleBvh } from './TriangleBvh'

/**
 * Convex or mesh shape of a collider in its own local space, shared by all instances of an asset
 */
export type ColliderLeaf =
  | { kind: 'box'; local: Mat4; bounds: BoundingBox; half: IVec3 }
  | { kind: 'sphere'; local: Mat4; bounds: BoundingBox; radius: number }
  /**
   * Segment with rounded caps
   */
  | { kind: 'capsule'; local: Mat4; bounds: BoundingBox; a: IVec3; b: IVec3; radius: number }
  /**
   * Segment with flat caps
   */
  | { kind: 'cylinder'; local: Mat4; bounds: BoundingBox; a: IVec3; b: IVec3; radius: number }
  | { kind: 'mesh'; local: Mat4; bounds: BoundingBox; bvh: TriangleBvh }
  /**
   * Planes are normalized to outward normals with signed distance `dot(n, p) + w`
   */
  | { kind: 'hull'; local: Mat4; bounds: BoundingBox; planes: Float32Array }
  /**
   * XY polygon extruded along Z from 0 to height
   */
  | { kind: 'prism'; local: Mat4; bounds: BoundingBox; polygon: Float64Array; height: number }

export type ColliderLeafKind = ColliderLeaf['kind']

/**
 * Flattens the shape tree of a RockNRoll asset into leaves with transforms relative to the owning entity
 *
 * @remarks
 * Mirrors the traversal of `rnrDebugShapes` (collisionDebug.ts), so collision matches the debug view.
 */
export function rnrLeaves(asset: RnrAsset): ColliderLeaf[] {
  const result: ColliderLeaf[] = []
  for (const shape of asset.shapes) {
    collectRnr(shape, mat4Identity(), result)
  }
  return result
}

function collectRnr(shape: RnrShape, parent: Mat4, out: ColliderLeaf[]) {
  const local = shape.localTransform ? mat4Multiply(parent, rnrTransformToMat4(shape.localTransform)) : parent
  switch (shape.kind) {
    case 'compound': {
      for (const child of shape.children) {
        collectRnr(child.shape, mat4Multiply(local, rnrTransformToMat4(child.transform)), out)
      }
      break
    }
    case 'transform': {
      collectRnr(shape.shape, mat4Multiply(local, rnrTransformToMat4(shape.transform)), out)
      break
    }
    case 'scaleMesh':
    case 'scaleConvexPolytope': {
      collectRnr(shape.shape, mat4Multiply(local, mat4CreateScaleXYZ(shape.scale.x, shape.scale.y, shape.scale.z)), out)
      break
    }
    case 'box': {
      out.push(boxLeaf(local, vec3(shape.halfExtents.x, shape.halfExtents.y, shape.halfExtents.z)))
      break
    }
    case 'sphere': {
      out.push(sphereLeaf(local, shape.radius))
      break
    }
    case 'cylinder': {
      // aligned cylinders and capsules run along the local Y axis
      out.push(
        segmentLeaf('cylinder', local, vec3(0, -shape.halfHeight, 0), vec3(0, shape.halfHeight, 0), shape.radius),
      )
      break
    }
    case 'cylinderUnaligned': {
      out.push(segmentLeaf('cylinder', local, vec3(shape.a), vec3(shape.b), shape.radius))
      break
    }
    case 'capsule': {
      out.push(segmentLeaf('capsule', local, vec3(0, -shape.halfHeight, 0), vec3(0, shape.halfHeight, 0), shape.radius))
      break
    }
    case 'capsuleUnaligned': {
      out.push(segmentLeaf('capsule', local, vec3(shape.a), vec3(shape.b), shape.radius))
      break
    }
    case 'triangle': {
      const { a, b, c } = shape
      out.push(meshLeaf(local, new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]), [0, 1, 2]))
      break
    }
    case 'mesh': {
      out.push(meshLeaf(local, shape.vertices, shape.indices))
      break
    }
    case 'convexHull': {
      out.push(hullLeaf(local, shape.vertices, shape.planes))
      break
    }
    default:
      // plane and height field do not occur in the game files
      break
  }
}

/**
 * Leaves of a primitive shape in entity space (see viewerShapeDebugShapes)
 */
export function viewerShapeLeaves(shape: ViewerShape): ColliderLeaf[] {
  const c = shape.center ?? [0, 0, 0]
  const center = vec3(c[0], c[1], c[2])
  const local = mat4Identity()
  switch (shape.kind) {
    case 'box': {
      const [x, y, z] = shape.halfExtents ?? [0.5, 0.5, 0.5]
      local[12] = center.x
      local[13] = center.y
      local[14] = center.z
      return [boxLeaf(local, vec3(x, y, z))]
    }
    case 'sphere': {
      local[12] = center.x
      local[13] = center.y
      local[14] = center.z
      return [sphereLeaf(local, shape.radius ?? 0)]
    }
    case 'cylinder': {
      // full height along Z, centered
      const h = (shape.height ?? 0) * 0.5
      return [
        segmentLeaf(
          'cylinder',
          local,
          vec3(center.x, center.y, center.z - h),
          vec3(center.x, center.y, center.z + h),
          shape.radius ?? 0,
        ),
      ]
    }
    case 'capsule': {
      const [ax, ay, az] = shape.axis ?? [0, 0, 1]
      const length = Math.hypot(ax, ay, az) || 1
      const h = (shape.height ?? 0) * 0.5
      const d = vec3((ax / length) * h, (ay / length) * h, (az / length) * h)
      const a = vec3(center.x - d.x, center.y - d.y, center.z - d.z)
      const b = vec3(center.x + d.x, center.y + d.y, center.z + d.z)
      return [segmentLeaf('capsule', local, a, b, shape.radius ?? 0)]
    }
    case 'prism': {
      const vertices = shape.vertices ?? []
      if (vertices.length < 3) {
        return []
      }
      local[12] = center.x
      local[13] = center.y
      local[14] = center.z
      return [prismLeaf(local, vertices, shape.height ?? 0)]
    }
  }
  return []
}

function boxLeaf(local: Mat4, half: IVec3): ColliderLeaf {
  const bounds = new BoundingBox(-half.x, -half.y, -half.z, half.x, half.y, half.z)
  return { kind: 'box', local, bounds, half }
}

function sphereLeaf(local: Mat4, radius: number): ColliderLeaf {
  const bounds = new BoundingBox(-radius, -radius, -radius, radius, radius, radius)
  return { kind: 'sphere', local, bounds, radius }
}

function segmentLeaf(kind: 'capsule' | 'cylinder', local: Mat4, a: IVec3, b: IVec3, radius: number): ColliderLeaf {
  const bounds = new BoundingBox(
    Math.min(a.x, b.x) - radius,
    Math.min(a.y, b.y) - radius,
    Math.min(a.z, b.z) - radius,
    Math.max(a.x, b.x) + radius,
    Math.max(a.y, b.y) + radius,
    Math.max(a.z, b.z) + radius,
  )
  return { kind, local, bounds, a, b, radius }
}

function meshLeaf(local: Mat4, vertices: Float32Array, indices: ArrayLike<number>): ColliderLeaf {
  const bvh = new TriangleBvh(vertices, indices)
  return { kind: 'mesh', local, bounds: bvh.getBounds(new BoundingBox()), bvh }
}

function prismLeaf(local: Mat4, vertices: Array<[number, number]>, height: number): ColliderLeaf {
  const polygon = new Float64Array(vertices.length * 2)
  const bounds = BoundingBox.createEmpty()
  for (let i = 0; i < vertices.length; i++) {
    polygon[i * 2] = vertices[i][0]
    polygon[i * 2 + 1] = vertices[i][1]
    BoundingBox.mergePoint(bounds, vec3(vertices[i][0], vertices[i][1], 0), bounds)
  }
  bounds.min.z = Math.min(0, height)
  bounds.max.z = Math.max(0, height)
  return { kind: 'prism', local, bounds, polygon, height }
}

/**
 * The plane sign convention of the format is not known (see convexHullGeometry). The convention whose planes
 * pass through the hull vertices is used, normals are flipped to point away from the vertex centroid.
 */
function hullLeaf(local: Mat4, vertices: Float32Array, rawPlanes: Float32Array): ColliderLeaf {
  const count = vertices.length / 3
  const bounds = BoundingBox.createFromPointsBuffer(vertices)
  let cx = 0,
    cy = 0,
    cz = 0
  for (let i = 0; i < count; i++) {
    cx += vertices[i * 3]
    cy += vertices[i * 3 + 1]
    cz += vertices[i * 3 + 2]
  }
  cx /= count || 1
  cy /= count || 1
  cz /= count || 1

  // error of both conventions: the nearest vertex should lie on each plane
  let errorPlus = 0
  let errorMinus = 0
  for (let p = 0; p < rawPlanes.length; p += 4) {
    let minPlus = Infinity
    let minMinus = Infinity
    for (let i = 0; i < count; i++) {
      const d =
        rawPlanes[p] * vertices[i * 3] + rawPlanes[p + 1] * vertices[i * 3 + 1] + rawPlanes[p + 2] * vertices[i * 3 + 2]
      minPlus = Math.min(minPlus, Math.abs(d + rawPlanes[p + 3]))
      minMinus = Math.min(minMinus, Math.abs(d - rawPlanes[p + 3]))
    }
    errorPlus += minPlus
    errorMinus += minMinus
  }
  const sign = errorPlus <= errorMinus ? 1 : -1

  const planes = new Float32Array(rawPlanes.length)
  for (let p = 0; p < rawPlanes.length; p += 4) {
    let nx = rawPlanes[p]
    let ny = rawPlanes[p + 1]
    let nz = rawPlanes[p + 2]
    let w = rawPlanes[p + 3] * sign
    const length = Math.hypot(nx, ny, nz) || 1
    nx /= length
    ny /= length
    nz /= length
    w /= length
    if (nx * cx + ny * cy + nz * cz + w > 0) {
      nx = -nx
      ny = -ny
      nz = -nz
      w = -w
    }
    planes[p] = nx
    planes[p + 1] = ny
    planes[p + 2] = nz
    planes[p + 3] = w
  }
  return { kind: 'hull', local, bounds, planes }
}
