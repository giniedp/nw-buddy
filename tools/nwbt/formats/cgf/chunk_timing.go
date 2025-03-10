package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_Timing, 0x0918, ReadChunkTiming_0x0918)
}

type RangeEntity struct {
	Name  string
	Start int32
	End   int32
}
type ChunkTiming struct {
	ChunkHeader
	SecsPerTick   float32
	TicksPerFrame int32
	GlobalRange   RangeEntity
	SubRanges     int32
}

func ReadChunkTiming_0x0918(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkTiming 0x0918")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(TIMING_CHUNK_DESC_0918)
	// STRUCT_VAR_INFO(m_SecsPerTick, TYPE_INFO(float))
	// STRUCT_VAR_INFO(m_TicksPerFrame, TYPE_INFO(int))
	// STRUCT_VAR_INFO(global_range, TYPE_INFO(RANGE_ENTITY))
	// STRUCT_VAR_INFO(qqqqnSubRanges, TYPE_INFO(int))
	// STRUCT_INFO_END(TIMING_CHUNK_DESC_0918)

	out := ChunkTiming{}
	out.ChunkHeader = header
	out.SecsPerTick = r.MustReadFloat32()
	out.TicksPerFrame = r.MustReadInt32()
	out.GlobalRange.Name = utils.Must(r.ReadCStringFixedBlock(32))
	out.GlobalRange.Start = r.MustReadInt32()
	out.GlobalRange.End = r.MustReadInt32()
	out.SubRanges = r.MustReadInt32()

	return out, nil
}
