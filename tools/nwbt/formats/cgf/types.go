//go:generate stringer -type=ChunkType
//go:generate stringer -type=FileType
package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type FileVersion uint32

const (
	FileVersion_CryTek1And2 FileVersion = 0x744 // CryTek1And2
	FileVersion_CryTek3     FileVersion = 0x745 // CryTek3
	FileVersion_CryTek_3_6  FileVersion = 0x746 // CryTek_3_6
)

type FileType uint32

const (
	FileType_Geometry  FileType = 0xffff0000 // Geometry
	FileType_Animation FileType = 0xffff0001 // Animation
)

type File struct {
	Source string // the file from which this was loaded
	Header FileHeader
	Table  []ChunkHeader
	Chunks []Chunker
}

func (it File) FindChunk(id int32) Chunker {
	for _, c := range it.Chunks {
		if c == nil {
			continue
		}
		if c.GetId() == id {
			return c
		}
	}
	return nil
}

func FindChunk[T Chunker](file *File, id int32) (T, bool) {
	var out T
	for _, c := range file.Chunks {
		if c == nil {
			continue
		}
		if c.GetId() == id {
			out, ok := c.(T)
			return out, ok
		}
	}
	return out, false
}

func SelectChunks[T Chunker](file *File) []T {
	out := make([]T, 0)
	for _, c := range file.Chunks {
		if c == nil {
			continue
		}
		if it, ok := c.(T); ok {
			out = append(out, it)
		}
	}
	return out
}

func SelectChunk[T Chunker](file *File) (out T, ok bool) {
	for _, c := range file.Chunks {
		if c == nil {
			continue
		}
		if it, ok := c.(T); ok {
			return it, true
		}
	}
	return out, false
}

type FileHeader struct {
	FileType    FileType
	FileVersion FileVersion
	ChunkCount  uint32
	ChunkOffset uint32
}

type ChunkHeader struct {
	Type    ChunkType
	Version uint16
	Id      int32
	Size    uint32
	Offset  uint32
}

type Chunker interface {
	GetType() ChunkType
	GetId() int32
}

func (it ChunkHeader) GetType() ChunkType {
	return it.Type
}

func (it ChunkHeader) GetId() int32 {
	return it.Id
}

type ECompressionFormat uint32

const (
	ENoCompress ECompressionFormat = iota
	ENoCompressQuat
	ENoCompressVec3
	EShotInt3Quat
	ESmallTreeDWORDQuat
	ESmallTree48BitQuat
	ESmallTree64BitQuat
	EPolarQuat
	ESmallTree64BitExtQuat
	EAutomaticQuat
)

type EKeyTimesFormat uint32

const (
	TimeFormat_F32 EKeyTimesFormat = iota
	TimeFormat_UINT16
	TimeFormat_Byte
	TimeFormat_F32StartStop
	TimeFormat_UINT16StartStop
	TimeFormat_ByteStartStop
	TimeFormat_Bitset
)

type ChunkType uint16

const (
	ChunkType_ANY ChunkType = iota + 0
)
const (
	ChunkType_Mesh ChunkType = iota + 0x1000 // was 0xCCCC0000 in chunk files with versions <= 0x745
	ChunkType_Helper
	ChunkType_VertAnim
	ChunkType_BoneAnim
	ChunkType_GeomNameList // obsolete
	ChunkType_BoneNameList
	ChunkType_MtlList    // obsolete
	ChunkType_MRM        // obsolete
	ChunkType_SceneProps // obsolete
	ChunkType_Light      // obsolete
	ChunkType_PatchMesh  // not implemented
	ChunkType_Node
	ChunkType_Mtl // obsolete
	ChunkType_Controller
	ChunkType_Timing
	ChunkType_BoneMesh
	ChunkType_BoneLightBinding // obsolete. describes the lights binded to bones
	ChunkType_MeshMorphTarget  // describes a morph target of a mesh chunk
	ChunkType_BoneInitialPos   // describes the initial position (4x3 matrix) of each bone; just an array of 4x3 matrices
	ChunkType_SourceInfo       // describes the source from which the cgf was exported: source max file, machine and user
	ChunkType_MtlName          // material name
	ChunkType_ExportFlags      // Special export flags.
	ChunkType_DataStream       // Stream data.
	ChunkType_MeshSubsets      // Array of mesh subsets.
	ChunkType_MeshPhysicsData  // Physicalized mesh data.
)
const (
	// these are the new compiled chunks for characters
	ChunkType_CompiledBones ChunkType = iota + 0x2000 // was 0xACDC0000 in chunk files with versions <= 0x745
	ChunkType_CompiledPhysicalBones
	ChunkType_CompiledMorphTargets
	ChunkType_CompiledPhysicalProxies
	ChunkType_CompiledIntFaces
	ChunkType_CompiledIntSkinVertices
	ChunkType_CompiledExt2IntMap
)

