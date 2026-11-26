import { describe, expect, it } from 'vitest'
import { buildCgfGeometryOptions, isRenderNode, qtangentFrame, tangentFrameWithNormal } from './geometry'
import { parseCgf } from './parse'
import { CgfWriter, IDENTITY_CM, sampleFile, writeMesh, writeNode } from './testing'
import { CgfChunkType, CgfStreamType } from './types'

const S = 32767

/**
 * Heap of {@link sampleFile}: 4 interleaved vertices (16 bytes) at 0, 4 tangent frames at 64
 */
function sampleHeap() {
  const heap = new Uint8Array(128)
  const view = new DataView(heap.buffer)
  for (let i = 0; i < 4; i++) {
    const at = 64 + i * 16
    // tangent +x, handedness +1 for the first 2 vertices, -1 for the others
    view.setInt16(at, S, true)
    view.setInt16(at + 6, i < 2 ? S : -S, true)
    // bitangent +y
    view.setInt16(at + 10, S, true)
  }
  return heap
}

describe('tangentFrameWithNormal', () => {
  it('replaces the bitangent with the normal and keeps the tangent', () => {
    const heap = sampleHeap()
    const frame = tangentFrameWithNormal({ bytes: heap.subarray(64), count: 4 })
    // cross(+x, +y) = +z, flipped by the handedness
    expect(Array.from(frame.slice(0, 8))).toEqual([S, 0, 0, S, 0, 0, S, 0])
    expect(Array.from(frame.slice(24, 32))).toEqual([S, 0, 0, -S, 0, 0, -S, 0])
  })

  it('does not modify the source', () => {
    const heap = sampleHeap()
    tangentFrameWithNormal({ bytes: heap.subarray(64), count: 4 })
    expect(new DataView(heap.buffer).getInt16(64 + 10, true)).toBe(S)
  })
})

describe('qtangentFrame', () => {
  const frame = (...q: number[][]) => {
    const src = new Int16Array(q.flat().map((v) => Math.round(v * S)))
    return qtangentFrame({ bytes: new Uint8Array(src.buffer), count: q.length })
  }
  const cross = (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]

  it('decodes tangent (column 0), handedness (sign of w) and normal (column 2 · handedness)', () => {
    const out = frame([0, 0, 0, 1], [0, 0, 0, -1])
    expect(Array.from(out.slice(0, 8))).toEqual([S, 0, 0, S, 0, 0, S, 0])
    // reflected: same rotation, the normal flips with the handedness
    expect(Array.from(out.slice(8, 16))).toEqual([S, 0, 0, -S, 0, 0, -S, 0])
  })

  it('gives the engine bitangent (column 1) as cross(normal, tangent) · w', () => {
    // 90° about z: tangent +y, bitangent -x, normal +z
    const h = Math.SQRT1_2
    const out = Array.from(frame([0, 0, h, h])).map((v) => Math.round(v / S))
    expect(out.slice(0, 4)).toEqual([0, 1, 0, 1])
    expect(out.slice(4, 7)).toEqual([0, 0, 1])
    expect(cross(out.slice(4, 7), out.slice(0, 3)).map((v) => v * out[3])).toEqual([-1, 0, 0])
  })

  it('falls back to a Z up frame for a zero quaternion', () => {
    expect(Array.from(frame([0, 0, 0, 0]))).toEqual([S, 0, 0, S, 0, 0, S, 0])
  })
})

