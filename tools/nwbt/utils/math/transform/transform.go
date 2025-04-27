package transform

import (
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

type Node interface {
	Translation() nwt.AzVec3
	TransformPoint(nwt.AzVec3) nwt.AzVec3
	ToMat4() mat4.Data
}

func FromAzTransform(it nwt.AzTransform) Node {
	return FromAzTransformData(it.Data)
}

func FromAzTransformData(data []nwt.AzFloat32) Node {
	if len(data) == 10 {
		return RST(data)
	}
	if len(data) == 12 {
		return Matrix(data)
	}
	return Identity()
}

func Identity() Node {
	srt := []nwt.AzFloat32{
		1, 0, 0, // col1
		0, 1, 0, // col2
		0, 0, 1, // col3
		0, 0, 0, // translation
	}
	return Matrix(srt)
}