const (
	ChunkType_BreakablePhysics ChunkType = iota + 0x3000 // was 0xAAFC0000 in chunk files with versions <= 0x745
	ChunkType_FaceMap                                    // obsolete
	ChunkType_MotionParameters
	ChunkType_FootPlantInfo // obsolete
	ChunkType_BonesBoxes
	ChunkType_FoliageInfo
	ChunkType_Timestamp
	ChunkType_GlobalAnimationHeaderCAF
	ChunkType_GlobalAnimationHeaderAIM
	ChunkType_BspTreeData

	ChunkType_UNKNOWN
	ChunkType_DataRef
)

// export interface Chunk {
//   header: ChunkHeader
//   debug?: () => any[]
// }

type BonePhysics struct {
	PhysGeom      int32
	Flags         int32
	Min           [3]float32
	Max           [3]float32
	SpringAngle   [3]float32
	SpringTension [3]float32
	Damping       [3]float32
	FrameMatrix   [3][3]float32
}

func ReadBonePysics(r *buf.Reader) (out BonePhysics, err error) {
	defer utils.HandleRecover(&err)

	out.PhysGeom = utils.Must(r.ReadInt32())
	out.Flags = utils.Must(r.ReadInt32())
	out.Min = utils.Must(r.ReadFloat32Vec3())
	out.Max = utils.Must(r.ReadFloat32Vec3())
	out.SpringAngle = utils.Must(r.ReadFloat32Vec3())
	out.SpringTension = utils.Must(r.ReadFloat32Vec3())
	out.Damping = utils.Must(r.ReadFloat32Vec3())
	out.FrameMatrix = [3][3]float32{
		utils.Must(r.ReadFloat32Vec3()),
		utils.Must(r.ReadFloat32Vec3()),
		utils.Must(r.ReadFloat32Vec3()),
	}
	return
}

type BoneData struct {
	ControllerId uint32 // unique id of bone (generated from bone name)

	// [Sergiy] physics info for different lods
	// lod 0 is the physics of alive body, lod 1 is the physics of a dead body
	Info            [2]BonePhysics
	Mass            float32     // mass of bone
	WorldToBone     [16]float32 // Matrix34 intitalpose matrix World2Bone
	BoneToWorld     [16]float32 // Matrix34 intitalpose matrix Bone2World
	BoneName        string      // char[256];
	LimbId          int32       // set by model state class
	M_nOffsetParent int32       // this bone parent is this[m_nOffsetParent], 0 if the bone is root. Normally this is <= 0
	// The whole hierarchy of bones is kept in one big array that belongs to the ModelState
	// Each bone that has children has its own range of bone objects in that array,
	// and this points to the beginning of that range and defines the number of bones.
	M_numChildren uint32
	// the beginning of the subarray of children is at this[m_nOffsetChildren]
	// this is 0 if there are no children
	M_nOffsetChildren int32
}

func ReadBoneData(r *buf.Reader) (out BoneData, err error) {
	defer utils.HandleRecover(&err)

	out.ControllerId = utils.Must(r.ReadUint32())
	out.Info = [2]BonePhysics{
		utils.Must(ReadBonePysics(r)),
		utils.Must(ReadBonePysics(r)),
	}
	out.Mass = utils.Must(r.ReadFloat32())
	for i := range 12 {
		out.WorldToBone[i] = utils.Must(r.ReadFloat32())
	}
	out.WorldToBone[15] = 1
	for i := range 12 {
		out.BoneToWorld[i] = utils.Must(r.ReadFloat32())
	}
	out.BoneToWorld[15] = 1
	out.BoneName = utils.Must(r.ReadCStringFixedBlock(256))
	out.LimbId = utils.Must(r.ReadInt32())
	out.M_nOffsetParent = utils.Must(r.ReadInt32())
	out.M_numChildren = utils.Must(r.ReadUint32())
	out.M_nOffsetChildren = utils.Must(r.ReadInt32())
	return
}
