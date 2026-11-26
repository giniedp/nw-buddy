import { buildGeometry, type Device, type GeometryBuilder } from '@gglib/graphics'
import {
  mat4CreateFromRTS,
  mat4CreateRotationX,
  mat4CreateScaleXYZ,
  mat4Identity,
  mat4Multiply,
  type IVec3,
  type IVec4,
  type Mat4,
} from '@gglib/math'
import type { ViewerShape } from '../../api'
import { rnrTransformToMat4, type RnrShape } from '../../formats/rnr'
import type { DebugShapeOptions } from '../debug/DebugShapeComponent'

/**
 * Debug shapes of a collision shape, transforms are relative to the owning entity
 */
export type CollisionDebugShape = Pick<DebugShapeOptions, 'key' | 'type' | 'geometry' | 'instances'>

/**
 * Rotates the Z-up unit cylinder of the debug meshes to the Y axis (aligned RockNRoll cylinders and capsules)
 */
const Z_TO_Y = mat4CreateRotationX(-Math.PI / 2)

/**
 * Collects the debug shapes of a RockNRoll shape tree
 *
 * @param key - unique key of the shape asset, custom geometries are shared by this key
 */
export function rnrDebugShapes(shape: RnrShape, key: string, transform: Mat4 = mat4Identity()) {
  const result: CollisionDebugShape[] = []
  collectRnrShape(shape, key, transform, result)
  return result
}

function collectRnrShape(shape: RnrShape, key: string, parent: Mat4, out: CollisionDebugShape[]) {
  const transform = shape.localTransform ? mat4Multiply(parent, rnrTransformToMat4(shape.localTransform)) : parent
  switch (shape.kind) {
    case 'compound': {
      for (let i = 0; i < shape.children.length; i++) {
        const child = shape.children[i]
        collectRnrShape(child.shape, `${key}/${i}`, mat4Multiply(transform, rnrTransformToMat4(child.transform)), out)
      }
      break
    }
    case 'transform': {
      collectRnrShape(shape.shape, key, mat4Multiply(transform, rnrTransformToMat4(shape.transform)), out)
      break
    }
    case 'scaleMesh':
    case 'scaleConvexPolytope': {
      const scale = mat4CreateScaleXYZ(shape.scale.x, shape.scale.y, shape.scale.z)
      collectRnrShape(shape.shape, key, mat4Multiply(transform, scale), out)
      break
    }
    case 'box': {
      const { x, y, z } = shape.halfExtents
      out.push({
        type: 'box',
        instances: [mat4Multiply(transform, mat4CreateScaleXYZ(x * 2, y * 2, z * 2))],
      })
      break
    }
    case 'sphere': {
      out.push(sphereShape(transform, { x: 0, y: 0, z: 0 }, shape.radius))
      break
    }
    case 'cylinder': {
      const scale = mat4CreateScaleXYZ(shape.radius, shape.radius, shape.halfHeight * 2)
      out.push({
        type: 'cylinder',
        instances: [mat4Multiply(transform, mat4Multiply(Z_TO_Y, scale))],
      })
      break
    }
    case 'cylinderUnaligned': {
      out.push(segmentCylinder(transform, shape.a, shape.b, shape.radius))
      break
    }
    case 'capsule': {
      const h = shape.halfHeight
      out.push(...capsuleShapes(transform, { x: 0, y: -h, z: 0 }, { x: 0, y: h, z: 0 }, shape.radius))
      break
    }
    case 'capsuleUnaligned': {
      out.push(...capsuleShapes(transform, shape.a, shape.b, shape.radius))
      break
    }
    case 'triangle': {
      const { a, b, c } = shape
      const vertices = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z])
      out.push({
        type: 'custom',
        key: `${key}/triangle`,
        instances: [transform],
        geometry: (device, solid) => meshGeometry(device, vertices, [0, 1, 2], solid),
      })
      break
    }
    case 'mesh': {
      const { vertices, indices } = shape
      out.push({
        type: 'custom',
        key: `${key}/mesh`,
        instances: [transform],
        geometry: (device, solid) => meshGeometry(device, vertices, indices, solid),
      })
      break
    }
    case 'convexHull': {
      const { vertices, planes } = shape
      out.push({
        type: 'custom',
        key: `${key}/hull`,
        instances: [transform],
        geometry: (device, solid) => convexHullGeometry(device, vertices, planes, solid),
      })
      break
    }
    default: {
      // plane and height field do not occur in the game files
      console.warn(`collision shape not displayed: ${shape.kind}`, key)
    }
  }
}

