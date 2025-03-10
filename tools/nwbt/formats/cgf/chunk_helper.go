package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_Helper, 0x0744, ReadChunkHelper)
}

type ChunkHelper struct {
	ChunkHeader
	Type uint32
	Size [3]float32
}

func ReadChunkHelper(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkHelper")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(HELPER_CHUNK_DESC_0744)
	// STRUCT_VAR_INFO(type, TYPE_INFO(HelperTypes))
	// STRUCT_VAR_INFO(size, TYPE_INFO(Vec3))
	// STRUCT_INFO_END(HELPER_CHUNK_DESC_0744)

	out := ChunkHelper{}
	out.ChunkHeader = header
	out.Type = r.MustReadUint32()
	for i := range out.Size {
		out.Size[i] = r.MustReadFloat32()
	}

	return out, nil
}
