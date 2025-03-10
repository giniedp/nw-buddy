package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_MtlName, 0x0800, ReadChunkMtlName_0x0800)
	RegisterChunkReader(ChunkType_MtlName, 0x0802, ReadChunkMtlName_0x0802)
	RegisterChunkReader(ChunkType_MtlName, 0x0804, ReadChunkMtlName_0x0804)
}

type ChunkMtlNamer interface {
	GetName() string
}

type ChunkMtlName struct {
	ChunkHeader
	Name       string
	ChildNames []string
}

func (it ChunkMtlName) GetName() string {
	return it.Name
}

type ChunkMtlName_0800 struct {
	ChunkMtlName
	Flags                uint32
	Flags2               uint32
	PhysicalizeType      uint32
	SubMaterialCount     uint32
	SubMaterialsChunkIds []uint32
	AdvancedDataChunkId  uint32
	Opacity              float32
	Reserve              [32]int32
}

// func (it *ChunkMtlName_0800) GetName() string {
// 	return it.Name
// }

func ReadChunkMtlName_0x0800(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read Chunk 0x0800")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(MTL_NAME_CHUNK_DESC_0800)
	// STRUCT_VAR_INFO(nFlags, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nFlags2, TYPE_INFO(int))
	// STRUCT_VAR_INFO(name, TYPE_ARRAY(128, TYPE_INFO(char)))
	// STRUCT_VAR_INFO(nPhysicalizeType, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nSubMaterials, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nSubMatChunkId, TYPE_ARRAY(MTL_NAME_CHUNK_DESC_0800_MAX_SUB_MATERIALS, TYPE_INFO(int)))
	// STRUCT_VAR_INFO(nAdvancedDataChunkId, TYPE_INFO(int))
	// STRUCT_VAR_INFO(sh_opacity, TYPE_INFO(float))
	// STRUCT_VAR_INFO(reserve, TYPE_ARRAY(32, TYPE_INFO(int)))
	// STRUCT_INFO_END(MTL_NAME_CHUNK_DESC_0800)

	out := ChunkMtlName_0800{}
	out.ChunkHeader = header
	out.Flags = r.MustReadUint32()
	out.Flags2 = r.MustReadUint32()
	out.Name = string(utils.Must(r.ReadBytes(128)))
	out.PhysicalizeType = r.MustReadUint32()
	out.SubMaterialCount = r.MustReadUint32()
	out.SubMaterialsChunkIds = make([]uint32, out.SubMaterialCount)
	for i := range out.SubMaterialsChunkIds {
		out.SubMaterialsChunkIds[i] = r.MustReadUint32()
	}
	out.AdvancedDataChunkId = r.MustReadUint32()
	out.Opacity = r.MustReadFloat32()
	// not read further
	return out, nil
}

type ChunkMtlName_0802 struct {
	ChunkMtlName
	Submaterials int32
}

//	func (it *ChunkMtlName_0802) GetName() string {
//		return it.Name
//	}
func ReadChunkMtlName_0x0802(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkMtlName 0x0802")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(MTL_NAME_CHUNK_DESC_0802)
	// STRUCT_VAR_INFO(name, TYPE_ARRAY(128, TYPE_INFO(char)))
	// STRUCT_VAR_INFO(nSubMaterials, TYPE_INFO(int))
	// STRUCT_INFO_END(MTL_NAME_CHUNK_DESC_0802)
	out := ChunkMtlName_0802{}
	out.ChunkHeader = header
	out.Name = utils.Must(r.ReadCStringFixedBlock(128))
	out.Submaterials = r.MustReadInt32()

	return out, nil
}

type ChunkMtlName_0804 struct {
	ChunkMtlName
}

// func (it *ChunkMtlName_0804) GetName() string {
// 	return it.Name
// }

func ReadChunkMtlName_0x0804(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkMtlName 0x0804")

	out := ChunkMtlName_0804{}
	out.ChunkHeader = header
	r.SeekAbsolute(int(header.Offset))
	out.Name = utils.Must(r.ReadCStringFixedBlock(64))
	count := r.MustReadInt32()
	r.SeekRelative(4 * int(count))
	out.ChildNames = make([]string, count)
	for i := range int(count) {
		out.ChildNames[i] = utils.Must(r.ReadCString())
	}
	return out, nil
}
