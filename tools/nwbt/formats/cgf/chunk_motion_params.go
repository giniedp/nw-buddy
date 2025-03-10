package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_MotionParameters, 0x0925, ReadChunkChunkMotionParams_0x0925)
}

type ChunkMotionParams struct {
	ChunkHeader
	AssetFlags    uint32
	Compression   uint32
	TicksPerFrame int32
	SecsPerTick   float32
	Start         int32
	End           int32
	MoveSpeed     float32
	TurnSpeed     float32
	AssetTurn     float32
	Distance      float32
	Slope         float32
	StartLocation []float32 // QuatT w,vx,vy,vz,tx,ty,tz
	EndLocation   []float32 // QuatT w,vx,vy,vz,tx,ty,tz

	LHeelStart float32
	LHeelEnd   float32

	LToe0Start float32
	LToe0End   float32

	RHeelStart float32
	RHeelEnd   float32

	RToe0Start float32
	RToe0End   float32
}

func ReadChunkChunkMotionParams_0x0925(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	r.SeekAbsolute(int(header.Offset))

	out := ChunkMotionParams{}
	out.ChunkHeader = header
	out.AssetFlags = r.MustReadUint32()
	out.Compression = r.MustReadUint32()
	out.TicksPerFrame = r.MustReadInt32()
	out.SecsPerTick = r.MustReadFloat32()
	out.Start = r.MustReadInt32()
	out.End = r.MustReadInt32()
	out.MoveSpeed = r.MustReadFloat32()
	out.TurnSpeed = r.MustReadFloat32()
	out.AssetTurn = r.MustReadFloat32()
	out.Distance = r.MustReadFloat32()
	out.Slope = r.MustReadFloat32()
	out.StartLocation = utils.Must(r.ReadFloat32Array(7))
	out.EndLocation = utils.Must(r.ReadFloat32Array(7))
	out.LHeelStart = r.MustReadFloat32()
	out.LHeelEnd = r.MustReadFloat32()
	out.LToe0Start = r.MustReadFloat32()
	out.LToe0End = r.MustReadFloat32()
	out.RHeelStart = r.MustReadFloat32()
	out.RHeelEnd = r.MustReadFloat32()
	out.RToe0Start = r.MustReadFloat32()
	out.RToe0End = r.MustReadFloat32()

	return out, nil
}
