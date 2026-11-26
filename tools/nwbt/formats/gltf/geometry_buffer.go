package gltf

import (
	"encoding/binary"
	gomath "math"
	"slices"

	"github.com/qmuntal/gltf"
	"github.com/x448/float16"
)

// reserveBuffer grows the capacity of the last buffer by n bytes, so the following appends don't reallocate
func (doc *Document) reserveBuffer(n int) {
	buffer := doc.lastBuffer()
	buffer.Data = slices.Grow(buffer.Data, n)
}

func (doc *Document) lastBuffer() *gltf.Buffer {
	if len(doc.Buffers) == 0 {
		doc.Buffers = append(doc.Buffers, new(gltf.Buffer))
	}
	return doc.Buffers[len(doc.Buffers)-1]
}

// appendBufferView appends a 4 byte aligned buffer view of the given size to the last buffer.
// Returns the view index and its bytes, which the caller fills before the next append (an append may move the buffer).
func (doc *Document) appendBufferView(size int, stride int, target gltf.Target) (int, []byte) {
	buffer := doc.lastBuffer()
	start := len(buffer.Data)
	offset := (start + 3) &^ 3
	buffer.Data = slices.Grow(buffer.Data, offset-start+size)[:offset+size]
	clear(buffer.Data[start:offset])
	buffer.ByteLength = len(buffer.Data)
	doc.BufferViews = append(doc.BufferViews, &gltf.BufferView{
		Buffer:     len(doc.Buffers) - 1,
		ByteOffset: offset,
		ByteLength: size,
		ByteStride: stride,
		Target:     target,
	})
	return len(doc.BufferViews) - 1, buffer.Data[offset : offset+size]
}

func (doc *Document) appendAccessor(view int, offset int, count int, c gltf.ComponentType, a gltf.AccessorType, normalized bool) int {
	doc.Accessors = append(doc.Accessors, &gltf.Accessor{
		BufferView:    gltf.Index(view),
		ByteOffset:    offset,
		ComponentType: c,
		Type:          a,
		Count:         count,
		Normalized:    normalized,
	})
	return len(doc.Accessors) - 1
}

func readF32(b []byte) float32 {
	return gomath.Float32frombits(binary.LittleEndian.Uint32(b))
}

func readF16(b []byte) float32 {
	return float16.Frombits(binary.LittleEndian.Uint16(b)).Float32()
}

func readSnorm16(b []byte) float32 {
	return float32(int16(binary.LittleEndian.Uint16(b))) / 32767.0
}

func putF32(b []byte, v float32) {
	binary.LittleEndian.PutUint32(b, gomath.Float32bits(v))
}

func putVec3(b []byte, v [3]float32) {
	putF32(b[0:], v[0])
	putF32(b[4:], v[1])
	putF32(b[8:], v[2])
}

func putVec4(b []byte, v [4]float32) {
	putF32(b[0:], v[0])
	putF32(b[4:], v[1])
	putF32(b[8:], v[2])
	putF32(b[12:], v[3])
}

// putSnorm16 writes v (-1..1) as a normalized int16 (KHR_mesh_quantization)
func putSnorm16(b []byte, v float32) {
	x := max(-1, min(1, v)) * 32767
	if x >= 0 {
		x += 0.5
	} else {
		x -= 0.5
	}
	binary.LittleEndian.PutUint16(b, uint16(int16(x)))
}

// putBGRA writes a CryEngine vertex color (UCol, stored as b, g, r, a) as r, g, b, a
func putBGRA(dst []byte, src []byte) {
	dst[0] = src[2]
	dst[1] = src[1]
	dst[2] = src[0]
	dst[3] = src[3]
}

// minMax accumulates the bounds of the POSITION accessor (required by glTF)
type minMax struct {
	min [3]float32
	max [3]float32
	any bool
}

func (m *minMax) add(v [3]float32) {
	if !m.any {
		m.min, m.max, m.any = v, v, true
		return
	}
	for i := range 3 {
		m.min[i] = min(m.min[i], v[i])
		m.max[i] = max(m.max[i], v[i])
	}
}

func (m *minMax) apply(acc *gltf.Accessor) {
	if !m.any {
		return
	}
	acc.Min = []float64{float64(m.min[0]), float64(m.min[1]), float64(m.min[2])}
	acc.Max = []float64{float64(m.max[0]), float64(m.max[1]), float64(m.max[2])}
}

func vecLength(v [3]float32) float32 {
	return float32(gomath.Sqrt(float64(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])))
}

func vecCross(a, b [3]float32) [3]float32 {
	return [3]float32{
		a[1]*b[2] - a[2]*b[1],
		a[2]*b[0] - a[0]*b[2],
		a[0]*b[1] - a[1]*b[0],
	}
}

func vecScale(v [3]float32, s float32) [3]float32 {
	return [3]float32{v[0] * s, v[1] * s, v[2] * s}
}

// unitOr normalizes v, or returns the fallback if v has no length or is not finite.
// glTF requires unit NORMAL and TANGENT.xyz, degenerate source frames would produce zero or NaN vectors.
// Short vectors (cross products of tiny bitangents) still carry a direction, only exact zero falls back.
func unitOr(v [3]float32, fallback [3]float32) [3]float32 {
	if u, ok := unit(v); ok {
		return u
	}
	return fallback
}

// unit normalizes v, false if v has no length or is not finite
func unit(v [3]float32) ([3]float32, bool) {
	l := float64(v[0])*float64(v[0]) + float64(v[1])*float64(v[1]) + float64(v[2])*float64(v[2])
	if !(l > 0) || gomath.IsInf(l, 0) {
		return v, false
	}
	return vecScale(v, float32(1/gomath.Sqrt(l))), true
}

// finiteOr returns v, or 0 for NaN and infinity (glTF forbids non-finite accessor values, some source uvs have them)
func finiteOr0(v float32) float32 {
	if gomath.IsNaN(float64(v)) || gomath.IsInf(float64(v), 0) {
		return 0
	}
	return v
}

// perpendicular returns a unit vector perpendicular to the unit vector v
func perpendicular(v [3]float32) [3]float32 {
	axis := [3]float32{1, 0, 0}
	if gomath.Abs(float64(v[0])) > 0.9 {
		axis = [3]float32{0, 1, 0}
	}
	return unitOr(vecCross(v, axis), [3]float32{0, 0, 1})
}
