package transform

import (
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

type Matrix []nwt.AzFloat32

func (t Matrix) Translation() nwt.AzVec3 {
	return [3]nwt.AzFloat32{t[9], t[10], t[11]}
}

func (t Matrix) TransformPoint(point nwt.AzVec3) nwt.AzVec3 {
	return [3]nwt.AzFloat32{
		point[0]*t[0] + point[1]*t[3] + point[2]*t[6] + t[9],
		point[0]*t[1] + point[1]*t[4] + point[2]*t[7] + t[10],
		point[0]*t[2] + point[1]*t[5] + point[2]*t[8] + t[11],
	}
}

func (t Matrix) ToMat4() mat4.Data {
	return mat4.FromAzTransformData(t)
}
