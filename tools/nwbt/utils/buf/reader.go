package buf

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math"
)

type Reader struct {
	data  []byte
	order binary.ByteOrder
	pos   int
}

// NewReaderLE creates a new ByteReader with LittleEndian byte order
func NewReaderLE(data []byte) *Reader {
	return NewReader(data, binary.LittleEndian)
}

// NewReaderBE creates a new ByteReader with BigEndian byte order
func NewReaderBE(data []byte) *Reader {
	return NewReader(data, binary.BigEndian)
}

// NewReader creates a new ByteReader with the specified byte order
func NewReader(data []byte, order binary.ByteOrder) *Reader {
	return &Reader{
		data:  data,
		order: order,
		pos:   0,
	}
}

// Pos returns the current position of the reader
func (r *Reader) Pos() int {
	return r.pos
}

// Len returns the total length of the data
func (r *Reader) Len() int {
	return len(r.data)
}

// SeekRelative skips the reader position by the specified byte offset
func (r *Reader) SeekRelative(offset int) error {
	r.pos += offset
	if r.pos < 0 || r.pos > len(r.data) {
		err := errors.New("seek out of bounds")
		if r.pos < 0 {
			r.pos = 0
		}
		if r.pos > len(r.data) {
			r.pos = len(r.data)
		}
		return err
	}
	return nil
}

// SeekAbsolute jumps to the specified absolute position
func (r *Reader) SeekAbsolute(pos int) error {
	r.pos = pos
	if r.pos < 0 || r.pos > len(r.data) {
		err := errors.New("seek out of bounds")
		if r.pos < 0 {
			r.pos = 0
		}
		if r.pos > len(r.data) {
			r.pos = len(r.data)
		}
		return err
	}
	return nil
}

func (r *Reader) Peek(count int) []byte {
	if r.pos+count > len(r.data) {
		return nil
	}
	return r.data[r.pos : r.pos+count]
}

func (r *Reader) IsEOF() bool {
	return r.pos >= len(r.data)
}

func (r *Reader) canRead(n int) bool {
	return r.pos+n <= len(r.data)
}

func (r *Reader) ReadBytes(n int) ([]byte, error) {
	if r.IsEOF() {
		return nil, io.EOF
	}
	if !r.canRead(n) {
		return nil, fmt.Errorf("read out of bounds at 0x%#v with %d > %d", r.pos, n, len(r.data)-r.pos)
	}
	b := r.data[r.pos : r.pos+n]
	r.pos += n
	return b, nil
}

func (r *Reader) ReadCString() (string, error) {
	s, err := r.ReadUntilByte(0)
	if err != nil {
		return "", err
	}
	return string(s), nil
}

func (r *Reader) ReadCStringFixedBlock(n int) (string, error) {
	s, err := r.ReadUntilByteWithJump(0, n)
	if err != nil {
		return "", err
	}
	return string(s), nil
}

// ReadUntilByte reads until the specified byte is found
func (r *Reader) ReadUntilByte(b byte) ([]byte, error) {
	i := r.pos
	for i < len(r.data) && r.data[i] != b {
		i++
	}
	s, err := r.ReadBytes(i - r.pos)
	if i < len(r.data) && r.data[i] == b {
		r.pos++
	}
	return s, err
}

// ReadUntilByteWithLimit reads until the specified byte is found or the limit is reached
// It stops where the string ends or the limit is reached
func (r *Reader) ReadUntilByteWithLimit(b byte, end int) ([]byte, error) {
	i := r.pos
	for i < len(r.data) && r.data[i] != b {
		i++
		if i-r.pos >= end {
			return r.ReadBytes(i - r.pos)
		}
	}
	s, err := r.ReadBytes(i - r.pos)
	if i < len(r.data) && r.data[i] == b {
		r.pos++
	}
	return s, err
}

// ReadUntilByteWithJump reads until the specified byte is found or the limit is reached.
// Ensures that the reader position is moved by the specified jump value
func (r *Reader) ReadUntilByteWithJump(b byte, end int) ([]byte, error) {
	p := r.Pos()
	s, err := r.ReadUntilByteWithLimit(b, end)
	if err != nil {
		return nil, err
	}
	r.SeekAbsolute(p + end)
	return s, nil
}

