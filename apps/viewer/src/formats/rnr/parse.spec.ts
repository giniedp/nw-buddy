import { describe, expect, it } from 'vitest'
import { parseRnr, rnrTransformToMat4 } from './parse'
import { RNR_MAGIC, RnrShapeKindId } from './types'

class Writer {
  private bytes: number[] = []
  private view = new DataView(new ArrayBuffer(4))

  public u8(value: number) {
    this.bytes.push(value & 0xff)
    return this
  }
  public u16(value: number) {
    this.view.setUint16(0, value, true)
    this.bytes.push(this.view.getUint8(0), this.view.getUint8(1))
    return this
  }
  public u32(value: number) {
    this.view.setUint32(0, value, true)
    for (let i = 0; i < 4; i++) this.bytes.push(this.view.getUint8(i))
    return this
  }
  public f32(...values: number[]) {
    for (const value of values) {
      this.view.setFloat32(0, value, true)
      for (let i = 0; i < 4; i++) this.bytes.push(this.view.getUint8(i))
    }
    return this
  }
  public zeros(count: number) {
    for (let i = 0; i < count; i++) this.bytes.push(0)
    return this
  }
  public get length() {
    return this.bytes.length
  }
  public buffer() {
    return new Uint8Array(this.bytes).buffer
  }
}

/**
 * Version 7 header without objects, zero guid, no material filter, one shape
 */
function header() {
  return new Writer().u32(RNR_MAGIC).u32(7).u32(0).zeros(16).u8(0).u8(0).u8(1)
}

const IDENTITY_3X4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]

describe('parseRnr', () => {
  it('parses a box shape', () => {
    const data = header().u32(RnrShapeKindId.box).f32(1, 2, 3, 4).u32(0).buffer()
    const asset = parseRnr(data)
    expect(asset.version).toBe(7)
    expect(asset.shapes).toHaveLength(1)
    const shape = asset.shapes[0]
    expect(shape.kind).toBe('box')
    if (shape.kind === 'box') {
      expect(shape.halfExtents).toEqual({ x: 1, y: 2, z: 3 })
      expect(shape.convexRadius).toBe(4)
    }
    expect(shape.localTransform).toBeNull()
    expect(shape.extra).toBeNull()
  })

  it('decodes a 48 byte trailing block as local transform', () => {
    const transform = [1, 0, 0, 0.5, 0, 1, 0, 0, 0, 0, 1, 1]
    const data = header()
      .u32(RnrShapeKindId.sphere)
      .f32(2)
      .u32(48)
      .f32(...transform)
      .buffer()
    const shape = parseRnr(data).shapes[0]
    expect(shape.kind).toBe('sphere')
    expect(Array.from(shape.localTransform)).toEqual(transform)
    const mat = rnrTransformToMat4(shape.localTransform)
    expect(mat.slice(12, 15)).toEqual([0.5, 0, 1])
  })

  it('parses objects and the material filter', () => {
    const data = new Writer()
      .u32(RNR_MAGIC)
      .u32(7)
      .u32(1)
      .u32(3)
      .u8(0x61)
      .u8(0x62)
      .u8(0x63)
      .u32(2)
      .u16(5)
      .u16(6)
      .zeros(16)
      .u8(1)
      .u8(1)
      .u16(1)
      .u16(9)
      .u8(1)
      .u32(RnrShapeKindId.sphere)
      .f32(1)
      .u32(0)
      .buffer()
    const asset = parseRnr(data)
    expect(asset.objects).toHaveLength(1)
    expect(asset.objects[0].name).toBe('abc')
    expect(Array.from(asset.objects[0].materialIndices)).toEqual([5, 6])
    expect(asset.materialFilter.enabled).toBe(true)
    expect(asset.materialFilter.secondaryGeometry).toBe(true)
    expect(Array.from(asset.materialFilter.indices)).toEqual([9])
  })

  it('parses a compound with child transforms', () => {
    const data = header()
      .u32(RnrShapeKindId.compound)
      .u32(2)
      .f32(...IDENTITY_3X4)
      .u32(RnrShapeKindId.box)
      .f32(1, 1, 1, 0)
      .u32(0)
      .f32(1, 0, 0, 5, 0, 1, 0, 0, 0, 0, 1, 0)
      .u32(RnrShapeKindId.capsuleUnaligned)
      .f32(0, 0, 0, 0, 0, 2, 0.5)
      .u32(0)
      .u32(0)
      .buffer()
    const shape = parseRnr(data).shapes[0]
    expect(shape.kind).toBe('compound')
    if (shape.kind === 'compound') {
      expect(shape.children.map((it) => it.shape.kind)).toEqual(['box', 'capsuleUnaligned'])
      expect(shape.children[1].transform[3]).toBe(5)
    }
  })

  it('parses a mesh shape with a v2 bvh', () => {
    const bvh = new Writer()
      .u32(2)
      .zeros(0x6c - 4)
      .buffer()
    const data = header()
      .u32(RnrShapeKindId.mesh)
      .u32(100)
      .u32(3)
      .u32(1)
      .f32(0, 0, 0, 1, 0, 0, 0, 1, 0)
      .u16(0)
      .u16(1)
      .u16(2)
      .u8(0)
      .u32(bvh.byteLength)
    const bytes = new Uint8Array(bvh)
    for (const b of bytes) data.u8(b)
    data.u32(0)
    const shape = parseRnr(data.buffer()).shapes[0]
    expect(shape.kind).toBe('mesh')
    if (shape.kind === 'mesh') {
      expect(shape.vertices).toHaveLength(9)
      expect(Array.from(shape.indices)).toEqual([0, 1, 2])
      expect(shape.adjacentTriangles).toBeNull()
      expect(shape.bvh.version).toBe(2)
    }
  })

  it('rejects bad magic, trailing bytes and unknown kinds', () => {
    expect(() => parseRnr(new Writer().u32(1).u32(7).buffer())).toThrow(/magic/)
    expect(() => parseRnr(header().u32(RnrShapeKindId.sphere).f32(1).u32(0).u8(0).buffer())).toThrow(/trailing/)
    expect(() => parseRnr(header().u32(99).buffer())).toThrow(/unknown/)
    expect(() => parseRnr(header().u32(RnrShapeKindId.softBody).buffer())).toThrow(/unknown/)
  })
})
