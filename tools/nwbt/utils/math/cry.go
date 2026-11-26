package math

import (
	gomath "math"
	"nw-buddy/tools/utils/math/mat4"
)

type Base interface {
	Vec3(v Vec3) Vec3
	Vec4(v Vec4) Vec4
	Quat(v Quat) Quat
	Mat4(m mat4.Data) mat4.Data
}

func GetBase(yUp bool) Base {
  if yUp {
    return &cryToGltfBase{}
  }
  return &cryBase{}
}

type cryToGltfBase struct{}

func (b *cryToGltfBase) Vec3(v Vec3) Vec3 {
	return CryToGltfVec3(v)
}

func (b *cryToGltfBase) Vec4(v Vec4) Vec4 {
	return CryToGltfVec4(v)
}

func (b *cryToGltfBase) Quat(v Quat) Quat {
	return CryToGltfQuat(v)
}

func (b *cryToGltfBase) Mat4(m mat4.Data) mat4.Data {
	return CryToGltfMat4(m)
}

type cryBase struct{}

func (b *cryBase) Vec3(v Vec3) Vec3 {
	return v
}

func (b *cryBase) Vec4(v Vec4) Vec4 {
	return v
}

func (b *cryBase) Quat(v Quat) Quat {
	return v
}

func (b *cryBase) Mat4(m mat4.Data) mat4.Data {
	return mat4.Data{
		m[0], m[1], m[2], m[3],
		m[4], m[5], m[6], m[7],
		m[8], m[9], m[10], m[11],
		m[12], m[13], m[14], m[15],
	}
}

type Vec3 = [3]float32
type Vec4 = [4]float32
type Quat = [4]float32

func CryToGltfVec3(v Vec3) Vec3 {
	return Vec3{-v[0], v[2], v[1]}
}

func CryToGltfVec4(v Vec4) Vec4 {
	return Vec4{-v[0], v[2], v[1], v[3]}
}

func CryToGltfQuat(v Quat) Quat {
	return Quat{-v[0], v[2], v[1], v[3]}
}

func CryToGltfMat4(mat mat4.Data) mat4.Data {
	// -1 0 0 0
	// 0 0 1 0
	// 0 1 0 0
	// 0 0 0 1
	return mat4.Data{
		mat[0], -mat[2], -mat[1], -mat[3],
		-mat[8], mat[10], mat[9], mat[11],
		-mat[4], mat[6], mat[5], mat[7],
		-mat[12], mat[14], mat[13], mat[15],
	}
}

func Vec3Len(v Vec3) float32 {
	return float32(gomath.Sqrt(float64(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])))
}

func QuatLen(v Quat) float32 {
	return float32(gomath.Sqrt(float64(v[0]*v[0] + v[1]*v[1] + v[2]*v[2] + v[3]*v[3])))
}

func Cross(a, b [3]float32) [3]float32 {
	return [3]float32{
		a[1]*b[2] - a[2]*b[1],
		a[2]*b[0] - a[0]*b[2],
		a[0]*b[1] - a[1]*b[0],
	}
}

func Normalize(v [3]float32) [3]float32 {
	length := float32(gomath.Sqrt(float64(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])))
	if length > 0 {
		return [3]float32{v[0] / length, v[1] / length, v[2] / length}
	}
	return v
}
