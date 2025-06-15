package math

import "nw-buddy/tools/utils/math/mat4"

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
