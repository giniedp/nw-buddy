import {
  CgfChunkType,
  CgfMeshFlags,
  type CgfBone,
  type CgfChunkHeader,
  type CgfDataRef,
  type CgfDataStream,
  type CgfFile,
  type CgfMesh,
  type CgfMeshSubset,
  type CgfNode,
} from './types'

// Ported from nw-buddy tools/nwbt/formats/cgf (reader.go and chunk_*.go).
// Only the chunks needed to render static meshes are read.

const SIGNATURE = 'CrCh'
const FILE_VERSION_3_6 = 0x746
// node translations are stored in centimeters: CGFSaver.cpp SCALE_TO_CGF, CGFLoader.cpp VERTEX_SCALE (0.01) when reading
// the node tm. Positions of compiled meshes (0x0802 streams) are in meters, only the obsolete 0x0745 mesh chunk is scaled.
const SCALE_TO_CGF = 100

/**
 * Parses a CryEngine chunk file (`.cgf`)
 */
export function parseCgf(buffer: ArrayBuffer | ArrayBufferView): CgfFile {
  const bytes = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  if (signature !== SIGNATURE) {
    throw new Error(`Invalid cgf signature. Expected '${SIGNATURE}' but was '${signature}'`)
  }
  const version = view.getUint32(4, true)
  if (version < FILE_VERSION_3_6) {
    throw new Error(`Unsupported cgf version 0x${version.toString(16)}`)
  }
  const chunkCount = view.getUint32(8, true)
  const chunkOffset = view.getUint32(12, true)

  const result: CgfFile = {
    version,
    chunks: [],
    nodes: [],
    meshes: new Map(),
    subsets: new Map(),
    dataRefs: new Map(),
    dataStreams: new Map(),
    exportFlags: 0,
    mtlRef: null,
    bones: [],
  }

  for (let i = 0; i < chunkCount; i++) {
    const at = chunkOffset + i * 16
    result.chunks.push({
      type: view.getUint16(at, true),
      version: view.getUint16(at + 2, true),
      id: view.getInt32(at + 4, true),
      size: view.getUint32(at + 8, true),
      offset: view.getUint32(at + 12, true),
    })
  }

  for (const chunk of result.chunks) {
    switch (chunk.type) {
      case CgfChunkType.Node:
        if (chunk.version === 0x0824) {
          result.nodes.push(readNode(view, bytes, chunk))
        }
        break
      case CgfChunkType.Mesh:
        if (chunk.version === 0x0802) {
          result.meshes.set(chunk.id, readMesh(view, chunk))
        }
        break
      case CgfChunkType.MeshSubsets:
        if (chunk.version === 0x0800) {
          result.subsets.set(chunk.id, readSubsets(view, chunk))
        }
        break
      case CgfChunkType.DataRef:
        if (chunk.version === 0x0800) {
          result.dataRefs.set(chunk.id, readDataRef(view, chunk))
        }
        break
      case CgfChunkType.DataStream:
        if (chunk.version === 0x0801) {
          result.dataStreams.set(chunk.id, readDataStream(view, bytes, chunk))
        }
        break
      case CgfChunkType.MtlName:
        result.mtlRef ||= readMtlName(view, bytes, chunk)
        break
      case CgfChunkType.ExportFlags:
        result.exportFlags = view.getUint32(chunk.offset, true)
        break
      case CgfChunkType.CompiledBones:
        if (chunk.version === 0x0800 && !result.bones.length) {
          result.bones = readCompiledBones(view, bytes, chunk)
        }
        break
    }
  }
  return result
}

/**
 * Whether a material reference (MtlName chunk) is an asset id (`{guid}` or `guid:subid`) instead of a file path
 */
export function isAssetIdRef(ref: string): boolean {
  return /^\{?[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}\}?/i.test(ref)
}

function readNode(view: DataView, bytes: Uint8Array, chunk: CgfChunkHeader): CgfNode {
  let at = chunk.offset
  const name = readFixedString(bytes, at, 64)
  at += 64
  const objectId = view.getInt32(at, true)
  const parentId = view.getInt32(at + 4, true)
  // nChildren at +8
  const materialId = view.getInt32(at + 12, true)
  at += 16 + 4 // + _obsoleteA_
  const transform = new Float32Array(16)
  for (let i = 0; i < 16; i++) {
    transform[i] = view.getFloat32(at + i * 4, true)
  }
  at += 64
  transform[12] /= SCALE_TO_CGF
  transform[13] /= SCALE_TO_CGF
  transform[14] /= SCALE_TO_CGF
  transform[15] = 1
  // _obsoleteB_ (3 floats), _obsoleteC_ (4 floats), _obsoleteD_ (3 floats), pos/rot/scl controller ids
  at += 40 + 12
  const propertyLength = view.getInt32(at, true)
  at += 4
  const properties = propertyLength > 0 ? readFixedString(bytes, at, propertyLength) : ''
  return { id: chunk.id, name, objectId, parentId, materialId, transform, properties }
}

