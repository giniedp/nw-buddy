import {
  RNR_MAGIC,
  RnrShapeKindId,
  type RnrAsset,
  type RnrBvh,
  type RnrMaterialFilter,
  type RnrObject,
  type RnrShape,
  type RnrTransform,
  type RnrVec3,
  type RnrVec4,
} from './types'

const MAX_RECURSION_DEPTH = 64

/**
 * Shape without the trailing block, distributed over the shape union
 */
type RnrShapeData = RnrShape extends infer S
  ? S extends RnrShape
    ? Omit<S, 'extra' | 'localTransform'>
    : never
  : never

/**
 * Parses a RockNRoll `.rnr` shape asset.
 */
export function parseRnr(buffer: ArrayBuffer | ArrayBufferView): RnrAsset {
  const reader = new Reader(buffer)
  const magic = reader.u32()
  if (magic !== RNR_MAGIC) {
    throw new Error(`bad RockNRoll magic 0x${magic.toString(16)}`)
  }
  const version = reader.u32()

  const objects: RnrObject[] = []
  if (version > 1) {
    const count = reader.u32()
    for (let i = 0; i < count; i++) {
      const name = reader.string()
      const materialIndices = reader.u16Array(reader.u32())
      objects.push({ name, materialIndices })
    }
  }

  const guid = version > 2 ? reader.bytes(16) : null

  const materialFilter: RnrMaterialFilter = {
    enabled: false,
    secondaryGeometry: false,
    indices: new Uint16Array(0),
  }
  if (version > 4) {
    materialFilter.enabled = reader.u8() !== 0
    if (version > 6) {
      materialFilter.secondaryGeometry = reader.u8() !== 0
    }
    if (materialFilter.enabled) {
      const count = reader.i16()
      if (count < 0) {
        throw new Error(`negative material filter count ${count}`)
      }
      materialFilter.indices = reader.u16Array(count)
    }
  }

  const shapeCount = version > 3 ? reader.u8() : 1
  const shapes: RnrShape[] = []
  for (let i = 0; i < shapeCount; i++) {
    shapes.push(readShape(reader, 0))
  }

  if (reader.remaining !== 0) {
    throw new Error(`trailing RockNRoll bytes after parsed asset: ${reader.remaining}`)
  }

  return { version, objects, guid, materialFilter, shapes }
}

function readShape(reader: Reader, depth: number): RnrShape {
  if (depth > MAX_RECURSION_DEPTH) {
    throw new Error('shape recursion limit exceeded')
  }
  const offset = reader.offset
  const kind = reader.u32()
  const shape = readShapeData(reader, kind, offset, depth) as RnrShape
  // trailing block of every shape, 48 bytes on top level convex primitives: a 3x4 local transform
  const extraLength = reader.u32()
  shape.localTransform = null
  shape.extra = null
  if (extraLength === 48) {
    shape.localTransform = reader.f32Array(12)
  } else if (extraLength) {
    shape.extra = reader.bytes(extraLength)
  }
  return shape
}

function readShapeData(reader: Reader, kind: number, offset: number, depth: number): RnrShapeData {
  switch (kind) {
    case RnrShapeKindId.box: {
      return {
        kind: 'box',
        halfExtents: reader.vec3(),
        convexRadius: reader.f32(),
      }
    }
    case RnrShapeKindId.sphere: {
      return {
        kind: 'sphere',
        radius: reader.f32(),
      }
    }
    case RnrShapeKindId.convexHull: {
      const vertexCount = reader.u32()
      const planeCount = reader.u32()
      const vertices = reader.f32Array(vertexCount * 3)
      const planes = reader.f32Array(planeCount * 4)
      const convexRadius = reader.f32()
      let extraIndices: [Uint16Array, Uint16Array] | null = null
      if (reader.u8() !== 0) {
        const a = reader.u16Array(reader.u32())
        const b = reader.u16Array(reader.u32())
        extraIndices = [a, b]
      }
      return { kind: 'convexHull', vertices, planes, convexRadius, extraIndices }
    }
    case RnrShapeKindId.cylinder: {
      return {
        kind: 'cylinder',
        halfHeight: reader.f32(),
        radius: reader.f32(),
        convexRadius: reader.f32(),
      }
    }
    case RnrShapeKindId.cylinderUnaligned: {
      return {
        kind: 'cylinderUnaligned',
        a: reader.vec3(),
        b: reader.vec3(),
        radius: reader.f32(),
        convexRadius: reader.f32(),
      }
    }
    case RnrShapeKindId.capsule: {
      return {
        kind: 'capsule',
        halfHeight: reader.f32(),
        radius: reader.f32(),
      }
    }
    case RnrShapeKindId.capsuleUnaligned: {
      return {
        kind: 'capsuleUnaligned',
        a: reader.vec3(),
        b: reader.vec3(),
        radius: reader.f32(),
      }
    }
    case RnrShapeKindId.triangle: {
      return {
        kind: 'triangle',
        a: reader.vec3(),
        b: reader.vec3(),
        c: reader.vec3(),
        convexRadius: reader.f32(),
      }
    }
    case RnrShapeKindId.mesh: {
      const streamHeader = reader.u32()
      const vertexCount = reader.u32()
      const triangleCount = reader.u32()
      const vertices = reader.f32Array(vertexCount * 3)
      const indices = reader.u16Array(triangleCount * 3)
      const adjacentTriangles = reader.u8() !== 0 ? reader.u16Array(triangleCount * 3) : null
      const bvh = readBvh(reader)
      return { kind: 'mesh', streamHeader, vertices, indices, adjacentTriangles, bvh }
    }
    case RnrShapeKindId.compound: {
      const count = reader.u32()
      const children: Array<{ transform: RnrTransform; shape: RnrShape }> = []
      for (let i = 0; i < count; i++) {
        const transform = reader.f32Array(12)
        children.push({ transform, shape: readShape(reader, depth + 1) })
      }
      return { kind: 'compound', children }
    }
    case RnrShapeKindId.transform: {
      const transform = reader.f32Array(12)
      return { kind: 'transform', transform, shape: readShape(reader, depth + 1) }
    }
    case RnrShapeKindId.plane: {
      return {
        kind: 'plane',
        plane: reader.vec4(),
        aabbMin: reader.vec3(),
        aabbMax: reader.vec3(),
      }
    }
    case RnrShapeKindId.scaleConvexPolytope:
    case RnrShapeKindId.scaleMesh: {
      return {
        kind: kind === RnrShapeKindId.scaleMesh ? 'scaleMesh' : 'scaleConvexPolytope',
        streamHeader: reader.u32(),
        scale: reader.vec3(),
        shape: readShape(reader, depth + 1),
      }
    }
    case RnrShapeKindId.heightField: {
      const layout = reader.u32()
      if (layout !== 1) {
        return { kind: 'heightField', layout, data: null }
      }
      return {
        kind: 'heightField',
        layout,
        data: {
          version: reader.u32(),
          width: reader.u32(),
          length: reader.u32(),
          heightScale: reader.f32(),
          aabbMin: reader.vec3(),
          aabbMax: reader.vec3(),
          samples: reader.bytes(reader.u32()),
        },
      }
    }
    default: {
      // soft body (13) is not readable by the engine either
      throw new Error(`unknown RockNRoll shape kind ${kind} at byte offset ${offset}`)
    }
  }
}

