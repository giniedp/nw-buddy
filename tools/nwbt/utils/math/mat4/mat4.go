package mat4

import (
	"fmt"
	"nw-buddy/tools/rtti/nwt"
)

type Data = [16]float32

func FromQuat(q [4]float32) Data {
	return FromQuatXYZW(q[0], q[1], q[2], q[3])
}

func FromQuatXYZW(x, y, z, w float32) Data {
	xx := x * x
	xy := x * y
	xz := x * z
	xw := x * w

	yy := y * y
	yz := y * z
	yw := y * w

	zz := z * z
	zw := z * w

	m := [16]float32{}
	m[0] = 1 - 2*(yy+zz)
	m[1] = 2 * (xy + zw)
	m[2] = 2 * (xz - yw)
	m[3] = 0

	m[4] = 2 * (xy - zw)
	m[5] = 1 - 2*(zz+xx)
	m[6] = 2 * (yz + xw)
	m[7] = 0

	m[8] = 2 * (xz + yw)
	m[9] = 2 * (yz - xw)
	m[10] = 1 - 2*(yy+xx)
	m[11] = 0

	m[12] = 0
	m[13] = 0
	m[14] = 0
	m[15] = 1
	return m
}

func ToFloat64(m Data) (out [16]float64) {
	for i, v := range m {
		out[i] = float64(v)
	}
	return
}

func Transpose(m Data) Data {
	return Data{
		m[0], m[4], m[8], m[12],
		m[1], m[5], m[9], m[13],
		m[2], m[6], m[10], m[14],
		m[3], m[7], m[11], m[15],
	}
}

func Identity() Data {
	return Data{
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	}
}

func IsIdentity(m Data) bool {
	return m == Identity()
}

func Concat(a, b Data) Data {
	return Multiply(b, a)
}

