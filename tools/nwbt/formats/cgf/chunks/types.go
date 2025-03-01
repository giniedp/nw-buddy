package chunks

import (
	"fmt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type ECompressionFormat uint32

const (
	CMP_NoCompress ECompressionFormat = iota
	CMP_NoCompressQuat
	CMP_NoCompressVec3
	CMP_ShotInt3Quat
	CMP_SmallTreeDWORDQuat
	CMP_SmallTree48BitQuat
	CMP_SmallTree64BitQuat
	CMP_PolarQuat
	CMP_SmallTree64BitExtQuat
	CMP_AutomaticQuat
)

type EKeyTimesFormat uint32

const (
	TF_F32 EKeyTimesFormat = iota
	TF_UINT16
	TF_Byte
	TF_F32StartStop
	TF_UINT16StartStop
	TF_ByteStartStop
	TF_Bitset
)

type ChunkType uint32

const (
	CT_ANY ChunkType = 0

	CT_Mesh ChunkType = iota + 0x1000 // was 0xCCCC0000 in chunk files with versions <= 0x745
	CT_Helper
	CT_VertAnim
	CT_BoneAnim
	CT_GeomNameList // obsolete
	CT_BoneNameList
	CT_MtlList    // obsolete
	CT_MRM        // obsolete
	CT_SceneProps // obsolete
	CT_Light      // obsolete
	CT_PatchMesh  // not implemented
	CT_Node
	CT_Mtl // obsolete
	CT_Controller
	CT_Timing
	CT_BoneMesh
	CT_BoneLightBinding // obsolete. describes the lights binded to bones
	CT_MeshMorphTarget  // describes a morph target of a mesh chunk
	CT_BoneInitialPos   // describes the initial position (4x3 matrix) of each bone; just an array of 4x3 matrices
	CT_SourceInfo       // describes the source from which the cgf was exported: source max file, machine and user
	CT_MtlName          // material name
	CT_ExportFlags      // Special export flags.
	CT_DataStream       // Stream data.
	CT_MeshSubsets      // Array of mesh subsets.
	CT_MeshPhysicsData  // Physicalized mesh data.

	// these are the new compiled chunks for characters
	CT_CompiledBones ChunkType = iota + 0x2000 // was 0xACDC0000 in chunk files with versions <= 0x745
	CT_CompiledPhysicalBones
	CT_CompiledMorphTargets
	CT_CompiledPhysicalProxies
	CT_CompiledIntFaces
	CT_CompiledIntSkinVertices
	CT_CompiledExt2IntMap

	CT_BreakablePhysics ChunkType = iota + 0x3000 // was 0xAAFC0000 in chunk files with versions <= 0x745
	CT_FaceMap                                    // obsolete
	CT_MotionParameters
	CT_FootPlantInfo // obsolete
	CT_BonesBoxes
	CT_FoliageInfo
	CT_Timestamp
	CT_GlobalAnimationHeaderCAF
	CT_GlobalAnimationHeaderAIM
	CT_BspTreeData
)

type Header struct {
	Type ChunkType
	// TypeName: string
	Version uint32
	Id      int32
	Size    uint32
	Offset  uint32
}

func ReadHeader(r buf.Reader, version int) (out Header, err error) {
	defer utils.HandleRecover(&err)

	if version >= 0x746 {
		out.Type = ChunkType(utils.Must(r.ReadUint32()))
		out.Version = utils.Must(r.ReadUint32())
		out.Id = utils.Must(r.ReadInt32())
		out.Size = utils.Must(r.ReadUint32())
		out.Offset = utils.Must(r.ReadUint32())
	} else {
		err = fmt.Errorf("unsupported version %d", version)
	}

	return
}

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

func ReadBonePysics(r buf.Reader) (out BonePhysics, err error) {
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
	Mass            float32   // mass of bone
	WorldToBone     []float32 // Matrix34 intitalpose matrix World2Bone
	BoneToWorld     []float32 // Matrix34 intitalpose matrix Bone2World
	BoneName        string    // char[256];
	LimbId          uint32    // set by model state class
	M_nOffsetParent uint32    // this bone parent is this[m_nOffsetParent], 0 if the bone is root. Normally this is <= 0
	// The whole hierarchy of bones is kept in one big array that belongs to the ModelState
	// Each bone that has children has its own range of bone objects in that array,
	// and this points to the beginning of that range and defines the number of bones.
	M_numChildren uint32
	// the beginning of the subarray of children is at this[m_nOffsetChildren]
	// this is 0 if there are no children
	M_nOffsetChildren int32
}

func ReadBoneData(r buf.Reader) (out BoneData, err error) {
	defer utils.HandleRecover(&err)

	out.ControllerId = utils.Must(r.ReadUint32())
	out.Info = [2]BonePhysics{
		utils.Must(ReadBonePysics(r)),
		utils.Must(ReadBonePysics(r)),
	}
	out.Mass = utils.Must(r.ReadFloat32())
	out.WorldToBone = utils.Must(r.ReadFloat32Array(12))
	out.BoneToWorld = utils.Must(r.ReadFloat32Array(12))
	out.BoneName = string(utils.Must(r.ReadUntilByteCapped(0, 256)))
	out.LimbId = utils.Must(r.ReadUint32())
	out.M_nOffsetParent = utils.Must(r.ReadUint32())
	out.M_numChildren = utils.Must(r.ReadUint32())
	out.M_nOffsetChildren = utils.Must(r.ReadInt32())
	return
}

type BoneEntity struct {
	BoneId       int32
	ParentId     int32
	NumChildren  int32
	ControllerId int32  // Id of controller (CRC32 From name of bone).
	Prop         string // char[32];
	Phys         BonePhysics
}

func ReadBoneEntity(r buf.Reader) (out BoneEntity, err error) {
	defer utils.HandleRecover(&err)

	out.BoneId = utils.Must(r.ReadInt32())
	out.ParentId = utils.Must(r.ReadInt32())
	out.NumChildren = utils.Must(r.ReadInt32())
	out.ControllerId = utils.Must(r.ReadInt32())
	out.Prop = string(utils.Must(r.ReadUntilByteCapped(0, 32)))
	out.Phys = utils.Must(ReadBonePysics(r))
	return
}

type MeshSubset struct {
	FirstIndex  int32
	NumIndices  int32
	FirstVertex int32
	NumVertices int32
	MaterialId  int32
	Radius      float32
	Center      [3]float32
}

func ReadMeshSubset(r buf.Reader) (out MeshSubset, err error) {
	defer utils.HandleRecover(&err)

	out.FirstIndex = utils.Must(r.ReadInt32())
	out.NumIndices = utils.Must(r.ReadInt32())
	out.FirstVertex = utils.Must(r.ReadInt32())
	out.NumVertices = utils.Must(r.ReadInt32())
	out.MaterialId = utils.Must(r.ReadInt32())
	out.Radius = utils.Must(r.ReadFloat32())
	out.Center = utils.Must(r.ReadFloat32Vec3())
	return
}

type IntSkinVertex struct {
	Obsolete0 [3]float32
	Position  [3]float32
	Obsolete2 [3]float32
	BoneIds   [4]uint16  // 4 bone IDs
	Weights   [4]float32 // Should be 4 of these
	Color     [4]int8    // IRGBA
}

func ReadIntSkinVertex(r buf.Reader) (out IntSkinVertex, err error) {
	defer utils.HandleRecover(&err)

	out.Obsolete0 = utils.Must(r.ReadFloat32Vec3())
	out.Position = utils.Must(r.ReadFloat32Vec3())
	out.Obsolete2 = utils.Must(r.ReadFloat32Vec3())
	out.BoneIds = utils.Must(r.ReadUint16Vec4())
	out.Weights = utils.Must(r.ReadFloat32Vec4())
	out.Color = utils.Must(r.ReadInt8Vec4())
	return
}

type IntSkinFace [3]uint16

func ReadIntSkinFace(r buf.Reader) (out IntSkinFace, err error) {
	defer utils.HandleRecover(&err)
	out = utils.Must(r.ReadUint16Vec3())
	return
}