function readMesh(view: DataView, chunk: CgfChunkHeader): CgfMesh {
  let at = chunk.offset
  const int = () => {
    const value = view.getInt32(at, true)
    at += 4
    return value
  }
  const float = () => {
    const value = view.getFloat32(at, true)
    at += 4
    return value
  }
  const flags = int()
  const flags2 = int()
  const vertexCount = int()
  const indexCount = int()
  const subsetCount = int()
  const subsetsChunkId = int()
  int() // vertAnimId
  const streams: Int32Array[] = []
  for (let i = 0; i < 16; i++) {
    const ids = new Int32Array(8)
    for (let j = 0; j < 8; j++) {
      ids[j] = int()
    }
    streams.push(ids)
  }
  const physicsDataChunkIds = new Int32Array(4)
  for (let i = 0; i < 4; i++) {
    physicsDataChunkIds[i] = int()
  }
  const bboxMin: [number, number, number] = [float(), float(), float()]
  const bboxMax: [number, number, number] = [float(), float(), float()]
  float() // texMappingDensity
  const faceArea = float()
  return {
    id: chunk.id,
    flags,
    flags2,
    vertexCount,
    indexCount,
    subsetCount,
    subsetsChunkId,
    streams,
    physicsDataChunkIds,
    bboxMin,
    bboxMax,
    geometricMeanFaceArea: flags & CgfMeshFlags.HasFaceArea ? faceArea : 0,
  }
}

function readSubsets(view: DataView, chunk: CgfChunkHeader): CgfMeshSubset[] {
  let at = chunk.offset + 4 // flags
  const count = view.getInt32(at, true)
  at += 4 + 8
  const result: CgfMeshSubset[] = []
  for (let i = 0; i < count; i++) {
    result.push({
      firstIndex: view.getInt32(at, true),
      numIndices: view.getInt32(at + 4, true),
      firstVertex: view.getInt32(at + 8, true),
      numVertices: view.getInt32(at + 12, true),
      materialId: view.getInt32(at + 16, true),
      radius: view.getFloat32(at + 20, true),
      center: [view.getFloat32(at + 24, true), view.getFloat32(at + 28, true), view.getFloat32(at + 32, true)],
    })
    at += 36
  }
  return result
}

function readDataRef(view: DataView, chunk: CgfChunkHeader): CgfDataRef {
  const at = chunk.offset
  return {
    id: chunk.id,
    flags: view.getUint32(at, true),
    index: view.getUint32(at + 4, true),
    offset: view.getUint32(at + 8, true),
    size: view.getUint32(at + 12, true),
    stride: view.getUint32(at + 16, true),
  }
}

function readDataStream(view: DataView, bytes: Uint8Array, chunk: CgfChunkHeader): CgfDataStream {
  const at = chunk.offset
  const elementCount = view.getUint32(at + 12, true)
  const elementSize = view.getUint32(at + 16, true)
  const start = at + 20 + 8
  return {
    id: chunk.id,
    flags: view.getUint32(at, true),
    streamType: view.getUint32(at + 4, true),
    streamIndex: view.getUint32(at + 8, true),
    elementCount,
    elementSize,
    data: bytes.subarray(start, start + elementCount * elementSize),
  }
}

const COMPILED_BONES_HEADER = 32
const BONE_SIZE = 584
const BONE_WORLD_TO_BONE = 216
const BONE_BONE_TO_WORLD = 264
const BONE_NAME = 312
const BONE_LIMB_ID = 568
const BONE_PARENT_OFFSET = 572

function readCompiledBones(view: DataView, bytes: Uint8Array, chunk: CgfChunkHeader): CgfBone[] {
  const count = Math.floor((chunk.size - COMPILED_BONES_HEADER) / BONE_SIZE)
  const result: CgfBone[] = []
  for (let i = 0; i < count; i++) {
    const at = chunk.offset + COMPILED_BONES_HEADER + i * BONE_SIZE
    const parentOffset = view.getInt32(at + BONE_PARENT_OFFSET, true)
    result.push({
      controllerId: view.getUint32(at, true),
      name: readFixedString(bytes, at + BONE_NAME, 256),
      // the parent is this[m_nOffsetParent], 0 for the root
      parent: parentOffset === 0 ? -1 : i + parentOffset,
      limbId: view.getInt32(at + BONE_LIMB_ID, true),
      worldToBone: readMatrix34(view, at + BONE_WORLD_TO_BONE),
      boneToWorld: readMatrix34(view, at + BONE_BONE_TO_WORLD),
    })
  }
  return result
}

/**
 * Reads a row major Matrix34 (rows of rotation and translation) into a column major 4x4 matrix
 */
function readMatrix34(view: DataView, at: number): Float32Array {
  const out = new Float32Array(16)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      out[col * 4 + row] = view.getFloat32(at + (row * 4 + col) * 4, true)
    }
  }
  out[15] = 1
  return out
}

function readMtlName(view: DataView, bytes: Uint8Array, chunk: CgfChunkHeader): string | null {
  switch (chunk.version) {
    case 0x0800:
      // flags, flags2, name[128]
      return readFixedString(bytes, chunk.offset + 8, 128) || null
    case 0x0802:
      return readFixedString(bytes, chunk.offset, 128) || null
    case 0x0804:
      return readFixedString(bytes, chunk.offset, 64) || null
  }
  return null
}

const decoder = new TextDecoder()

/**
 * Reads a zero terminated string from a fixed size block
 */
function readFixedString(bytes: Uint8Array, offset: number, length: number): string {
  const block = bytes.subarray(offset, offset + length)
  const end = block.indexOf(0)
  return decoder.decode(end >= 0 ? block.subarray(0, end) : block)
}