/**
 * Collects the debug shapes of a primitive shape in entity space
 */
export function viewerShapeDebugShapes(shape: ViewerShape): CollisionDebugShape[] {
  const c = shape.center ?? [0, 0, 0]
  const center = { x: c[0], y: c[1], z: c[2] }
  const identity = mat4Identity()
  switch (shape.kind) {
    case 'box': {
      const [x, y, z] = shape.halfExtents ?? [0.5, 0.5, 0.5]
      return [
        { type: 'box', instances: [mat4CreateFromRTS(IDENTITY_ROTATION, center, { x: x * 2, y: y * 2, z: z * 2 })] },
      ]
    }
    case 'sphere': {
      return [sphereShape(identity, center, shape.radius ?? 0)]
    }
    case 'cylinder': {
      const r = shape.radius ?? 0
      return [
        {
          type: 'cylinder',
          instances: [mat4CreateFromRTS(IDENTITY_ROTATION, center, { x: r, y: r, z: shape.height ?? 0 })],
        },
      ]
    }
    case 'capsule': {
      const [ax, ay, az] = shape.axis ?? [0, 0, 1]
      const length = Math.hypot(ax, ay, az) || 1
      const h = (shape.height ?? 0) * 0.5
      const dx = (ax / length) * h
      const dy = (ay / length) * h
      const dz = (az / length) * h
      const a = { x: center.x - dx, y: center.y - dy, z: center.z - dz }
      const b = { x: center.x + dx, y: center.y + dy, z: center.z + dz }
      return capsuleShapes(identity, a, b, shape.radius ?? 0)
    }
    case 'prism': {
      const vertices = shape.vertices ?? []
      const height = shape.height ?? 0
      const key = `prism:${height}:${JSON.stringify(vertices)}`
      return [
        {
          type: 'custom',
          key,
          instances: [mat4CreateFromRTS(IDENTITY_ROTATION, center, { x: 1, y: 1, z: 1 })],
          geometry: (device, solid) => prismGeometry(device, vertices, height, solid),
        },
      ]
    }
  }
  return []
}

const IDENTITY_ROTATION: IVec4 = { x: 0, y: 0, z: 0, w: 1 }

function sphereShape(transform: Mat4, center: IVec3, radius: number): CollisionDebugShape {
  const local = mat4CreateFromRTS(IDENTITY_ROTATION, center, { x: radius, y: radius, z: radius })
  return { type: 'sphere', instances: [mat4Multiply(transform, local)] }
}

function capsuleShapes(transform: Mat4, a: IVec3, b: IVec3, radius: number): CollisionDebugShape[] {
  return [
    segmentCylinder(transform, a, b, radius),
    sphereShape(transform, a, radius),
    sphereShape(transform, b, radius),
  ]
}

/**
 * Unit cylinder (Z-up, centered) stretched between two points
 */
function segmentCylinder(transform: Mat4, a: IVec3, b: IVec3, radius: number): CollisionDebugShape {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dz = b.z - a.z
  const length = Math.hypot(dx, dy, dz)
  const center = { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5, z: (a.z + b.z) * 0.5 }
  const rotation = length > 1e-6 ? rotationZTo(dx / length, dy / length, dz / length) : IDENTITY_ROTATION
  const local = mat4CreateFromRTS(rotation, center, { x: radius, y: radius, z: length })
  return { type: 'cylinder', instances: [mat4Multiply(transform, local)] }
}

/**
 * Quaternion that rotates the Z axis onto the given unit direction
 */
function rotationZTo(x: number, y: number, z: number): IVec4 {
  // half way quaternion: axis = cross(Z, d), w = 1 + dot(Z, d)
  const w = 1 + z
  if (w < 1e-6) {
    // opposite direction, rotate 180° around X
    return { x: 1, y: 0, z: 0, w: 0 }
  }
  const qx = -y
  const qy = x
  const length = Math.hypot(qx, qy, 0, w)
  return { x: qx / length, y: qy / length, z: 0, w: w / length }
}

