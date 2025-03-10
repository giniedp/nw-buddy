package cgf

import "nw-buddy/tools/utils/buf"

func init() {
	RegisterChunkReader(ChunkType_Mesh, 0x0802, ReadChunkMesh_0x0802)
}

type ChunkMesh struct {
	ChunkHeader
	Flags                 int32
	Flags2                int32
	VertexCount           int32
	IndexCount            int32
	SubsetCount           int32
	SubsetsChunkId        int32
	VertAnimID            int32
	StreamChunkID         [16][8]int32
	PhysicsDataChunkId    [4]int32
	BboxMin               [3]float32
	BboxMax               [3]float32
	TexMappingDensity     float32
	GeometricMeanFaceArea float32
	Reserved              [30]int32
}

func ReadChunkMesh_0x0802(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(MESH_CHUNK_DESC_0802)
	// STRUCT_VAR_INFO(nFlags, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nFlags2, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nVerts, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nIndices, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nSubsets, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nSubsetsChunkId, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nVertAnimID, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nStreamChunkID, TYPE_ARRAY(16, TYPE_ARRAY(8, TYPE_INFO(int))))
	// STRUCT_VAR_INFO(nPhysicsDataChunkId, TYPE_ARRAY(4, TYPE_INFO(int)))
	// STRUCT_VAR_INFO(bboxMin, TYPE_INFO(Vec3))
	// STRUCT_VAR_INFO(bboxMax, TYPE_INFO(Vec3))
	// STRUCT_VAR_INFO(texMappingDensity, TYPE_INFO(float))
	// STRUCT_VAR_INFO(geometricMeanFaceArea, TYPE_INFO(float))
	// STRUCT_VAR_INFO(reserved, TYPE_ARRAY(30, TYPE_INFO(int)))
	// STRUCT_INFO_END(MESH_CHUNK_DESC_0802)

	out := ChunkMesh{}
	out.ChunkHeader = header
	out.Flags = r.MustReadInt32()
	out.Flags2 = r.MustReadInt32()
	out.VertexCount = r.MustReadInt32()
	out.IndexCount = r.MustReadInt32()
	out.SubsetCount = r.MustReadInt32()
	out.SubsetsChunkId = r.MustReadInt32()
	out.VertAnimID = r.MustReadInt32()
	for i := range out.StreamChunkID {
		for j := range out.StreamChunkID[i] {
			out.StreamChunkID[i][j] = r.MustReadInt32()
		}
	}
	for i := range out.PhysicsDataChunkId {
		out.PhysicsDataChunkId[i] = r.MustReadInt32()
	}
	for i := range out.BboxMin {
		out.BboxMin[i] = r.MustReadFloat32()
	}
	for i := range out.BboxMax {
		out.BboxMax[i] = r.MustReadFloat32()
	}
	out.TexMappingDensity = r.MustReadFloat32()
	out.GeometricMeanFaceArea = r.MustReadFloat32()
	for i := range out.Reserved {
		out.Reserved[i] = r.MustReadInt32()
	}
	return out, nil
}
