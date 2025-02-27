package crymath

import "nw-buddy/tools/nw-kit/rtti/nwt"

type Transform interface {
	// GetRotation returns a copy of the translation part of this transform
	Translation() nwt.AzVec3
	TransformPoint(nwt.AzVec3) nwt.AzVec3
}

func TransformFromAzTransform(it nwt.AzTransform) Transform {
	if len(it.Data) == 10 {
		return TransformSRT(it.Data)
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

type TransformSRT []nwt.AzFloat32

func (t TransformSRT) Rotation() nwt.AzQuat {
	return [4]nwt.AzFloat32{t[0], t[1], t[2], t[3]}
}

func (t TransformSRT) Scale() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[4], t[5], t[6]}
}

func (t TransformSRT) Translation() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[7], t[8], t[9]}
}

func (t TransformSRT) TransformPoint(point nwt.AzVec3) nwt.AzVec3 {
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
		rx + t[7],
		ry + t[8],
		rz + t[9],
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