function meshGeometry(device: Device, vertices: ArrayLike<number>, indices: ArrayLike<number>, solid: boolean) {
  return buildGeometry(
    device,
    (builder: GeometryBuilder) => {
      for (let i = 0; i < vertices.length; i += 3) {
        builder.addVertex({ position: [vertices[i], vertices[i + 1], vertices[i + 2]] })
      }
      if (solid) {
        for (let i = 0; i < indices.length; i++) {
          builder.addIndex(indices[i])
        }
        return
      }
      // unique edges of the triangles
      const edges = new Set<number>()
      const count = vertices.length / 3
      const addEdge = (i0: number, i1: number) => {
        const key = Math.min(i0, i1) * count + Math.max(i0, i1)
        if (!edges.has(key)) {
          edges.add(key)
          builder.addIndex(i0)
          builder.addIndex(i1)
        }
      }
      for (let i = 0; i + 2 < indices.length; i += 3) {
        addEdge(indices[i], indices[i + 1])
        addEdge(indices[i + 1], indices[i + 2])
        addEdge(indices[i + 2], indices[i])
      }
    },
    {
      name: 'collision-mesh',
      primitiveType: solid ? 'triangle-list' : 'line-list',
    },
  )
}

/**
 * Builds the faces of a convex hull from its planes: the vertices on each plane, sorted around the face center
 */
function convexHullGeometry(device: Device, vertices: Float32Array, planes: Float32Array, solid: boolean) {
  const indices: number[] = []
  const vertexCount = vertices.length / 3
  for (let p = 0; p < planes.length; p += 4) {
    const nx = planes[p]
    const ny = planes[p + 1]
    const nz = planes[p + 2]
    const d = planes[p + 3]
    const face: number[] = []
    for (let i = 0; i < vertexCount; i++) {
      const dist = nx * vertices[i * 3] + ny * vertices[i * 3 + 1] + nz * vertices[i * 3 + 2]
      // the plane distance sign convention is not known, accept both
      if (Math.abs(dist + d) < 1e-3 || Math.abs(dist - d) < 1e-3) {
        face.push(i)
      }
    }
    if (face.length < 3) {
      continue
    }
    sortAroundNormal(face, vertices, nx, ny, nz)
    for (let i = 1; i + 1 < face.length; i++) {
      indices.push(face[0], face[i], face[i + 1])
    }
  }
  return meshGeometry(device, vertices, indices, solid)
}

function sortAroundNormal(face: number[], vertices: Float32Array, nx: number, ny: number, nz: number) {
  let cx = 0
  let cy = 0
  let cz = 0
  for (const i of face) {
    cx += vertices[i * 3]
    cy += vertices[i * 3 + 1]
    cz += vertices[i * 3 + 2]
  }
  cx /= face.length
  cy /= face.length
  cz /= face.length
  // tangent frame of the plane
  let ux = vertices[face[0] * 3] - cx
  let uy = vertices[face[0] * 3 + 1] - cy
  let uz = vertices[face[0] * 3 + 2] - cz
  const ul = Math.hypot(ux, uy, uz) || 1
  ux /= ul
  uy /= ul
  uz /= ul
  const vx = ny * uz - nz * uy
  const vy = nz * ux - nx * uz
  const vz = nx * uy - ny * ux
  const angle = (i: number) => {
    const px = vertices[i * 3] - cx
    const py = vertices[i * 3 + 1] - cy
    const pz = vertices[i * 3 + 2] - cz
    return Math.atan2(px * vx + py * vy + pz * vz, px * ux + py * uy + pz * uz)
  }
  face.sort((a, b) => angle(a) - angle(b))
}

/**
 * Polygon in the XY plane extruded along Z. Lines draw the outline, solid draws the sides and fan triangulated caps.
 */
function prismGeometry(device: Device, polygon: Array<[number, number]>, height: number, solid: boolean) {
  const n = polygon.length
  return buildGeometry(
    device,
    (builder: GeometryBuilder) => {
      for (const [x, y] of polygon) {
        builder.addVertex({ position: [x, y, 0] })
      }
      for (const [x, y] of polygon) {
        builder.addVertex({ position: [x, y, height] })
      }
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        if (solid) {
          builder.addIndices(i, j, n + j)
          builder.addIndices(i, n + j, n + i)
        } else {
          builder.addIndices(i, j)
          builder.addIndices(n + i, n + j)
          builder.addIndices(i, n + i)
        }
      }
      if (solid) {
        for (let i = 1; i + 1 < n; i++) {
          builder.addIndices(0, i, i + 1)
          builder.addIndices(n, n + i + 1, n + i)
        }
      }
    },
    {
      name: 'collision-prism',
      primitiveType: solid ? 'triangle-list' : 'line-list',
    },
  )
}
