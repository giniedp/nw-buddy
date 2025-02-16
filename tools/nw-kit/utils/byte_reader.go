package utils

import (
	"bytes"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math"
)

type ByteReader struct {
	data  []byte
	order binary.ByteOrder
	pos   int
}

func NewByteReaderLE(data []byte) *ByteReader {
	return NewByteReader(data, binary.LittleEndian)
}

func NewByteReaderBE(data []byte) *ByteReader {
	return NewByteReader(data, binary.BigEndian)
}

func NewByteReader(data []byte, order binary.ByteOrder) *ByteReader {
	return &ByteReader{
		data:  data,
		order: order,
		pos:   0,
	}
}

func (r *ByteReader) Pos() int {
	return r.pos
}

func (r *ByteReader) Len() int {
	return len(r.data)
}

func (r *ByteReader) SeekRelative(offset int) error {
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

func (r *ByteReader) SeekAbsolute(pos int) error {
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

func (r *ByteReader) Peek(count int) []byte {
	if r.pos+count > len(r.data) {
		return nil
	}
	return r.data[r.pos : r.pos+count]
}

func (r *ByteReader) NextIndex(seq []byte) int {
	buf := r.data[r.pos:]
	index := bytes.Index(buf, seq)
	if index == -1 {
		return -1
	}
	return index
}

func (r *ByteReader) MustNextIndex(seq []byte) int {
	buf := r.data[r.pos:]
	index := bytes.Index(buf, seq)
	if index == -1 {
		panic("sequence not found")
	}
	return index
}

func (r *ByteReader) IsEOF() bool {
	return r.pos >= len(r.data)
}

func (r *ByteReader) canRead(n int) bool {
	return r.pos+n <= len(r.data)
}

func (r *ByteReader) ReadBytes(n int) ([]byte, error) {
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

func (r *ByteReader) ReadUntilByte(b byte) ([]byte, error) {
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

func (r *ByteReader) ReadByte() (byte, error) {
	if b, err := r.ReadBytes(1); err == nil {
		return b[0], nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadInt8() (int8, error) {
	if b, err := r.ReadBytes(1); err == nil {
		return int8(b[0]), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadUint8() (uint8, error) {
	if b, err := r.ReadBytes(1); err == nil {
		return uint8(b[0]), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadInt16() (int16, error) {
	if b, err := r.ReadBytes(2); err == nil {
		return int16(r.order.Uint16(b)), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadUint16() (uint16, error) {
	if b, err := r.ReadBytes(2); err == nil {
		return r.order.Uint16(b), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadInt32() (int32, error) {
	if b, err := r.ReadBytes(4); err == nil {
		return int32(r.order.Uint32(b)), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadUint32() (uint32, error) {
	if b, err := r.ReadBytes(4); err == nil {
		return r.order.Uint32(b), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadInt64() (int64, error) {
	if b, err := r.ReadBytes(8); err == nil {
		return int64(r.order.Uint64(b)), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadUint64() (uint64, error) {
	if b, err := r.ReadBytes(8); err == nil {
		return r.order.Uint64(b), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadFloat32() (float32, error) {
	if b, err := r.ReadBytes(4); err == nil {
		bits := r.order.Uint32(b)
		return math.Float32frombits(bits), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) ReadFloat64() (float64, error) {
	if b, err := r.ReadBytes(8); err == nil {
		bits := r.order.Uint64(b)
		return math.Float64frombits(bits), nil
	} else {
		return 0, err
	}
}

func (r *ByteReader) MustReadBytes(n int) []byte {
	b, err := r.ReadBytes(n)
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadByte() byte {
	b, err := r.ReadByte()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadInt8() int8 {
	b, err := r.ReadInt8()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadUint8() uint8 {
	b, err := r.ReadUint8()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadInt16() int16 {
	b, err := r.ReadInt16()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadUint16() uint16 {
	b, err := r.ReadUint16()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadInt32() int32 {
	b, err := r.ReadInt32()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadUint32() uint32 {
	b, err := r.ReadUint32()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadInt64() int64 {
	b, err := r.ReadInt64()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadUint64() uint64 {
	b, err := r.ReadUint64()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadFloat32() float32 {
	b, err := r.ReadFloat32()
	if err != nil {
		panic(err)
	}
	return b
}

func (r *ByteReader) MustReadFloat64() float64 {
	b, err := r.ReadFloat64()
	if err != nil {
		panic(err)
	}
	return b
}
