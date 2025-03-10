package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_CompiledIntSkinVertices, 0x0800, ReadChunkCompiledIntSkinVertices)
}

type ChunkCompiledIntSkinVertices struct {
	ChunkHeader
	Vertices []IntSkinVertex
}

func ReadChunkCompiledIntSkinVertices(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkCompiledIntSkinVertices")
	r.SeekAbsolute(int(header.Offset))
	r.SeekRelative(32)

	out := ChunkCompiledIntSkinVertices{}
	out.ChunkHeader = header
	vertexCount := (header.Size - 32) / 64
	out.Vertices = make([]IntSkinVertex, vertexCount)
	for i := range out.Vertices {
		out.Vertices[i], err = ReadIntSkinVertex(r)
		if err != nil {
			return nil, err
		}
	}

	return out, nil
}

type IntSkinVertex struct {
	Obsolete0 [3]float32
	Position  [3]float32
	Obsolete2 [3]float32
	BoneIds   [4]uint16  // 4 bone IDs
	Weights   [4]float32 // Should be 4 of these
	Color     [4]int8    // IRGBA
}

func ReadIntSkinVertex(r *buf.Reader) (out IntSkinVertex, err error) {
	defer utils.HandleRecover(&err)

	out.Obsolete0 = utils.Must(r.ReadFloat32Vec3())
	out.Position = utils.Must(r.ReadFloat32Vec3())
	out.Obsolete2 = utils.Must(r.ReadFloat32Vec3())
	out.BoneIds = utils.Must(r.ReadUint16Vec4())
	out.Weights = utils.Must(r.ReadFloat32Vec4())
	out.Color = utils.Must(r.ReadInt8Vec4())
	return
}