func (r *Reader) ReadByte() (byte, error) {
	if b, err := r.ReadBytes(1); err == nil {
		return b[0], nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadInt8() (int8, error) {
	if b, err := r.ReadBytes(1); err == nil {
		return int8(b[0]), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadInt8Vec4() (out [4]int8, err error) {
	for i := range len(out) {
		if out[i], err = r.ReadInt8(); err != nil {
			return
		}
	}
	return
}

func (r *Reader) ReadUint8() (uint8, error) {
	if b, err := r.ReadBytes(1); err == nil {
		return uint8(b[0]), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadInt16() (int16, error) {
	if b, err := r.ReadBytes(2); err == nil {
		return int16(r.order.Uint16(b)), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadUint16() (uint16, error) {
	if b, err := r.ReadBytes(2); err == nil {
		return r.order.Uint16(b), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadUint16Vec3() (out [3]uint16, err error) {
	for i := range len(out) {
		if out[i], err = r.ReadUint16(); err != nil {
			return
		}
	}
	return
}

func (r *Reader) ReadUint16Vec4() (out [4]uint16, err error) {
	for i := range len(out) {
		if out[i], err = r.ReadUint16(); err != nil {
			return
		}
	}
	return
}
func (r *Reader) ReadInt32() (int32, error) {
	if b, err := r.ReadBytes(4); err == nil {
		return int32(r.order.Uint32(b)), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadUint32() (uint32, error) {
	if b, err := r.ReadBytes(4); err == nil {
		return r.order.Uint32(b), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadInt64() (int64, error) {
	if b, err := r.ReadBytes(8); err == nil {
		return int64(r.order.Uint64(b)), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadUint64() (uint64, error) {
	if b, err := r.ReadBytes(8); err == nil {
		return r.order.Uint64(b), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadFloat32() (float32, error) {
	if b, err := r.ReadBytes(4); err == nil {
		bits := r.order.Uint32(b)
		return math.Float32frombits(bits), nil
	} else {
		return 0, err
	}
}

func (r *Reader) ReadFloat32Array(count uint32) (out []float32, err error) {
	out = make([]float32, count)
	for i := range count {
		if out[i], err = r.ReadFloat32(); err != nil {
			return
		}
	}
	return
}

func (r *Reader) ReadFloat32Vec2() (out [2]float32, err error) {
	for i := range len(out) {
		if out[i], err = r.ReadFloat32(); err != nil {
			return
		}
	}
	return
}

func (r *Reader) ReadFloat32Vec3() (out [3]float32, err error) {
	for i := range len(out) {
		if out[i], err = r.ReadFloat32(); err != nil {
			return
		}
	}
	return
}

func (r *Reader) ReadFloat32Vec4() (out [4]float32, err error) {
	for i := range len(out) {
		if out[i], err = r.ReadFloat32(); err != nil {
			return
		}
	}
	return
}

func (r *Reader) ReadFloat64() (float64, error) {
	if b, err := r.ReadBytes(8); err == nil {
		bits := r.order.Uint64(b)
		return math.Float64frombits(bits), nil
	} else {
		return 0, err
	}
}

func (r *Reader) MustReadBytes(n int) []byte {
	b, err := r.ReadBytes(n)
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadByte() byte {
	b, err := r.ReadByte()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadInt8() int8 {
	b, err := r.ReadInt8()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadUint8() uint8 {
	b, err := r.ReadUint8()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadInt16() int16 {
	b, err := r.ReadInt16()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadUint16() uint16 {
	b, err := r.ReadUint16()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadInt32() int32 {
	b, err := r.ReadInt32()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadUint32() uint32 {
	b, err := r.ReadUint32()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadInt64() int64 {
	b, err := r.ReadInt64()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadUint64() uint64 {
	b, err := r.ReadUint64()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadFloat32() float32 {
	b, err := r.ReadFloat32()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *Reader) MustReadFloat64() float64 {
	b, err := r.ReadFloat64()
	if err != nil {
		panic(err)
	}
	return b
}
