/**
 * Types of RockNRoll `.rnr` shape assets, New World's cooked physics shapes.
 *
 * Shapes are kept as analytic descriptions (no tessellation) so they can be used for collision queries.
 * Positions are in the object space of the owning model (Z-up), little endian floats.
 */

export const RNR_MAGIC = 0x1234abcd

export interface RnrVec3 {
  x: number
  y: number
  z: number
}

export interface RnrVec4 extends RnrVec3 {
  w: number
}

/**
 * Affine 3x4 transform as stored in the file, 3 rows of [x, y, z, translation] (row major)
 */
export type RnrTransform = Float32Array

export interface RnrAsset {
  version: number
  objects: RnrObject[]
  /**
   * 16 bytes, version > 2
   */
  guid: Uint8Array | null
  materialFilter: RnrMaterialFilter
  shapes: RnrShape[]
}

export interface RnrObject {
  name: string
  materialIndices: Uint16Array
}

export interface RnrMaterialFilter {
  enabled: boolean
  secondaryGeometry: boolean
  indices: Uint16Array
}

/**
 * Shape kind ids of the binary format
 */
export const RnrShapeKindId = {
  box: 1,
  sphere: 2,
  convexHull: 3,
  cylinder: 4,
  cylinderUnaligned: 5,
  capsule: 6,
  capsuleUnaligned: 7,
  triangle: 8,
  mesh: 10,
  compound: 11,
  transform: 12,
  softBody: 13,
  plane: 17,
  scaleConvexPolytope: 18,
  scaleMesh: 19,
  heightField: 20,
} as const

export type RnrShapeKind = Exclude<keyof typeof RnrShapeKindId, 'softBody'>

interface RnrShapeBase {
  /**
   * Placement of the shape in object space. Top level convex primitives (box, sphere, convex hull, cylinders,
   * capsules) are stored centered and placed by this transform. Decoded from a 48 byte trailing block.
   */
  localTransform: RnrTransform | null
  /**
   * Trailing block of the shape that is not a local transform, not decoded
   */
  extra: Uint8Array | null
}

export interface RnrBoxShape extends RnrShapeBase {
  kind: 'box'
  halfExtents: RnrVec3
  convexRadius: number
}

export interface RnrSphereShape extends RnrShapeBase {
  kind: 'sphere'
  radius: number
}

export interface RnrConvexHullShape extends RnrShapeBase {
  kind: 'convexHull'
  /**
   * xyz per vertex
   */
  vertices: Float32Array
  /**
   * xyzw per plane (normal and distance)
   */
  planes: Float32Array
  convexRadius: number
  /**
   * Additional index data, meaning unknown
   */
  extraIndices: [Uint16Array, Uint16Array] | null
}

/**
 * Cylinder along the local Y axis
 */
export interface RnrCylinderShape extends RnrShapeBase {
  kind: 'cylinder'
  halfHeight: number
  radius: number
  convexRadius: number
}

export interface RnrCylinderUnalignedShape extends RnrShapeBase {
  kind: 'cylinderUnaligned'
  a: RnrVec3
  b: RnrVec3
  radius: number
  convexRadius: number
}

/**
 * Capsule along the local Y axis, halfHeight is half the segment length
 */
export interface RnrCapsuleShape extends RnrShapeBase {
  kind: 'capsule'
  halfHeight: number
  radius: number
}

export interface RnrCapsuleUnalignedShape extends RnrShapeBase {
  kind: 'capsuleUnaligned'
  a: RnrVec3
  b: RnrVec3
  radius: number
}

export interface RnrTriangleShape extends RnrShapeBase {
  kind: 'triangle'
  a: RnrVec3
  b: RnrVec3
  c: RnrVec3
  convexRadius: number
}

export interface RnrMeshShape extends RnrShapeBase {
  kind: 'mesh'
  streamHeader: number
  /**
   * xyz per vertex
   */
  vertices: Float32Array
  /**
   * 3 per triangle
   */
  indices: Uint16Array
  /**
   * 3 per triangle, adjacent triangle per edge
   */
  adjacentTriangles: Uint16Array | null
  bvh: RnrBvh
}

/**
 * Quantized BVH of a mesh shape, kept raw for later use
 */
export interface RnrBvh {
  version: 1 | 2
  payload: Uint8Array
  quantizedNodeCount: number
  subtreeInfoCount: number
  triangleIndexCount: number
  flags: number
}

export interface RnrCompoundShape extends RnrShapeBase {
  kind: 'compound'
  children: Array<{ transform: RnrTransform; shape: RnrShape }>
}

export interface RnrTransformShape extends RnrShapeBase {
  kind: 'transform'
  transform: RnrTransform
  shape: RnrShape
}

export interface RnrPlaneShape extends RnrShapeBase {
  kind: 'plane'
  plane: RnrVec4
  aabbMin: RnrVec3
  aabbMax: RnrVec3
}

export interface RnrScaledShape extends RnrShapeBase {
  kind: 'scaleConvexPolytope' | 'scaleMesh'
  streamHeader: number
  scale: RnrVec3
  shape: RnrShape
}

export interface RnrHeightFieldShape extends RnrShapeBase {
  kind: 'heightField'
  layout: number
  data: {
    version: number
    width: number
    length: number
    heightScale: number
    aabbMin: RnrVec3
    aabbMax: RnrVec3
    /**
     * Raw samples, version 0 = u8, 1 = u16, 2 = f32
     */
    samples: Uint8Array
  } | null
}

export type RnrShape =
  | RnrBoxShape
  | RnrSphereShape
  | RnrConvexHullShape
  | RnrCylinderShape
  | RnrCylinderUnalignedShape
  | RnrCapsuleShape
  | RnrCapsuleUnalignedShape
  | RnrTriangleShape
  | RnrMeshShape
  | RnrCompoundShape
  | RnrTransformShape
  | RnrPlaneShape
  | RnrScaledShape
  | RnrHeightFieldShape
