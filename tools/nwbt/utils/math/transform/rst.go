package transform

import (
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

type RST []nwt.AzFloat32

func (t RST) Rotation() nwt.AzQuat {
	return [4]nwt.AzFloat32{t[0], t[1], t[2], t[3]}
}

func (t RST) Scale() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[4], t[5], t[6]}
}

func (t RST) Translation() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[7], t[8], t[9]}
}

func (t RST) ToMat4() mat4.Data {
	return mat4.FromAzTransformData(t)
}

func (t RST) TransformPoint(point nwt.AzVec3) nwt.AzVec3 {
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
