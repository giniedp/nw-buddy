package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_CompiledExt2IntMap, 0x0800, ReadChunkCompiledExt2IntMap)
}

type ChunkCompiledExt2IntMap struct {
	ChunkHeader
	Vertices []uint16
}

func ReadChunkCompiledExt2IntMap(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkCompiledExtToIntMap")
	r.SeekAbsolute(int(header.Offset))

	out := ChunkCompiledExt2IntMap{}
	out.ChunkHeader = header
	out.Vertices = make([]uint16, header.Size/2)
	for i := range out.Vertices {
		out.Vertices[i] = r.MustReadUint16()
	}
	return out, nil
}
