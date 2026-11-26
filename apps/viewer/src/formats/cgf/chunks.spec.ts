import { describe, expect, it } from 'vitest'
import { describeChunk, readChunkFile, type ChunkField } from './chunks'
import { sampleFile } from './testing'

function bytes() {
  return new Uint8Array(sampleFile())
}

function find(fields: ChunkField[], name: string) {
  const it = fields.find((f) => f.name === name)
  if (!it) {
    throw new Error(`no field ${name}`)
  }
  return it
}

describe('readChunkFile', () => {
  it('reads the header and the chunk table', () => {
    const file = readChunkFile(bytes())
    expect(file.signature).toBe('CrCh')
    expect(file.version).toBe(0x746)
    expect(file.chunks.map((c) => `${c.id}:${c.typeName}:${c.version.toString(16)}`)).toEqual([
      '1:MtlName:802',
      '2:Node:824',
      '3:Mesh:802',
      '4:MeshSubsets:800',
      '5:DataRef:800',
      '6:DataRef:800',
      '7:DataStream:801',
    ])
  })

  it('rejects other files', () => {
    expect(() => readChunkFile(new Uint8Array(16))).toThrow(/signature/)
  })
})

describe('describeChunk', () => {
  const data = bytes()
  const file = readChunkFile(data)
  const chunk = (id: number) =>
    describeChunk(
      data,
      file.chunks.find((c) => c.id === id),
    )

  it('describes a node with links and the position in meters', () => {
    const { fields, error } = chunk(2)
    expect(error).toBeNull()
    expect(find(fields, 'name').value).toBe('root')
    expect(find(fields, 'object').links).toEqual([3])
    expect(find(fields, 'parent').links).toBeUndefined()
    expect(find(fields, 'position (m)').value).toBe('1, 2, 3')
    expect(find(fields, 'properties').value).toBe('prop=1')
  })

  it('lists the streams of a mesh by type, with their chunks', () => {
    const { fields } = chunk(3)
    expect(find(fields, 'vertices').value).toBe('4')
    expect(find(fields, 'subsets chunk').links).toEqual([4])
    const streams = find(fields, 'streams').children
    expect(streams.map((s) => `${s.name}=${s.value}`)).toEqual([
      'Positions=5',
      'TexCoords=5',
      'Colors=5',
      'Indices=7',
      'Tangents=6',
    ])
  })

  it('makes a table of the subsets', () => {
    const { tables } = chunk(4)
    expect(tables[0].rows.length).toBe(2)
    expect(tables[0].rows[1].slice(0, 6)).toEqual(['1', '3', '3', '1', '3', '1'])
  })

  it('points data refs into the heap and data streams into the file', () => {
    expect(find(chunk(6).fields, 'heap range').bytes).toEqual({ heap: true, offset: 64, length: 64 })
    const stream = find(chunk(7).fields, 'data')
    expect(stream.bytes.heap).toBe(false)
    expect(stream.bytes.length).toBe(6)
    expect(Array.from(data.subarray(stream.bytes.offset, stream.bytes.offset + 6))).toEqual([0, 0, 1, 0, 2, 0])
  })

  it('names the material', () => {
    expect(find(chunk(1).fields, 'name').value).toBe('{0A1B2C3D-0000-1111-2222-333344445555}')
  })

  it('reports chunks it can not describe', () => {
    const unknown = { index: 0, type: 0x2000, typeName: 'CompiledBones', version: 0x800, id: 9, offset: 16, size: 4 }
    expect(describeChunk(data, unknown).error).toMatch(/not described/)
  })
})
