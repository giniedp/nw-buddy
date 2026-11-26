package cgf

import (
	"math"
	"math/rand"
	"testing"

	"github.com/stretchr/testify/assert"
)

// packSmallTree48 is Lumberyard's SmallTree48BitQuat::ToInternalType (QuatQuantization.h)
func packSmallTree48(q [4]float32) [3]uint16 {
	q = normalizeQuat(q)
	index := largestComponent(q)
	if q[index] < 0 {
		q = negateQuat(q)
	}
	var value uint64
	shift := uint(0)
	for i := range q {
		if i == index {
			continue
		}
		packed := uint64(math.Floor(float64((q[i]+0.707106781186)*23170.0 + 0.5)))
		value |= packed << shift
		shift += 15
	}
	value |= uint64(index) << 46
	return [3]uint16{uint16(value), uint16(value >> 16), uint16(value >> 32)}
}

// packSmallTree64Ext is Lumberyard's SmallTree64BitExtQuat::ToInternalType (QuatQuantization.h)
func packSmallTree64Ext(q [4]float32) [2]uint32 {
	q = normalizeQuat(q)
	index := largestComponent(q)
	if q[index] < 0 {
		q = negateQuat(q)
	}
	var value uint64
	shift := uint(0)
	stored := 0
	for i := range q {
		if i == index {
			continue
		}
		if stored < 2 {
			value |= uint64(math.Floor(float64((q[i]+0.707106781186)*1482909.0+0.5))) << shift
			shift += 21
		} else {
			value |= uint64(math.Floor(float64((q[i]+0.707106781186)*741454.0+0.5))) << shift
			shift += 20
		}
		stored++
	}
	value |= uint64(index) << 62
	return [2]uint32{uint32(value), uint32(value >> 32)}
}

func largestComponent(q [4]float32) int {
	index := 0
	for i := 1; i < 4; i++ {
		if math.Abs(float64(q[i])) > math.Abs(float64(q[index])) {
			index = i
		}
	}
	return index
}

func normalizeQuat(q [4]float32) [4]float32 {
	l := float32(math.Sqrt(float64(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3])))
	return [4]float32{q[0] / l, q[1] / l, q[2] / l, q[3] / l}
}

func negateQuat(q [4]float32) [4]float32 {
	return [4]float32{-q[0], -q[1], -q[2], -q[3]}
}

// sameRotation compares two quaternions up to their sign (q and -q are the same rotation)
func sameRotation(t *testing.T, expected, actual [4]float32, delta float64) {
	t.Helper()
	dot := float64(expected[0]*actual[0] + expected[1]*actual[1] + expected[2]*actual[2] + expected[3]*actual[3])
	assert.InDelta(t, 1.0, math.Abs(dot), delta, "expected %v got %v", expected, actual)
}

func randomQuats(n int) [][4]float32 {
	rng := rand.New(rand.NewSource(1))
	result := make([][4]float32, 0, n+4)
	result = append(result, [4]float32{0, 0, 0, 1}, [4]float32{1, 0, 0, 0}, [4]float32{0, 0.7071068, 0, 0.7071068})
	for range n {
		result = append(result, normalizeQuat([4]float32{
			float32(rng.NormFloat64()),
			float32(rng.NormFloat64()),
			float32(rng.NormFloat64()),
			float32(rng.NormFloat64()),
		}))
	}
	return result
}

func TestSmallTree48BitQuat(t *testing.T) {
	for _, q := range randomQuats(1000) {
		actual, err := smallTree48BitQuat(packSmallTree48(q))
		assert.NoError(t, err)
		sameRotation(t, q, actual, 1e-6)
	}
}

func TestSmallTree64BitExtQuat(t *testing.T) {
	for _, q := range randomQuats(1000) {
		actual, err := smallTree64BitQuat(packSmallTree64Ext(q))
		assert.NoError(t, err)
		sameRotation(t, q, actual, 1e-6)
		for i := range q {
			// 20 bit quantization over a range of 1.414: about 1e-6 per component
			assert.InDelta(t, math.Abs(float64(q[i])), math.Abs(float64(actual[i])), 1e-5)
		}
	}
}

// The 21 bit components must keep their top bit: any value above 0 sets it ((0 + 0.7071) * MAX_21BITf > 2^20)
func TestSmallTree64BitExtQuatTopBit(t *testing.T) {
	q := normalizeQuat([4]float32{0.1, 0.69, 0.1, 0.71})
	data := packSmallTree64Ext(q)
	assert.NotZero(t, data[0]&(1<<20), "component 0 uses its 21st bit")
	actual, err := smallTree64BitQuat(data)
	assert.NoError(t, err)
	sameRotation(t, q, actual, 1e-6)
}
