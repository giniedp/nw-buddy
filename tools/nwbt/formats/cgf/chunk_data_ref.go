package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_DataRef, 0x0800, ReadChunkDataRef)
}

type ChunkDataRef struct {
	ChunkHeader
	Flags  uint32
	Index  uint32
	Offset uint32
	Size   uint32
	Stride uint32
}

func ReadChunkDataRef(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ReadChunkDataRef")
	r.SeekAbsolute(int(header.Offset))

	out := ChunkDataRef{}
	out.ChunkHeader = header
	out.Flags = r.MustReadUint32()
	out.Index = r.MustReadUint32()
	out.Offset = r.MustReadUint32()
	out.Size = r.MustReadUint32()
	out.Stride = r.MustReadUint32()

	return out, nil
}
