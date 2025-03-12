package crymath

import (
	"nw-buddy/tools/rtti/nwt"
)

type Transform interface {
	Translation() nwt.AzVec3
	TransformPoint(nwt.AzVec3) nwt.AzVec3
	ToMat4() Mat4x4
}

func TransformFromAzTransform(it nwt.AzTransform) Transform {
	if len(it.Data) == 10 {
		return TransformRST(it.Data)
	}
	if len(it.Data) == 12 {
		return TransformMat(it.Data)
	}
	return IdentityTransform()
}

type TransformMat []nwt.AzFloat32

func (t TransformMat) Translation() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[9], t[10], t[11]}
}

func (t TransformMat) TransformPoint(point nwt.AzVec3) nwt.AzVec3 {
	return [3]nwt.AzFloat32{
		point[0]*t[0] + point[1]*t[3] + point[2]*t[6] + t[9],
		point[0]*t[1] + point[1]*t[4] + point[2]*t[7] + t[10],
		point[0]*t[2] + point[1]*t[5] + point[2]*t[8] + t[11],
	}
}

func (t TransformMat) ToMat4() Mat4x4 {
	return Mat4FromAzTransform(nwt.AzTransform{Data: t})
}

type TransformRST []nwt.AzFloat32

func (t TransformRST) Rotation() nwt.AzQuat {
	return [4]nwt.AzFloat32{t[0], t[1], t[2], t[3]}
}

func (t TransformRST) Scale() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[4], t[5], t[6]}
}

func (t TransformRST) Translation() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[7], t[8], t[9]}
}

func (t TransformRST) ToMat4() Mat4x4 {
	return Mat4FromAzTransform(nwt.AzTransform{Data: t})
}

func (t TransformRST) TransformPoint(point nwt.AzVec3) nwt.AzVec3 {
	x := t[0]
	y := t[1]
	z := t[2]
	w := t[3]

	vx := point[0]
	vy := point[1]
	vz := point[2]

	x2 := x + x
	y2 := y + y
	z2 := z + z

	wx2 := w * x2
	wy2 := w * y2
	wz2 := w * z2

	xx2 := x * x2
	xy2 := x * y2
	xz2 := x * z2

	yy2 := y * y2
	yz2 := y * z2
	zz2 := z * z2

	rx := vx*(1.0-yy2-zz2) + vy*(xy2-wz2) + vz*(xz2+wy2)
	ry := vx*(xy2+wz2) + vy*(1.0-xx2-zz2) + vz*(yz2-wx2)
	rz := vx*(xz2-wy2) + vy*(yz2+wx2) + vz*(1.0-xx2-yy2)

	return [3]nwt.AzFloat32{
		rx*t[4] + t[7],
		ry*t[5] + t[8],
		rz*t[6] + t[9],
	}
}

func IdentityTransform() Transform {
	srt := []nwt.AzFloat32{
		1, 0, 0, // col1
		0, 1, 0, // col2
		0, 0, 1, // col3
		0, 0, 0, // translation
	}
	return TransformMat(srt)
}

func Mat4FromAzTransform(it nwt.AzTransform) Mat4x4 {
	if len(it.Data) == 10 {
		rotation := it.Data[0:4]
		scale := it.Data[4:7]
		translation := it.Data[7:10]
		mat := Mat4FromQuaternion(Quat{
			float32(rotation[0]), float32(rotation[1]), float32(rotation[2]), float32(rotation[3]),
		})
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
	if len(it.Data) == 12 {
		return [16]float32{
			float32(it.Data[0]), float32(it.Data[1]), float32(it.Data[2]), 0,
			float32(it.Data[3]), float32(it.Data[4]), float32(it.Data[5]), 0,
			float32(it.Data[6]), float32(it.Data[7]), float32(it.Data[8]), 0,
			float32(it.Data[9]), float32(it.Data[10]), float32(it.Data[11]), 1,
		}
	}
	return [16]float32{
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	}
}
