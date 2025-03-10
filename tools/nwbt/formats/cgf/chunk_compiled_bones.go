package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_CompiledBones, 0x0800, ReadChunkCompiledBones)
}

type ChunkCompiledBones struct {
	ChunkHeader
	Bones []BoneData
}

func ReadChunkCompiledBones(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkCompiledBones")
	r.SeekAbsolute(int(header.Offset))
	r.SeekRelative(32)

	out := ChunkCompiledBones{}
	out.ChunkHeader = header
	boneCount := (header.Size - 32) / 584
	out.Bones = make([]BoneData, boneCount)
	for i := range out.Bones {
		out.Bones[i], err = ReadBoneData(r)
		if err != nil {
			return nil, err
		}
	}

	return out, nil
}
