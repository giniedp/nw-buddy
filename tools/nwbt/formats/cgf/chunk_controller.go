package cgf

import (
	"fmt"
	"math"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_Controller, 0x0831, ReadChunkController)
}

type ChunkController struct {
	ChunkHeader
	ControllerId     uint32
	Flags            uint32
	RotationKeys     [][4]float32
	RotationTimeKeys []float32
	PositionKeys     [][3]float32
	PositionTimeKeys []float32
}

func ReadChunkController(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkController")

	r.SeekAbsolute(int(header.Offset))
	out := ChunkController{}
	out.ChunkHeader = header
	out.ControllerId = r.MustReadUint32()
	out.Flags = r.MustReadUint32()
	numRotationKeys := r.MustReadUint16()
	numPositionKeys := r.MustReadUint16()
	rotationFormat := ECompressionFormat(r.MustReadUint8())
	rotationTimeFormat := EKeyTimesFormat(r.MustReadUint8())
	positionFormat := ECompressionFormat(r.MustReadUint8())
	positionKeysInfo := r.MustReadUint8()
	positionTimeFormat := EKeyTimesFormat(r.MustReadUint8())
	tracksAligned := r.MustReadUint8()
	r.SeekAbsolute(align(r.Pos(), 4))

	alignment := 1
	if tracksAligned != 0 {
		alignment = 4
	}

	out.RotationKeys = make([][4]float32, numRotationKeys)
	out.RotationTimeKeys = make([]float32, numRotationKeys)
	out.PositionKeys = make([][3]float32, numPositionKeys)
	out.PositionTimeKeys = make([]float32, numPositionKeys)

	if numRotationKeys != 0 {
		start := r.Pos()
		for i := range numRotationKeys {
			if out.RotationKeys[i], err = readRotation(r, rotationFormat); err != nil {
				return nil, err
			}
		}
		r.SeekAbsolute(start + align(r.Pos()-start, alignment))

		start = r.Pos()
		for i := range numRotationKeys {
			if out.RotationTimeKeys[i], err = readTime(r, rotationTimeFormat); err != nil {
				return nil, err
			}
		}
		if numPositionKeys != 0 {
			r.SeekAbsolute(start + align(r.Pos()-start, alignment))
		}
	}

	if numPositionKeys != 0 {
		start := r.Pos()
		for i := range numPositionKeys {
			if out.PositionKeys[i], err = readPosition(r, positionFormat); err != nil {
				return nil, err
			}
		}
		r.SeekAbsolute(start + align(r.Pos()-start, alignment))
		if positionKeysInfo != 0 {
			for i := range numPositionKeys {
				if out.PositionTimeKeys[i], err = readTime(r, positionTimeFormat); err != nil {
					return nil, err
				}
			}
		} else {
			out.PositionTimeKeys = out.RotationTimeKeys
		}
	}

	end := header.Offset + header.Size
	remaining := end - uint32(r.Pos())
	if remaining != 0 {
		println("Warning: ", remaining, " bytes remaining in controller chunk")
	}

	return out, nil
}

func align(value int, alignment int) int {
	return int(math.Ceil(float64(value)/float64(alignment)) * float64(alignment))
}

func readPosition(r *buf.Reader, format ECompressionFormat) (res [3]float32, err error) {
	defer utils.HandleRecover(&err, "Read Position")
	switch format {
	case ENoCompress, ENoCompressVec3:
		for i := range res {
			res[i] = r.MustReadFloat32()
		}
	default:
		err = fmt.Errorf("position format not supported %v", format)
	}
	return
}

func readTime(r *buf.Reader, format EKeyTimesFormat) (float32, error) {
	switch format {
	case TimeFormat_F32:
		return r.ReadFloat32()
	case TimeFormat_UINT16:
		v, err := r.ReadUint16()
		return float32(v), err
	case TimeFormat_Byte:
		v, err := r.ReadUint8()
		return float32(v), err
	default:
		return 0, fmt.Errorf("time format not supported %v", format)
	}
}

func readRotation(r *buf.Reader, format ECompressionFormat) (res [4]float32, err error) {
	switch format {
	case ENoCompressQuat:
		for i := range res {
			if res[i], err = r.ReadFloat32(); err != nil {
				return
			}
		}
	case ESmallTree48BitQuat:
		var data [3]uint16
		for i := range data {
			if data[i], err = r.ReadUint16(); err != nil {
				return
			}
		}
		return smallTree48BitQuat(data)
	case ESmallTree64BitExtQuat:
		var data [2]uint32
		for i := range data {
			if data[i], err = r.ReadUint32(); err != nil {
				return
			}
		}
		return smallTree64BitQuat(data)
	default:
		err = fmt.Errorf("rotation format not supported %v", format)
	}
	return
}

func smallTree48BitQuat(data [3]uint16) (comp [4]float32, err error) {
	defer utils.HandleRecover(&err, "smallTree48BitQuat")

	const MAX_15BITf = 23170.0
	const RANGE_15BIT = 0.707106781186

	value := uint64(data[0]) | (uint64(data[1]) << 16) | (uint64(data[2]) << 32)
	index := uint32(value >> 46)

	var shift uint
	var sqrsumm float32

	for i := range comp {
		if uint32(i) == index {
			continue
		}

		packed := uint32(value>>shift) & 0x7fff
		comp[i] = float32(packed)/MAX_15BITf - RANGE_15BIT
		sqrsumm += comp[i] * comp[i]
		shift += 15
	}

	comp[index] = float32(math.Sqrt(1.0 - float64(sqrsumm)))

	return comp, nil
}

func smallTree64BitQuat(data [2]uint32) (comp [4]float32, err error) {
	defer utils.HandleRecover(&err, "smallTree64BitQuat")

	const MAX_20BITf = 741454
	const RANGE_20BIT = 0.707106781186
	const MAX_21BITf = 1482909.0
	const RANGE_21BIT = 0.707106781186

	value := uint64(data[0]) | (uint64(data[1]) << 32)
	index := uint32(value>>62) & 3

	var shift uint
	var sqrsumm float32

	for i, targetComponentIndex := 0, 0; i < 4; i++ {
		if uint32(i) == index {
			continue
		}
		if targetComponentIndex < 2 {
			packed := uint32(value>>shift) & 0xfffff
			comp[i] = float32(packed)/MAX_21BITf - RANGE_21BIT
			sqrsumm += comp[i] * comp[i]
			shift += 21
		} else {
			packed := uint32(value>>shift) & 0xfffff
			comp[i] = float32(packed)/MAX_20BITf - RANGE_20BIT
			sqrsumm += comp[i] * comp[i]
			shift += 20
		}
	}

	comp[index] = float32(math.Sqrt(1.0 - float64(sqrsumm)))

	return comp, nil
}
