package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_MeshPhysicsData, 0x0800, ReadChunkMeshPhysicsData)
}

type ChunkMeshPhysicsData struct {
	ChunkHeader
	DataSize           int32
	Flags              int32
	TetrahedraDataSize int32
	TetrahedraChunkId  int32
}

func ReadChunkMeshPhysicsData(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkMeshPhysicsData")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(MESH_PHYSICS_DATA_CHUNK_DESC_0800)
	// STRUCT_VAR_INFO(nDataSize, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nFlags, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nTetrahedraDataSize, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nTetrahedraChunkId, TYPE_INFO(int))
	// STRUCT_VAR_INFO(reserved, TYPE_ARRAY(2, TYPE_INFO(int)))
	// STRUCT_INFO_END(MESH_PHYSICS_DATA_CHUNK_DESC_0800)

	out := ChunkMeshPhysicsData{}
	out.ChunkHeader = header
	out.DataSize = r.MustReadInt32()
	out.Flags = r.MustReadInt32()
	out.TetrahedraDataSize = r.MustReadInt32()
	out.TetrahedraChunkId = r.MustReadInt32()

	return out, nil
}
