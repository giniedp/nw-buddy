package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_MeshSubsets, 0x0800, ReadChunkChunkMeshSubsets)
}

type ChunkMeshSubsets struct {
	ChunkHeader
	Flags   uint32
	Subsets []MeshSubset
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

func ReadChunkChunkMeshSubsets(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err)
	r.SeekAbsolute(int(header.Offset))

	out := ChunkMeshSubsets{}
	out.ChunkHeader = header
	out.Flags = r.MustReadUint32()
	out.Subsets = make([]MeshSubset, r.MustReadInt32())
	r.SeekRelative(8)
	for i := range out.Subsets {
		if out.Subsets[i], err = readMeshSubset(r); err != nil {
			return
		}
	}
	return out, nil
}

func readMeshSubset(r *buf.Reader) (out MeshSubset, err error) {
	defer utils.HandleRecover(&err)
	out.FirstIndex = r.MustReadInt32()
	out.NumIndices = r.MustReadInt32()
	out.FirstVertex = r.MustReadInt32()
	out.NumVertices = r.MustReadInt32()
	out.MaterialId = r.MustReadInt32()
	out.Radius = r.MustReadFloat32()
	for i := range out.Center {
		out.Center[i] = r.MustReadFloat32()
	}
	return
}
