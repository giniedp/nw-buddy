export const CHUNK_TYPE_NAMES: Readonly<Record<number, string>> = {
  0x1000: 'Mesh',
  0x1001: 'Helper',
  0x1002: 'VertAnim',
  0x1003: 'BoneAnim',
  0x1004: 'GeomNameList',
  0x1005: 'BoneNameList',
  0x1006: 'MtlList',
  0x1007: 'MRM',
  0x1008: 'SceneProps',
  0x1009: 'Light',
  0x100a: 'PatchMesh',
  0x100b: 'Node',
  0x100c: 'Mtl',
  0x100d: 'Controller',
  0x100e: 'Timing',
  0x100f: 'BoneMesh',
  0x1010: 'BoneLightBinding',
  0x1011: 'MeshMorphTarget',
  0x1012: 'BoneInitialPos',
  0x1013: 'SourceInfo',
  0x1014: 'MtlName',
  0x1015: 'ExportFlags',
  0x1016: 'DataStream',
  0x1017: 'MeshSubsets',
  0x1018: 'MeshPhysicsData',
  0x1019: 'ExportMetadata',
  0x2000: 'CompiledBones',
  0x2001: 'CompiledPhysicalBones',
  0x2002: 'CompiledMorphTargets',
  0x2003: 'CompiledPhysicalProxies',
  0x2004: 'CompiledIntFaces',
  0x2005: 'CompiledIntSkinVertices',
  0x2006: 'CompiledExt2IntMap',
  0x3000: 'BreakablePhysics',
  0x3001: 'FaceMap',
  0x3002: 'MotionParameters',
  0x3003: 'FootPlantInfo',
  0x3004: 'BonesBoxes',
  0x3005: 'FoliageInfo',
  0x3006: 'Timestamp',
  0x3007: 'GlobalAnimationHeaderCAF',
  0x3008: 'GlobalAnimationHeaderAIM',
  0x3009: 'BspTreeData',
  0x300a: 'MeshMetadata',
  0x300b: 'DataRef',
}

/**
 * Mesh stream types (`ECgfStreamType`), the index into a mesh chunk's stream ids
 */
export const STREAM_TYPE_NAMES = [
  'Positions',
  'Normals',
  'TexCoords',
  'Colors',
  'Colors2',
  'Indices',
  'Tangents',
  'Dummy0 (ShCoeffs)',
  'Dummy1 (ShapeDeformation)',
  'BoneMapping',
  'FaceMap',
  'VertMats',
  'QTangents',
  'SkinData',
  'Dummy2',
  'P3S_C4B_T2S',
]

const EXPORT_FLAG_NAMES: Array<[number, string]> = [
  [0x0001, 'MERGE_ALL_NODES'],
  [0x0002, 'HAVE_AUTO_LODS'],
  [0x0004, 'USE_CUSTOM_NORMALS'],
  [0x0008, 'WANT_F32_VERTICES'],
  [0x0010, 'EIGHT_WEIGHTS_PER_VERTEX'],
  [0x0020, 'SKINNED_CGF'],
  [0x0040, 'bit 6 (New World)'],
]

const HELPER_TYPE_NAMES = ['Point', 'Dummy', 'XRef', 'Camera', 'Geometry']

export interface ChunkEntry {
  /**
   * Position in the chunk table
   */
  index: number
  type: number
  typeName: string
  version: number
  id: number
  /**
   * Byte offset of the payload in the file
   */
  offset: number
  size: number
}

export interface ChunkFile {
  signature: string
  version: number
  /**
   * Byte offset of the chunk table
   */
  tableOffset: number
  chunks: ChunkEntry[]
}

/**
 * A byte range of the file, or of its `.cgfheap` (`heap`)
 */
export interface ByteRange {
  heap: boolean
  offset: number
  length: number
}

/**
 * A readable field of a chunk. `links` are chunk ids the value refers to, `bytes` a range the value describes.
 */
export interface ChunkField {
  name: string
  value: string
  links?: number[]
  bytes?: ByteRange
  children?: ChunkField[]
}

/**
 * A list in a chunk, e.g. the subsets of a mesh
 */
export interface ChunkTable {
  name: string
  columns: string[]
  rows: string[][]
}

export interface ChunkDetail {
  fields: ChunkField[]
  tables: ChunkTable[]
  /**
   * Why the payload is not described, null when it is
   */
  error: string | null
}

const CHUNK_FILE_SIGNATURE = 'CrCh'
const CHUNK_FILE_VERSION_0746 = 0x746

/**
 * Reads the header and the chunk table of a chunk file
 */