describe('buildCgfGeometryOptions', () => {
  it('uses the interleaved heap stream as is', () => {
    const options = buildCgfGeometryOptions(parseCgf(sampleFile()), sampleHeap())
    expect(options.mtlRef).toBe('{0A1B2C3D-0000-1111-2222-333344445555}')
    expect(options.meshes.length).toBe(1)
    const mesh = options.meshes[0]
    expect(mesh.vertexCount).toBe(4)
    expect(mesh.boundingBox).toEqual([-1, -2, -3, 1, 2, 3])
    expect(mesh.vertexBuffer[0].stride).toBe(16)
    expect(mesh.vertexBuffer[0].layout).toEqual({
      position: { type: 'float16x4', byteOffset: 0 },
      color: { type: 'unorm8x4-bgra', byteOffset: 8 },
      texture: { type: 'float16x2', byteOffset: 12 },
    })
    expect((mesh.vertexBuffer[0].data as Uint8Array).byteLength).toBe(64)
    expect(mesh.vertexBuffer[1].layout).toEqual({
      tangent: { type: 'snorm16x4', byteOffset: 0 },
      normal: { type: 'snorm16x4', byteOffset: 8 },
    })
  })

  it('pads odd index counts and keeps the subset ranges', () => {
    const mesh = buildCgfGeometryOptions(parseCgf(sampleFile()), sampleHeap()).meshes[0]
    expect(mesh.indexBuffer.indexType).toBe('uint16')
    expect(Array.from(mesh.indexBuffer.data as Uint16Array)).toEqual([0, 1, 2, 0])
    expect(mesh.subsets).toEqual([
      { indexOffset: 0, indexCount: 3, materialId: 0 },
      { indexOffset: 3, indexCount: 3, materialId: 1 },
    ])
  })

  it('ignores the node transform of a single mesh object, like the engine', () => {
    const options = buildCgfGeometryOptions(parseCgf(sampleFile()), sampleHeap())
    expect(options.roots).toEqual([0])
    expect(options.nodes[0].mesh).toBe(0)
    expect(options.nodes[0].matrix).toBeUndefined()
  })

  it('keeps the node transforms of a compound object as stored, translation in meters', () => {
    const file = new CgfWriter()
      .chunk(CgfChunkType.Node, 0x0824, 1, (w) => writeNode(w, 'a', 3, -1, IDENTITY_CM))
      .chunk(CgfChunkType.Node, 0x0824, 2, (w) => writeNode(w, 'b', 3, -1, IDENTITY_CM))
      .chunk(CgfChunkType.Mesh, 0x0802, 3, (w) =>
        writeMesh(w, {
          verts: 4,
          indices: 4,
          subsetsId: 4,
          streams: { [CgfStreamType.Positions]: 5, [CgfStreamType.Indices]: 6 },
        }),
      )
      .chunk(CgfChunkType.MeshSubsets, 0x0800, 4, (w) => w.i32(0, 1).i32(0, 0).i32(0, 4, 0, 4, 0).f32(1, 0, 0, 0))
      .chunk(CgfChunkType.DataRef, 0x0800, 5, (w) => w.i32(0, 0, 0, 96, 24))
      .chunk(CgfChunkType.DataRef, 0x0800, 6, (w) => w.i32(0, 0, 96, 8, 2))
      .build()
    const options = buildCgfGeometryOptions(parseCgf(file), new Uint8Array(128))
    expect(options.nodes.map((n) => n.mesh)).toEqual([0, 0])
    expect(options.nodes[0].matrix.slice(12)).toEqual([1, 2, 3, 1])
  })

  it('skips meshes without heap data', () => {
    const options = buildCgfGeometryOptions(parseCgf(sampleFile()), null)
    expect(options.meshes.length).toBe(0)
    expect(options.nodes[0].mesh).toBeUndefined()
  })

  it('gives helper and lod nodes no mesh but keeps them in the hierarchy', () => {
    // prettier-ignore
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    const file = new CgfWriter()
      .chunk(CgfChunkType.Node, 0x0824, 1, (w) => writeNode(w, 'root', 4, -1, IDENTITY_CM))
      .chunk(CgfChunkType.Node, 0x0824, 2, (w) => writeNode(w, '$lod1', 4, 1, identity))
      .chunk(CgfChunkType.Node, 0x0824, 3, (w) => writeNode(w, '$physics_proxy', 4, 1, identity))
      .chunk(CgfChunkType.Mesh, 0x0802, 4, (w) =>
        writeMesh(w, {
          verts: 4,
          indices: 4,
          subsetsId: 5,
          streams: { [CgfStreamType.Positions]: 6, [CgfStreamType.Indices]: 7 },
        }),
      )
      .chunk(CgfChunkType.MeshSubsets, 0x0800, 5, (w) => w.i32(0, 1).i32(0, 0).i32(0, 4, 0, 4, 0).f32(1, 0, 0, 0))
      .chunk(CgfChunkType.DataRef, 0x0800, 6, (w) => w.i32(0, 0, 0, 96, 24))
      .chunk(CgfChunkType.DataRef, 0x0800, 7, (w) => w.i32(0, 0, 96, 8, 2))
      .build()
    const options = buildCgfGeometryOptions(parseCgf(file), new Uint8Array(128))
    expect(options.nodes.map((n) => [n.name, n.mesh])).toEqual([
      ['root', 0],
      ['$lod1', undefined],
      ['$physics_proxy', undefined],
    ])
    expect(options.nodes[0].children).toEqual([1, 2])
    expect(options.nodes[1].matrix).toBeUndefined()
    // 24 byte layout, no tangents
    expect(options.meshes[0].vertexBuffer.length).toBe(1)
    expect(options.meshes[0].vertexBuffer[0].layout.position.type).toBe('float32x3')
  })

  it('keeps the bone mapping of a skin apart from the vertex buffers', () => {
    const heap = new Uint8Array(176)
    heap.set(sampleHeap())
    const view = new DataView(heap.buffer)
    // vertex 1: joints 3, 4, 0, 0 with weights 200, 55
    view.setUint16(128 + 12, 3, true)
    view.setUint16(128 + 14, 4, true)
    heap.set([200, 55, 0, 0], 128 + 12 + 8)
    const mesh = buildCgfGeometryOptions(parseCgf(sampleFile({ boneMapping: true })), heap).meshes[0]
    expect(mesh.boneMapping.stride).toBe(12)
    expect(mesh.boneMapping.layout).toEqual({
      joints: { type: 'uint16x4', byteOffset: 0 },
      weights: { type: 'unorm8x4', byteOffset: 8 },
    })
    const data = mesh.boneMapping.data as Uint8Array
    expect(data.byteLength).toBe(48)
    expect(Array.from(data.subarray(12, 24))).toEqual([3, 0, 4, 0, 0, 0, 0, 0, 200, 55, 0, 0])
    expect((mesh.vertexBuffer as { layout: object }[]).some((it) => 'joints' in it.layout)).toBe(false)
  })

  it('adds the node translation of a skin to its positions before skinning, like the engine', () => {
    const heap = new Uint8Array(176)
    heap.set(sampleHeap())
    const view = new DataView(heap.buffer)
    // vertex 2 at (0.5, -1, 2) as float16
    view.setFloat16(32, 0.5, true)
    view.setFloat16(34, -1, true)
    view.setFloat16(36, 2, true)
    const options = buildCgfGeometryOptions(parseCgf(sampleFile({ boneMapping: true })), heap)
    const mesh = options.meshes[0]
    // the sample node is at (1, 2, 3)
    expect(options.nodes[0].matrix).toBeUndefined()
    expect(mesh.boundingBox).toEqual([0, 0, 0, 2, 4, 6])
    expect(mesh.vertexBuffer[0].layout).toEqual({ position: { type: 'float32x3', byteOffset: 0 } })
    expect(Array.from(mesh.vertexBuffer[0].data as Float32Array)).toEqual([1, 2, 3, 1, 2, 3, 1.5, 1, 5, 1, 2, 3])
    expect(mesh.vertexBuffer[1].stride).toBe(16)
    expect(mesh.vertexBuffer[1].layout).toEqual({
      color: { type: 'unorm8x4-bgra', byteOffset: 8 },
      texture: { type: 'float16x2', byteOffset: 12 },
    })
  })

  it('has no bone mapping for a static mesh', () => {
    expect(buildCgfGeometryOptions(parseCgf(sampleFile()), sampleHeap()).meshes[0].boneMapping).toBeUndefined()
  })

  it('detects render nodes like nwbt', () => {
    expect(isRenderNode('Merged')).toBe(true)
    expect(isRenderNode('$lod2')).toBe(false)
    expect(isRenderNode('piece$lod1')).toBe(false)
    expect(isRenderNode('$auto_0')).toBe(false)
    expect(isRenderNode('mesh$physics')).toBe(false)
    expect(isRenderNode('Merged_phys')).toBe(false)
    expect(isRenderNode('$physics_proxy_Merged_phys')).toBe(false)
    expect(isRenderNode('Rock_PhysicsProxy')).toBe(false)
    expect(isRenderNode('jav_prp_ropestranda_proxy')).toBe(true)
    expect(isRenderNode('physical_book')).toBe(true)
  })
})
