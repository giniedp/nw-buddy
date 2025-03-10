package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_DataStream, 0x0801, ReadChunkDataStream)
}

type DataStreamType uint32

const (
	STREAM_TYPE_POSITIONS DataStreamType = iota
	STREAM_TYPE_NORMALS
	STREAM_TYPE_TEXCOORDS
	STREAM_TYPE_COLORS
	STREAM_TYPE_COLORS2
	STREAM_TYPE_INDICES
	STREAM_TYPE_TANGENTS
	STREAM_TYPE_SHCOEFFS
	STREAM_TYPE_SHAPEDEFORMATION
	STREAM_TYPE_BONEMAPPING
	STREAM_TYPE_FACEMAP
	STREAM_TYPE_VERT_MATS
	STREAM_TYPE_QTANGENTS
	STREAM_TYPE_SKINDATA
	STREAM_TYPE_DUMMY2_ // used to be old console specific, dummy is needed to keep existing assets loadable
	STREAM_TYPE_P3S_C4B_T2S
	STREAM_TYPE_NUM_TYPES
)

type ChunkDataStream struct {
	ChunkHeader
	Flags        uint32
	StreamType   DataStreamType
	StreamIndex  uint32
	ElementCount uint32
	ElementSize  uint32
	Data         []byte
}

func ReadChunkDataStream(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkDataStream")
	r.SeekAbsolute(int(header.Offset))

	out := ChunkDataStream{}
	out.ChunkHeader = header
	out.Flags = r.MustReadUint32()
	out.StreamType = DataStreamType(r.MustReadUint32())
	out.StreamIndex = r.MustReadUint32()
	out.ElementCount = r.MustReadUint32()
	out.ElementSize = r.MustReadUint32()
	r.SeekRelative(8)
	out.Data = r.MustReadBytes(int(out.ElementCount * out.ElementSize))
	return out, nil
}