function readBvh(reader: Reader): RnrBvh {
  const payload = reader.bytes(reader.u32())
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  const version = payload.byteLength >= 4 ? view.getUint32(0, true) : 0
  // header layout of the quantized BVH
  if (version === 1 && payload.byteLength >= 0x58) {
    return {
      version,
      payload,
      quantizedNodeCount: view.getUint32(0x44, true),
      subtreeInfoCount: view.getUint16(0x4c, true),
      triangleIndexCount: view.getUint32(0x54, true),
      flags: view.getUint16(0x4e, true),
    }
  }
  if (version === 2 && payload.byteLength >= 0x6c) {
    return {
      version,
      payload,
      quantizedNodeCount: view.getUint32(0x48, true),
      subtreeInfoCount: view.getUint16(0x58, true),
      triangleIndexCount: view.getUint32(0x68, true),
      flags: view.getUint16(0x5a, true),
    }
  }
  throw new Error(`unsupported BVH version ${version} (${payload.byteLength} bytes)`)
}

/**
 * Converts a stored 3x4 row major transform to a column major 4x4 matrix
 */
export function rnrTransformToMat4(transform: RnrTransform, out: number[] | Float32Array = new Array(16)) {
  out[0] = transform[0]
  out[1] = transform[4]
  out[2] = transform[8]
  out[3] = 0
  out[4] = transform[1]
  out[5] = transform[5]
  out[6] = transform[9]
  out[7] = 0
  out[8] = transform[2]
  out[9] = transform[6]
  out[10] = transform[10]
  out[11] = 0
  out[12] = transform[3]
  out[13] = transform[7]
  out[14] = transform[11]
  out[15] = 1
  return out
}

class Reader {
  public offset = 0
  private view: DataView
  private data: Uint8Array

  public constructor(buffer: ArrayBuffer | ArrayBufferView) {
    this.data = ArrayBuffer.isView(buffer)
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : new Uint8Array(buffer)
    this.view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength)
  }

  public get remaining() {
    return this.data.byteLength - this.offset
  }

  private take(length: number) {
    if (length < 0 || this.offset + length > this.data.byteLength) {
      throw new Error(
        `unexpected end of file at ${this.offset}, needed ${length} bytes with ${this.remaining} remaining`,
      )
    }
    const start = this.offset
    this.offset += length
    return start
  }

  public u8() {
    return this.view.getUint8(this.take(1))
  }

  public i16() {
    return this.view.getInt16(this.take(2), true)
  }

  public u32() {
    return this.view.getUint32(this.take(4), true)
  }

  public f32() {
    return this.view.getFloat32(this.take(4), true)
  }

  public vec3(): RnrVec3 {
    return { x: this.f32(), y: this.f32(), z: this.f32() }
  }

  public vec4(): RnrVec4 {
    return { x: this.f32(), y: this.f32(), z: this.f32(), w: this.f32() }
  }

  /**
   * Copy of the next bytes
   */
  public bytes(length: number) {
    const start = this.take(length)
    return this.data.slice(start, start + length)
  }

  public string() {
    return new TextDecoder().decode(this.bytes(this.u32()))
  }

  public u16Array(count: number) {
    const start = this.take(count * 2)
    const result = new Uint16Array(count)
    for (let i = 0; i < count; i++) {
      result[i] = this.view.getUint16(start + i * 2, true)
    }
    return result
  }

  public f32Array(count: number) {
    const start = this.take(count * 4)
    const result = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      result[i] = this.view.getFloat32(start + i * 4, true)
    }
    return result
  }
}
