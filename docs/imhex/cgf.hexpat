#pragma eval_depth 1000
import std.mem;
import std.io;
import std.array;
import std.ptr;
import std.string;

enum ChunkType : u16 {
  Any = 0,
  Mesh = 0x1000 + 0,
	Helper,
	VertAnim,
	BoneAnim,
	GeomNameList,
	BoneNameList,
	MtlList,
	MRM,
	SceneProps,
	Light,
	PatchMesh,
	Node,
	Mtl,
	Controller,
	Timing,
	BoneMesh,
	BoneLightBinding,
	MeshMorphTarget,
	BoneInitialPos,
	SourceInfo,
	MtlName,
	ExportFlags,
	DataStream,
	MeshSubsets,
	MeshPhysicsData,

  CompiledBones = 0x2000,
	CompiledPhysicalBones,
	CompiledMorphTargets,
	CompiledPhysicalProxies,
	CompiledIntFaces,
	CompiledIntSkinVertices,
	CompiledExt2IntMap,

	BreakablePhysics= 0x3000,
	FaceMap,
	MotionParameters,
	FootPlantInfo,
	BonesBoxes,
	FoliageInfo,
	Timestamp,
	GlobalAnimationHeaderCAF,
	GlobalAnimationHeaderAIM,
	BspTreeData
};

struct Vec3 {
  float x;
  float y;
  float z;
};

struct Mat4x4 {
  float r1[4];
  float r2[4];
  float r3[4];
  float r4[4];
};

struct Header {
  u16 fileType;
  u16 fileVersion;
  u32 chunkCount;
  u32 chunkOffset;
} [[format("format_file_header")]];

fn format_file_header(ref Header it) {
  return std::format("0x{:x}@0x{:x} chunks {}", it.fileType, it.fileVersion, it.chunkCount);
};

struct ChunkMtlName<auto Version> {
  if (Version == 0x0800) {
    u32 flags;
    u32 flags2;
    char name[128];
    u32 physicalType;
    u32 subMaterialCount;
    u32 subMaterialIds[subMaterialCount];
    u32 advancedDataChunkId;
    float opacity;
  } else if (Version == 0x0802) {
    char name[128];
    u32 subMaterialCount;
  } if (Version == 0x0804) {
    char assetId[64];
    u32 childCount;
  }
};

struct ChunkMeshPhysicsData<auto Version> {
  if (Version == 0x0800) {
    u32 dataSize;
    u32 flags;
    u32 tetrahedraDataSize;
    u32 tetrahedraChunkId;
  }
};

struct ChunkHelper<auto Version> {
  if (Version == 0x0744) {
    u32 type;
    Vec3 size;
  }
};

struct MeshSubset {
  u32 firstIndex;
  u32 numIndices;
  u32 firstVertex;
  u32 numVertices;
  u32 materialId;
  float radius;
  Vec3 center;
};
struct ChunkMeshSubsets<auto Version> {
  if (Version == 0x0800) {
    u32 flags;
    u32 subsetCount;
    u32 unknown1;
    u32 unknown2;
    MeshSubset subsets[subsetCount];
  }
};

struct ChunkNode<auto Version> {
  char name[64];
  u32 objectId;
  u32 parentId;
  u32 numChildren;
  u32 materialId;
  u32 unknown1;
  Mat4x4 transform;
  u8 unknown2[10];
  u32 positionControllerId;
  u32 rotationControllerId;
  u32 scaleControllerId;
  u32 propertyLen;
  char property[propertyLen];
};

struct StreamChunkIdList {
  u32 ids[8];
};

struct ChunkMesh<auto Version> {
  if (Version == 0x0802) {
    u32 flags;
    u32 flags2;
    u32 vertexCount;
    u32 indexCount;
    u32 subsetCount;
    u32 subsetChunkId;
    u32 vertAnimId;
    StreamChunkIdList streamChunk[16];
    u32 phsicsDataChunkId[4];
    Vec3 bboxMin;
    Vec3 bboxMax;
    float texMappingDensity;
    float geometricMeanFaceArea;
    u32 reserved[30];
  }
};

enum StreamType : u32 {
  POSITIONS = 0,
	NORMALS,
	TEXCOORDS,
	COLORS,
	COLORS2,
	INDICES,
	TANGENTS,
	SHCOEFFS,
	SHAPEDEFORMATION,
	BONEMAPPING,
	FACEMAP,
	VERT_MATS,
	QTANGENTS,
	SKINDATA,
	DUMMY2_,
	P3S_C4B_T2S,
	NUM_TYPES,
};

struct ChunkDataStream<auto Version> {
  if (Version == 0x0801) {
    u32 flags;
    StreamType type;
    u32 index;
    u32 elementCount;
    u32 elementSize;
    u8 unknown[8];
    u8 data[elementCount * elementSize];
  }
};

struct NewChunk {
  u32 flags;
  u32 index;
  u32 offset;
  u32 size;
  u32 unknown1;
  u32 unknown2;
  u32 unknown3;
  u32 unknown4;
};


struct ChunkHeader {
  ChunkType chunkType;
  u16 version;
  u32 id;
  u32 size;
  u32 offset;
  if (chunkType == ChunkType::Mesh) {
    ChunkMesh<version> data @offset;
  }
  else if (chunkType == ChunkType::MtlName) {
    ChunkMtlName<version> data @offset;
  }
  else if (chunkType == ChunkType::MeshSubsets) {
    ChunkMeshSubsets<version> data @offset;
  }
  else if (chunkType == ChunkType::MeshPhysicsData) {
    ChunkMeshPhysicsData<version> data @offset;
  }
  else if (chunkType == ChunkType::Node) {
    ChunkNode<version> data @offset;
  }
  else if (chunkType == ChunkType::Helper) {
    ChunkHelper<version> data @offset;
  }
  else if (chunkType == ChunkType::DataStream) {
    ChunkDataStream<version> data @offset;
  }
  else if (chunkType == 12299) {
    NewChunk data @offset;
  }
  else {
    u8 data[size] @offset;
  }

} [[format("format_chunk_header")]];


fn format_chunk_header(ref ChunkHeader it) {
  return std::format("id:{:02d} ver:{:04d} {}", it.id, it.version, it.chunkType);
};

struct File {
  char magic[4];
  Header header;
  ChunkHeader chunks[header.chunkCount];
};

File file @0;
