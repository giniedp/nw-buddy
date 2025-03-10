package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_FoliageInfo, 0x1, ReadChunkFoliageInfo)
}

type ChunkFoliageInfo struct {
	ChunkHeader
	Spines     int32
	SpinesVtx  int32
	SkinnedVtx int32
	BoneIds    int32
}

func ReadChunkFoliageInfo(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkFoliageInfo")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(FOLIAGE_INFO_CHUNK_DESC)
	// STRUCT_VAR_INFO(nSpines, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nSpineVtx, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nSkinnedVtx, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nBoneIds, TYPE_INFO(int))
	// STRUCT_INFO_END(FOLIAGE_INFO_CHUNK_DESC)

	out := ChunkFoliageInfo{}
	out.ChunkHeader = header
	out.Spines = r.MustReadInt32()
	out.SpinesVtx = r.MustReadInt32()
	out.SkinnedVtx = r.MustReadInt32()
	out.BoneIds = r.MustReadInt32()

	return out, nil
}