func Multiply(a, b Data) (out Data) {
	a00 := a[0]
	a01 := a[1]
	a02 := a[2]
	a03 := a[3]
	a10 := a[4]
	a11 := a[5]
	a12 := a[6]
	a13 := a[7]
	a20 := a[8]
	a21 := a[9]
	a22 := a[10]
	a23 := a[11]
	a30 := a[12]
	a31 := a[13]
	a32 := a[14]
	a33 := a[15]

	b00 := b[0]
	b01 := b[1]
	b02 := b[2]
	b03 := b[3]
	b10 := b[4]
	b11 := b[5]
	b12 := b[6]
	b13 := b[7]
	b20 := b[8]
	b21 := b[9]
	b22 := b[10]
	b23 := b[11]
	b30 := b[12]
	b31 := b[13]
	b32 := b[14]
	b33 := b[15]

	out[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30
	out[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31
	out[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32
	out[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33
	out[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30
	out[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31
	out[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32
	out[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33
	out[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30
	out[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31
	out[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32
	out[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33
	out[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30
	out[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31
	out[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32
	out[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33
	return out
}

// Invert returns the inverse of m, or the identity if m is singular
func Invert(m Data) Data {
	a00, a01, a02, a03 := m[0], m[1], m[2], m[3]
	a10, a11, a12, a13 := m[4], m[5], m[6], m[7]
	a20, a21, a22, a23 := m[8], m[9], m[10], m[11]
	a30, a31, a32, a33 := m[12], m[13], m[14], m[15]

	b00 := a00*a11 - a01*a10
	b01 := a00*a12 - a02*a10
	b02 := a00*a13 - a03*a10
	b03 := a01*a12 - a02*a11
	b04 := a01*a13 - a03*a11
	b05 := a02*a13 - a03*a12
	b06 := a20*a31 - a21*a30
	b07 := a20*a32 - a22*a30
	b08 := a20*a33 - a23*a30
	b09 := a21*a32 - a22*a31
	b10 := a21*a33 - a23*a31
	b11 := a22*a33 - a23*a32

	det := b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06
	if det == 0 {
		return Identity()
	}
	det = 1 / det

	return Data{
		(a11*b11 - a12*b10 + a13*b09) * det,
		(a02*b10 - a01*b11 - a03*b09) * det,
		(a31*b05 - a32*b04 + a33*b03) * det,
		(a22*b04 - a21*b05 - a23*b03) * det,
		(a12*b08 - a10*b11 - a13*b07) * det,
		(a00*b11 - a02*b08 + a03*b07) * det,
		(a32*b02 - a30*b05 - a33*b01) * det,
		(a20*b05 - a22*b02 + a23*b01) * det,
		(a10*b10 - a11*b08 + a13*b06) * det,
		(a01*b08 - a00*b10 - a03*b06) * det,
		(a30*b04 - a31*b02 + a33*b00) * det,
		(a21*b02 - a20*b04 - a23*b00) * det,
		(a11*b07 - a10*b09 - a12*b06) * det,
		(a00*b09 - a01*b07 + a02*b06) * det,
		(a31*b01 - a30*b03 - a32*b00) * det,
		(a20*b03 - a21*b01 + a22*b00) * det,
	}
}

func FromAzTransform(it nwt.AzTransform) Data {
	return FromAzTransformData(it.Data)
}

func FromAzTransformData(data []nwt.AzFloat32) Data {
	if len(data) == 10 {
		rotation := data[0:4]
		scale := data[4:7]
		translation := data[7:10]
		mat := FromQuatXYZW(float32(rotation[0]), float32(rotation[1]), float32(rotation[2]), float32(rotation[3]))
		mat[0] *= float32(scale[0])
		mat[1] *= float32(scale[0])
		mat[2] *= float32(scale[0])
		mat[4] *= float32(scale[1])
		mat[5] *= float32(scale[1])
		mat[6] *= float32(scale[1])
		mat[8] *= float32(scale[2])
		mat[9] *= float32(scale[2])
		mat[10] *= float32(scale[2])
		mat[12] = float32(translation[0])
		mat[13] = float32(translation[1])
		mat[14] = float32(translation[2])
		return mat
	}
	if len(data) == 12 {
		return [16]float32{
			float32(data[0]), float32(data[1]), float32(data[2]), 0,
			float32(data[3]), float32(data[4]), float32(data[5]), 0,
			float32(data[6]), float32(data[7]), float32(data[8]), 0,
			float32(data[9]), float32(data[10]), float32(data[11]), 1,
		}
	}
	return [16]float32{
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	}
}

func UnsafeHash(m Data) string {
	res := ""
	for _, v := range m {
		res += fmt.Sprintf("%.4f", v)
	}
	return res
}

func PositionOf(m Data) nwt.AzVec3 {
	return nwt.AzVec3{
		nwt.AzFloat32(m[12]),
		nwt.AzFloat32(m[13]),
		nwt.AzFloat32(m[14]),
	}
}

func TransformPoint(m Data, p nwt.AzVec3) nwt.AzVec3 {
	x, y, z := float32(p[0]), float32(p[1]), float32(p[2])
	return nwt.AzVec3{
		nwt.AzFloat32(m[0]*x + m[4]*y + m[8]*z + m[12]),
		nwt.AzFloat32(m[1]*x + m[5]*y + m[9]*z + m[13]),
		nwt.AzFloat32(m[2]*x + m[6]*y + m[10]*z + m[14]),
	}
}

// FromRotationScaleTranslation composes translation * rotation (x, y, z, w) * uniform scale
func FromRotationScaleTranslation(q [4]float32, scale float32, t [3]float32) Data {
	m := FromQuatXYZW(q[0], q[1], q[2], q[3])
	for i := 0; i < 12; i++ {
		if i%4 != 3 {
			m[i] *= scale
		}
	}
	m[12], m[13], m[14] = t[0], t[1], t[2]
	return m
}

func TransformVec2(m Data, v2 nwt.AzVec2) nwt.AzVec2 {
	x := v2[0]*nwt.AzFloat32(m[0]) + v2[1]*nwt.AzFloat32(m[4]) + nwt.AzFloat32(m[12])
	y := v2[0]*nwt.AzFloat32(m[1]) + v2[1]*nwt.AzFloat32(m[5]) + nwt.AzFloat32(m[13])
	return nwt.AzVec2{x, y}
}