export function readChunkFile(bytes: Uint8Array): ChunkFile {
  if (bytes.length < 16) {
    throw new Error('The file is too short for a chunk file')
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  if (signature !== CHUNK_FILE_SIGNATURE) {
    throw new Error(`Not a chunk file: the signature is '${signature}', expected '${CHUNK_FILE_SIGNATURE}'`)
  }
  const version = view.getUint32(4, true)
  const count = view.getUint32(8, true)
  const tableOffset = view.getUint32(12, true)
  const chunks: ChunkEntry[] = []
  if (version === CHUNK_FILE_VERSION_0746) {
    // type u16, version u16, id i32, size u32, offset u32
    for (let i = 0; i < count; i++) {
      const at = tableOffset + i * 16
      if (at + 16 > bytes.length) {
        throw new Error(`The chunk table ends after ${i} of ${count} chunks`)
      }
      const type = view.getUint16(at, true)
      chunks.push({
        index: i,
        type,
        typeName: chunkTypeName(type),
        version: view.getUint16(at + 2, true),
        id: view.getInt32(at + 4, true),
        size: view.getUint32(at + 8, true),
        offset: view.getUint32(at + 12, true),
      })
    }
  } else {
    throw new Error(`Unknown chunk file version 0x${version.toString(16)}`)
  }
  return { signature, version, tableOffset, chunks }
}

export function chunkTypeName(type: number): string {
  return CHUNK_TYPE_NAMES[type] ?? `0x${type.toString(16)}`
}

export function hex(value: number, digits = 4) {
  return `0x${(value >>> 0).toString(16).padStart(digits, '0')}`
}

/**
 * The readable fields and lists of a chunk
 */
export function describeChunk(bytes: Uint8Array, chunk: ChunkEntry): ChunkDetail {
  if (chunk.offset + chunk.size > bytes.length) {
    return { fields: [], tables: [], error: `The chunk ends at ${chunk.offset + chunk.size}, after the file` }
  }
  const reader = new FieldReader(bytes, chunk.offset, chunk.size)
  const decode = DECODERS[chunk.type]?.[chunk.version]
  if (!decode) {
    return { fields: [], tables: [], error: `${chunk.typeName} version ${hex(chunk.version)} is not described` }
  }
  try {
    return { ...decode(reader, chunk), error: null }
  } catch (e) {
    return { fields: [], tables: [], error: String((e as Error)?.message ?? e) }
  }
}

type Decoder = (r: FieldReader, chunk: ChunkEntry) => { fields: ChunkField[]; tables: ChunkTable[] }

class FieldReader {
  public readonly bytes: Uint8Array
  public readonly view: DataView
  public at: number
  public readonly end: number
  public constructor(bytes: Uint8Array, offset: number, size: number) {
    this.bytes = bytes
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    this.at = offset
    this.end = offset + size
  }
  private need(n: number) {
    if (this.at + n > this.end) {
      throw new Error(`The chunk is shorter than its layout (${this.end - this.at} bytes left, ${n} needed)`)
    }
  }
  public i32() {
    this.need(4)
    const v = this.view.getInt32(this.at, true)
    this.at += 4
    return v
  }
  public u32() {
    this.need(4)
    const v = this.view.getUint32(this.at, true)
    this.at += 4
    return v
  }
  public f32() {
    this.need(4)
    const v = this.view.getFloat32(this.at, true)
    this.at += 4
    return v
  }
  public vec3() {
    return [this.f32(), this.f32(), this.f32()]
  }
  public string(length: number) {
    this.need(length)
    const block = this.bytes.subarray(this.at, this.at + length)
    this.at += length
    const zero = block.indexOf(0)
    return decoder.decode(zero >= 0 ? block.subarray(0, zero) : block)
  }
  public skip(n: number) {
    this.need(n)
    this.at += n
  }
}

const decoder = new TextDecoder()

const num = (v: number) => (Number.isInteger(v) ? String(v) : formatFloat(v))
const vec = (v: number[]) => v.map(formatFloat).join(', ')
const field = (name: string, value: string | number, extra?: Partial<ChunkField>): ChunkField => ({
  name,
  value: typeof value === 'number' ? num(value) : value,
  ...extra,
})
/**
 * A field that refers to another chunk, -1 (and 0 for optional ids) means none
 */
const linkField = (name: string, id: number) => field(name, id, id > 0 ? { links: [id] } : undefined)
const flagsField = (name: string, value: number, names: Array<[number, string]>) => {
  const set = names.filter(([bit]) => value & bit).map(([, n]) => n)
  return field(name, set.length ? `${hex(value)} (${set.join(', ')})` : hex(value))
}

function formatFloat(v: number) {
  if (!Number.isFinite(v)) {
    return String(v)
  }
  return Math.abs(v) >= 1e6 || (v !== 0 && Math.abs(v) < 1e-4) ? v.toExponential(4) : String(+v.toFixed(5))
}

const readNode: Decoder = (r) => {
  const name = r.string(64)
  const objectId = r.i32()
  const parentId = r.i32()
  const childCount = r.i32()
  const materialId = r.i32()
  r.skip(4) // _obsoleteA_
  const tm: number[] = []
  for (let i = 0; i < 16; i++) {
    tm.push(r.f32())
  }
  r.skip(40) // _obsoleteB_, _obsoleteC_, _obsoleteD_
  const posCtrl = r.i32()
  const rotCtrl = r.i32()
  const sclCtrl = r.i32()
  const propertyLength = r.i32()
  const properties = propertyLength > 0 ? r.string(propertyLength) : ''
  return {
    fields: [
      field('name', name),
      linkField('object', objectId),
      field('parent', parentId, parentId >= 0 ? { links: [parentId] } : undefined),
      field('children', childCount),
      linkField('material', materialId),
      field('transform', '', {
        children: [0, 1, 2, 3].map((row) => field(`row ${row}`, vec(tm.slice(row * 4, row * 4 + 4)))),
      }),
      // translations are stored in centimeters (CGFLoader VERTEX_SCALE)
      field('position (m)', vec([tm[12] / 100, tm[13] / 100, tm[14] / 100])),
      field('controllers (pos, rot, scl)', `${posCtrl}, ${rotCtrl}, ${sclCtrl}`),
      field('properties', properties || '—'),
    ],
    tables: [],
  }
}

function readMeshCommon(r: FieldReader, chunk: ChunkEntry, streamSlots: number) {
  const flags = r.i32()
  const flags2 = r.i32()
  const vertexCount = r.i32()
  const indexCount = r.i32()
  const subsetCount = r.i32()
  const subsetsId = r.i32()
  const vertAnimId = r.i32()
  const streams: ChunkField[] = []
  for (let type = 0; type < 16; type++) {
    const ids: number[] = []
    for (let slot = 0; slot < streamSlots; slot++) {
      ids.push(r.i32())
    }
    const used = ids.filter((id) => id > 0)
    if (used.length) {
      streams.push(field(STREAM_TYPE_NAMES[type] ?? `stream ${type}`, used.join(', '), { links: used }))
    }
  }
  const physics: number[] = []
  for (let i = 0; i < 4; i++) {
    physics.push(r.i32())
  }
  const bboxMin = r.vec3()
  const bboxMax = r.vec3()
  const texMappingDensity = r.f32()
  const faceArea = r.f32()
  const usedPhysics = physics.filter((id) => id > 0)
  return {
    fields: [
      field('flags', `${hex(flags)}, flags2 ${hex(flags2)}`),
      field('vertices', vertexCount),
      field('indices', indexCount),
      field('subsets', subsetCount),
      linkField('subsets chunk', subsetsId),
      linkField('vert anim chunk', vertAnimId),
      field('streams', `${streams.length}`, { children: streams }),
      field(
        'physics',
        usedPhysics.length ? usedPhysics.join(', ') : '—',
        usedPhysics.length ? { links: usedPhysics } : undefined,
      ),
      field('bounds min', vec(bboxMin)),
      field('bounds max', vec(bboxMax)),
      field('tex mapping density', texMappingDensity),
      field('geometric mean face area', faceArea),
    ],
    tables: [],
  }
}

const readSubsets: Decoder = (r) => {
  const flags = r.i32()
  const count = r.i32()
  r.skip(8)
  const rows: string[][] = []
  for (let i = 0; i < count; i++) {
    rows.push([
      String(i),
      String(r.i32()),
      String(r.i32()),
      String(r.i32()),
      String(r.i32()),
      String(r.i32()),
      formatFloat(r.f32()),
      vec(r.vec3()),
    ])
  }
  return {
    fields: [field('flags', hex(flags)), field('count', count)],
    tables: [
      {
        name: 'subsets',
        columns: ['#', 'first index', 'indices', 'first vertex', 'vertices', 'material', 'radius', 'center'],
        rows,
      },
    ],
  }
}

function readDataStream(withIndex: boolean): Decoder {
  return (r) => {
    const flags = r.u32()
    const type = r.u32()
    const index = withIndex ? r.u32() : 0
    const count = r.u32()
    const elementSize = r.u32()
    r.skip(8)
    const length = count * elementSize
    return {
      fields: [
        field('flags', hex(flags)),
        field('type', `${STREAM_TYPE_NAMES[type] ?? type} (${type})`),
        field('index', index),
        field('elements', count),
        field('element size', elementSize),
        field('data', `${length} bytes`, { bytes: { heap: false, offset: r.at, length } }),
      ],
      tables: [],
    }
  }
}

const readDataRef: Decoder = (r) => {
  const flags = r.u32()
  const index = r.u32()
  const offset = r.u32()
  const size = r.u32()
  const stride = r.u32()
  return {
    fields: [
      field('flags', hex(flags)),
      field('index', index),
      field('heap range', `${size} bytes @ ${offset}`, { bytes: { heap: true, offset, length: size } }),
      field('stride', stride),
      field('elements', stride ? size / stride : 0),
    ],
    tables: [],
  }
}

function readMtlName(nameLength: number, flagsFirst: boolean): Decoder {
  return (r) => {
    const fields: ChunkField[] = []
    if (flagsFirst) {
      fields.push(field('flags', `${hex(r.u32())}, flags2 ${hex(r.u32())}`))
    }
    fields.push(field('name', r.string(nameLength)))
    return { fields, tables: [] }
  }
}

const readExportFlags: Decoder = (r) => {
  const flags = r.u32()
  const rc = [r.u32(), r.u32(), r.u32(), r.u32()]
  const rcString = r.string(16)
  return {
    fields: [
      flagsField('flags', flags, EXPORT_FLAG_NAMES),
      field('rc version', rc.join('.')),
      field('rc version string', rcString || '—'),
    ],
    tables: [],
  }
}

const readHelper: Decoder = (r) => {
  const type = r.i32()
  const size = r.vec3()
  return {
    fields: [field('type', `${HELPER_TYPE_NAMES[type] ?? type} (${type})`), field('size', vec(size))],
    tables: [],
  }
}

/**
 * The text of `SourceInfo` and `ExportMetadata`, after the first word (the loader skips it too)
 */
const readText: Decoder = (r, chunk) => {
  r.skip(4)
  const text = r.string(chunk.size - 4)
  return { fields: [field('text', text || '—')], tables: [] }
}

const readMeshMetadata: Decoder = (r) => {
  const flags = r.u32()
  const rows: string[][] = []
  for (let slot = 0; slot < 6; slot++) {
    const memory = r.u32()
    const faceArea = r.f32()
    const distance = r.f32()
    rows.push([
      slot === 0 ? 'model' : `_lod${slot}`,
      flags & (1 << slot) ? 'yes' : 'no',
      String(memory),
      formatFloat(faceArea),
      formatFloat(distance),
    ])
  }
  const min = r.vec3()
  const max = r.vec3()
  return {
    fields: [field('slots', hex(flags, 2)), field('bounds min', vec(min)), field('bounds max', vec(max))],
    tables: [
      {
        name: 'lods',
        columns: ['slot', 'set', 'render mesh bytes', 'mean face area', 'lod distance'],
        rows,
      },
    ],
  }
}

const readTiming: Decoder = (r) => {
  const secsPerTick = r.f32()
  const ticksPerFrame = r.i32()
  const name = r.string(32)
  const start = r.i32()
  const end = r.i32()
  return {
    fields: [
      field('seconds per tick', secsPerTick),
      field('ticks per frame', ticksPerFrame),
      field('range', `${name || '—'}: ${start} .. ${end}`),
    ],
    tables: [],
  }
}

const DECODERS: Record<number, Record<number, Decoder>> = {
  0x1000: {
    0x0801: (r, c) => readMeshCommon(r, c, 1),
    0x0802: (r, c) => readMeshCommon(r, c, 8),
  },
  0x1001: { 0x0744: readHelper },
  0x100b: { 0x0823: readNode, 0x0824: readNode },
  0x100e: { 0x0918: readTiming },
  0x1013: { 0x0001: readText },
  0x1014: {
    0x0800: readMtlName(128, true),
    0x0802: readMtlName(128, false),
    0x0804: readMtlName(64, false),
  },
  0x1015: { 0x0001: readExportFlags },
  0x1016: { 0x0800: readDataStream(false), 0x0801: readDataStream(true) },
  0x1017: { 0x0800: readSubsets },
  0x1019: { 0x0001: readText },
  0x300a: { 0x0001: readMeshMetadata },
  0x300b: { 0x0800: readDataRef },
}
