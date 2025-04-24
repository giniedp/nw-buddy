package gltf

type Mat4x4 = [16]float32
type Vec3 = [3]float32
type Quat = [4]float32

func CryToGltfVec3(v Vec3) Vec3 {
	return Vec3{-v[0], v[2], v[1]}
}

func CryToGltfQuat(v Quat) Quat {
	return Quat{-v[0], v[2], v[1], v[3]}
}

func CryToGltfMat4(mat Mat4x4) Mat4x4 {
	// 1 0 0 0
	// 0 0 1 0
	// 0 1 0 0
	// 0 0 0 1
	return Mat4x4{
		mat[0], -mat[2], -mat[1], -mat[3],
		-mat[8], mat[10], mat[9], mat[11],
		-mat[4], mat[6], mat[5], mat[7],
		-mat[12], mat[14], mat[13], mat[15],
	}
}

func Mat4ToFloat64(m Mat4x4) (out [16]float64) {
	for i, v := range m {
		out[i] = float64(v)
	}
	return
}

func Mat4Transpose(m Mat4x4) Mat4x4 {
	return Mat4x4{
		m[0], m[4], m[8], m[12],
		m[1], m[5], m[9], m[13],
		m[2], m[6], m[10], m[14],
		m[3], m[7], m[11], m[15],
	}
}

func Mat4Identity() Mat4x4 {
	return Mat4x4{
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	}
}

func Mat4IsIdentity(m Mat4x4) bool {
	return m == Mat4Identity()
}

func Mat4Concat(a, b Mat4x4) Mat4x4 {
	return Mat4Multiply(b, a)
}
func Mat4Multiply(a, b Mat4x4) (out Mat4x4) {
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
