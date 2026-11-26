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
	StartLocation []float32 // QuatT vx,vy,vz,w,tx,ty,tz (Cry Quat stores v before w)
	EndLocation   []float32 // QuatT vx,vy,vz,w,tx,ty,tz

	LHeelStart float32
	LHeelEnd   float32

	LToe0Start float32
	LToe0End   float32

	RHeelStart float32
	RHeelEnd   float32

	RToe0Start float32
	RToe0End   float32
}

// Asset flags of the motion parameters (CryCharAnimationParams.h CA_ASSET_*)
const (
	AssetFlagAdditive uint32 = 0x001
	AssetFlagCycle    uint32 = 0x002
)

// DefaultSampleRate is used when a file has no timing (Lumberyard ANIMATION_30Hz)
const DefaultSampleRate = 30.0

// IsAdditive tells whether the clip is additive: its first frame is the reference pose and is not played
func (it ChunkMotionParams) IsAdditive() bool {
	return it.AssetFlags&AssetFlagAdditive != 0
}

// IsCycle tells whether the clip was authored as a cycle (loop)
func (it ChunkMotionParams) IsCycle() bool {
	return it.AssetFlags&AssetFlagCycle != 0
}

// SampleRate is the number of key frames per second, 1 / (SecsPerTick * TicksPerFrame) as in
// Lumberyard GlobalAnimationHeaderCAF::ReadMotionParameters
func (it ChunkMotionParams) SampleRate() float32 {
	if it.SecsPerTick <= 0 || it.TicksPerFrame <= 0 {
		return DefaultSampleRate
	}
	return 1 / (it.SecsPerTick * float32(it.TicksPerFrame))
}

// StartFrame is the first played frame, additive clips skip their reference frame
func (it ChunkMotionParams) StartFrame() int32 {
	if it.IsAdditive() {
		return it.Start + 1
	}
	return it.Start
}

// EndFrame is the last played frame, never before StartFrame
func (it ChunkMotionParams) EndFrame() int32 {
	return max(it.End, it.StartFrame())
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
