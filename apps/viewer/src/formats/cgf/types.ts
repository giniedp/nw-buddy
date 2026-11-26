/**
 * Chunk types of CryEngine chunk files (`.cgf`, `.skin`), only those read by {@link parseCgf}
 *
 * @remarks
 * See nw-buddy tools/nwbt/formats/cgf/types.go for the full list
 */
export const CgfChunkType = {
  Mesh: 0x1000,
  Helper: 0x1001,
  Node: 0x100b,
  MtlName: 0x1014,
  ExportFlags: 0x1015,
  DataStream: 0x1016,
  MeshSubsets: 0x1017,
  MeshPhysicsData: 0x1018,
  DataRef: 0x300b,
  CompiledBones: 0x2000,
} as const

/**
 * Flags of the ExportFlags chunk
 */
export const CgfExportFlags = {
  MergeAllNodes: 0x0001,
  /**
   * The resource compiler created levels of detail, they are stored as sibling files `<name>_lod1.cgf`, `_lod2`, …
   */
  HaveAutoLods: 0x0002,
} as const

/**
 * Flags of mesh chunks
 */
export const CgfMeshFlags = {
  /**
   * {@link CgfMesh.geometricMeanFaceArea} contains a valid value
   */
  HasFaceArea: 0x0008,
} as const

/**
 * Stream types of mesh chunks, the index into {@link CgfMesh.streams}
 */
export const CgfStreamType = {
  Positions: 0,
  Normals: 1,
  TexCoords: 2,
  Colors: 3,
  Colors2: 4,
  Indices: 5,
  Tangents: 6,
  ShCoeffs: 7,
  ShapeDeformation: 8,
  BoneMapping: 9,
  FaceMap: 10,
  VertMats: 11,
  QTangents: 12,
  SkinData: 13,
  Dummy2: 14,
  P3S_C4B_T2S: 15,
} as const

export interface CgfChunkHeader {
  type: number
  version: number
  id: number
  size: number
  offset: number
}

/**
 * A parsed chunk file
 *
 * @remarks
 * Stream data is not copied, {@link CgfDataStream.data} views the buffer that was parsed
 */
export interface CgfFile {
  version: number
  chunks: CgfChunkHeader[]
  nodes: CgfNode[]
  meshes: Map<number, CgfMesh>
  subsets: Map<number, CgfMeshSubset[]>
  dataRefs: Map<number, CgfDataRef>
  dataStreams: Map<number, CgfDataStream>
  /**
   * Flags of the ExportFlags chunk, see {@link CgfExportFlags}, 0 if the file has none
   */
  exportFlags: number
  /**
   * Material reference of the first non-empty MtlName chunk: an asset id or a file path, see {@link isAssetIdRef}
   */
  mtlRef: string | null
  /**
   * The skeleton of the CompiledBones chunk (`.chr`, `.skin`), empty without one. Bone mapping streams index it.
   */
  bones: CgfBone[]
}

/**
 * A bone of the CompiledBones chunk (CryHeaders.h BONE_ENTITY / nwbt cgf BoneData, 584 bytes)
 */
export interface CgfBone {
  /**
   * CRC32 of the bone name, the key of the `.caf` controllers (not an index)
   */
  controllerId: number
  name: string
  /**
   * Index of the parent bone, -1 for the root
   */
  parent: number
  limbId: number
  /**
   * The default model space transform (initial pose Bone2World), column major, translation in meters
   */
  boneToWorld: Float32Array
  /**
   * The inverse of {@link boneToWorld} as stored (World2Bone), column major
   */
  worldToBone: Float32Array
}

export interface CgfNode {
  id: number
  name: string
  /**
   * Chunk id of the object (mesh or helper chunk)
   */
  objectId: number
  /**
   * Chunk id of the parent node, -1 for root nodes
   */
  parentId: number
  materialId: number
  /**
   * Local transform, row major as stored in the file (translation in elements 12-14), translation scaled to meters
   */
  transform: Float32Array
  properties: string
}

export interface CgfMesh {
  id: number
  flags: number
  flags2: number
  vertexCount: number
  indexCount: number
  subsetCount: number
  subsetsChunkId: number
  /**
   * Chunk ids (DataStream or DataRef) per stream type ({@link CgfStreamType}), 8 slots each, 0 for unused
   */
  streams: Int32Array[]
  physicsDataChunkIds: Int32Array
  bboxMin: [number, number, number]
  bboxMax: [number, number, number]
  /**
   * Geometric mean of the triangle areas, 0 if the file does not store it ({@link CgfMeshFlags.HasFaceArea})
   */
  geometricMeanFaceArea: number
}

export interface CgfMeshSubset {
  firstIndex: number
  numIndices: number
  firstVertex: number
  numVertices: number
  materialId: number
  radius: number
  center: [number, number, number]
}

/**
 * Reference to stream data in the `.cgfheap` file
 */
export interface CgfDataRef {
  id: number
  flags: number
  index: number
  /**
   * Byte offset in the heap
   */
  offset: number
  /**
   * Byte size in the heap
   */
  size: number
  /**
   * Byte size of one element
   */
  stride: number
}

/**
 * Stream data stored inline in the chunk file (old format)
 */
export interface CgfDataStream {
  id: number
  flags: number
  streamType: number
  streamIndex: number
  elementCount: number
  elementSize: number
  data: Uint8Array
}
