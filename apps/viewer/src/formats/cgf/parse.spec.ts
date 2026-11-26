import { describe, expect, it } from 'vitest'
import { isAssetIdRef, parseCgf } from './parse'
import { CgfWriter, sampleFile, writeBone } from './testing'
import { CgfChunkType, CgfStreamType } from './types'

describe('parseCgf', () => {
  it('reads the chunk table', () => {
    const cgf = parseCgf(sampleFile())
    expect(cgf.version).toBe(0x746)
    expect(cgf.chunks.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('rejects other files', () => {
    expect(() => parseCgf(new Uint8Array(16).buffer)).toThrow(/signature/)
  })

  it('reads nodes with translation in meters', () => {
    const [node] = parseCgf(sampleFile()).nodes
    expect(node.name).toBe('root')
    expect(node.objectId).toBe(3)
    expect(node.parentId).toBe(-1)
    expect(Array.from(node.transform.slice(12))).toEqual([1, 2, 3, 1])
    expect(node.properties).toBe('prop=1')
  })

  it('reads meshes and subsets', () => {
    const cgf = parseCgf(sampleFile())
    const mesh = cgf.meshes.get(3)
    expect(mesh.vertexCount).toBe(4)
    expect(mesh.indexCount).toBe(6)
    expect(mesh.streams[CgfStreamType.Positions][0]).toBe(5)
    expect(mesh.streams[CgfStreamType.Tangents][0]).toBe(6)
    expect(mesh.bboxMin).toEqual([-1, -2, -3])
    expect(mesh.bboxMax).toEqual([1, 2, 3])
    const subsets = cgf.subsets.get(mesh.subsetsChunkId)
    expect(subsets.length).toBe(2)
    expect(subsets[1]).toEqual({
      firstIndex: 3,
      numIndices: 3,
      firstVertex: 1,
      numVertices: 3,
      materialId: 1,
      radius: 2,
      center: [1, 1, 1],
    })
  })

  it('reads data refs and inline streams', () => {
    const cgf = parseCgf(sampleFile())
    expect(cgf.dataRefs.get(6)).toEqual({ id: 6, flags: 0, index: 0, offset: 64, size: 64, stride: 16 })
    const stream = cgf.dataStreams.get(7)
    expect(stream.streamType).toBe(CgfStreamType.Indices)
    expect(stream.elementCount).toBe(3)
    expect(stream.elementSize).toBe(2)
    expect(Array.from(new Uint16Array(stream.data.slice().buffer))).toEqual([0, 1, 2])
  })

  it('reads compiled bones with parent indices and column major matrices', () => {
    // root at the origin, child 2 m up (translation in the last column of the row major Matrix34)
    // prettier-ignore
    const up2 = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 2,
    ]
    // prettier-ignore
    const down2 = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, -2,
    ]
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]
    const file = new CgfWriter()
      .chunk(CgfChunkType.CompiledBones, 0x0800, 1, (w) => {
        w.u8(...new Array(32).fill(0))
        writeBone(w, {
          controllerId: 0xf00dbeef,
          name: 'Bip01',
          parentOffset: 0,
          worldToBone: identity,
          boneToWorld: identity,
        })
        writeBone(w, { controllerId: 42, name: 'Bip01 Spine', parentOffset: -1, worldToBone: down2, boneToWorld: up2 })
      })
      .build()
    const { bones } = parseCgf(file)
    expect(bones.map((it) => [it.name, it.controllerId, it.parent, it.limbId])).toEqual([
      ['Bip01', 0xf00dbeef, -1, 7],
      ['Bip01 Spine', 42, 0, 7],
    ])
    expect(Array.from(bones[1].boneToWorld.slice(12))).toEqual([0, 0, 2, 1])
    expect(Array.from(bones[1].worldToBone.slice(12))).toEqual([0, 0, -2, 1])
  })

  it('has no bones without a CompiledBones chunk', () => {
    expect(parseCgf(sampleFile()).bones).toEqual([])
  })

  it('reads the material reference', () => {
    const cgf = parseCgf(sampleFile())
    expect(cgf.mtlRef).toBe('{0A1B2C3D-0000-1111-2222-333344445555}')
    expect(isAssetIdRef(cgf.mtlRef)).toBe(true)
    expect(isAssetIdRef('/objects/props/stone_mat.mtl')).toBe(false)
    expect(isAssetIdRef('17dw06_props_32x32_mesh_chunk_23_16_1__25541450760.mtl')).toBe(false)
  })
})
