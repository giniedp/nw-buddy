import { CgfChunkType, CgfStreamType } from './types'

// test helpers: writes synthetic chunk files

/**
 * Writes a minimal chunk file: header, chunk table, then the chunk bodies
 */
export class CgfWriter {
  private chunks: Array<{ type: number; version: number; id: number; body: Uint8Array }> = []

  public chunk(type: number, version: number, id: number, write: (w: BodyWriter) => void) {
    const w = new BodyWriter()
    write(w)
    this.chunks.push({ type, version, id, body: w.bytes() })
    return this
  }

  public build(): ArrayBuffer {
    const headerSize = 16
    const tableSize = this.chunks.length * 16
    let offset = headerSize + tableSize
    const total = offset + this.chunks.reduce((a, c) => a + c.body.length, 0)
    const out = new Uint8Array(total)
    const view = new DataView(out.buffer)
    out.set([0x43, 0x72, 0x43, 0x68]) // CrCh
    view.setUint32(4, 0x746, true)
    view.setUint32(8, this.chunks.length, true)
    view.setUint32(12, headerSize, true)
    this.chunks.forEach((c, i) => {
      const at = headerSize + i * 16
      view.setUint16(at, c.type, true)
      view.setUint16(at + 2, c.version, true)
      view.setInt32(at + 4, c.id, true)
      view.setUint32(at + 8, c.body.length, true)
      view.setUint32(at + 12, offset, true)
      out.set(c.body, offset)
      offset += c.body.length
    })
    return out.buffer
  }
}

export class BodyWriter {
  private data: number[] = []
  private view = new DataView(new ArrayBuffer(4))
  public i32(...values: number[]) {
    for (const v of values) {
      this.view.setInt32(0, v, true)
      for (let i = 0; i < 4; i++) this.data.push(this.view.getUint8(i))
    }
    return this
  }
  public f32(...values: number[]) {
    for (const v of values) {
      this.view.setFloat32(0, v, true)
      for (let i = 0; i < 4; i++) this.data.push(this.view.getUint8(i))
    }
    return this
  }
  public str(value: string, size: number) {
    for (let i = 0; i < size; i++) this.data.push(i < value.length ? value.charCodeAt(i) : 0)
    return this
  }
  public u8(...values: number[]) {
    this.data.push(...values)
    return this
  }
  public bytes() {
    return new Uint8Array(this.data)
  }
}

export function writeNode(w: BodyWriter, name: string, objectId: number, parentId: number, tm: number[], props = '') {
  w.str(name, 64)
    .i32(objectId, parentId, 0, 0)
    .u8(0, 0, 0, 0)
    .f32(...tm)
  w.f32(...new Array(10).fill(0)) // obsolete B, C, D
  w.i32(-1, -1, -1) // controller ids
  w.i32(props.length).str(props, props.length)
}

export function writeMesh(
  w: BodyWriter,
  opts: { verts: number; indices: number; subsetsId: number; streams: Record<number, number> },
) {
  w.i32(0, 0, opts.verts, opts.indices, 1, opts.subsetsId, 0)
  for (let type = 0; type < 16; type++) {
    w.i32(opts.streams[type] ?? 0, 0, 0, 0, 0, 0, 0, 0)
  }
  w.i32(0, 0, 0, 0) // physics
  w.f32(-1, -2, -3, 1, 2, 3) // bbox
  w.f32(0, 0)
  w.i32(...new Array(30).fill(0))
}

/**
 * Writes one CompiledBones record (584 bytes), matrices as row major Matrix34 (12 floats)
 */
export function writeBone(
  w: BodyWriter,
  bone: { controllerId: number; name: string; parentOffset: number; worldToBone: number[]; boneToWorld: number[] },
) {
  w.i32(bone.controllerId)
  w.u8(...new Array(208).fill(0)) // 2 x BONE_PHYSICS
  w.f32(0) // mass
  w.f32(...bone.worldToBone)
  w.f32(...bone.boneToWorld)
  w.str(bone.name, 256)
  w.i32(7, bone.parentOffset, 0, 0) // limb id, parent offset, child count, child offset
}

// prettier-ignore
export const IDENTITY_CM = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  100, 200, 300, 1,
]

/**
 * A file with one mesh of 4 vertices: interleaved stream at heap 0, tangents at 64, indices inline.
 * With `boneMapping` the mesh has a 12 byte bone mapping stream at heap 128 (a `.skin`).
 */
export function sampleFile(options?: { boneMapping?: boolean }) {
  const writer = new CgfWriter()
  writer
    .chunk(CgfChunkType.MtlName, 0x0802, 1, (w) => w.str('{0A1B2C3D-0000-1111-2222-333344445555}', 128).i32(2))
    .chunk(CgfChunkType.Node, 0x0824, 2, (w) => writeNode(w, 'root', 3, -1, IDENTITY_CM, 'prop=1'))
    .chunk(CgfChunkType.Mesh, 0x0802, 3, (w) =>
      writeMesh(w, {
        verts: 4,
        indices: 6,
        subsetsId: 4,
        streams: {
          [CgfStreamType.Positions]: 5,
          [CgfStreamType.Colors]: 5,
          [CgfStreamType.TexCoords]: 5,
          [CgfStreamType.Tangents]: 6,
          [CgfStreamType.Indices]: 7,
          ...(options?.boneMapping ? { [CgfStreamType.BoneMapping]: 8 } : {}),
        },
      }),
    )
    .chunk(CgfChunkType.MeshSubsets, 0x0800, 4, (w) =>
      w.i32(0, 2).i32(0, 0).i32(0, 3, 0, 3, 0).f32(1.5, 0, 0, 0).i32(3, 3, 1, 3, 1).f32(2, 1, 1, 1),
    )
    .chunk(CgfChunkType.DataRef, 0x0800, 5, (w) => w.i32(0, 0, 0, 64, 16))
    .chunk(CgfChunkType.DataRef, 0x0800, 6, (w) => w.i32(0, 0, 64, 64, 16))
    .chunk(CgfChunkType.DataStream, 0x0801, 7, (w) =>
      w.i32(0, CgfStreamType.Indices, 0, 3, 2).i32(0, 0).u8(0, 0, 1, 0, 2, 0),
    )
  if (options?.boneMapping) {
    writer.chunk(CgfChunkType.DataRef, 0x0800, 8, (w) => w.i32(0, 0, 128, 48, 12))
  }
  return writer.build()
}
