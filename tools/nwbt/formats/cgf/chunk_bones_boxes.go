package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_BonesBoxes, 0x0800, ReadChunkBonesBoxes)
	RegisterChunkReader(ChunkType_BonesBoxes, 0x0801, ReadChunkBonesBoxes)
}

type ChunkBonesBoxes struct {
	ChunkHeader
	BoneId  int32
	Min     [3]float32
	Max     [3]float32
	Indexes []int32
}

func ReadChunkBonesBoxes(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkBonesBoxes")
	r.SeekAbsolute(int(header.Offset))

	out := ChunkBonesBoxes{}
	out.ChunkHeader = header
	out.BoneId = r.MustReadInt32()
	for i := range out.Min {
		out.Min[i] = r.MustReadFloat32()
	}
	for i := range out.Max {
		out.Max[i] = r.MustReadFloat32()
	}
	indexCount := r.MustReadInt32()
	out.Indexes = make([]int32, indexCount)
	for i := range out.Indexes {
		out.Indexes[i] = r.MustReadInt32()
	}

	return out, nil
}
