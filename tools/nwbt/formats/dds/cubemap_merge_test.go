package dds

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMergeCubemapFaces(t *testing.T) {
	// mip 0: 2 bytes per face, mip 1: 1 byte per face (value = face*10 + mip)
	part := []byte{0, 0, 10, 10, 20, 20, 30, 30, 40, 40, 50, 50}
	// the base holds the remaining mips per face: mip 2 and mip 3 of face 0, then of face 1, ...
	base := []byte{2, 3, 12, 13, 22, 23, 32, 33, 42, 43, 52, 53}
	next := []byte{1, 11, 21, 31, 41, 51}

	result := mergeCubemapFaces([][]byte{part, next}, base)

	assert.Equal(t, []byte{
		0, 0, 1, 2, 3,
		10, 10, 11, 12, 13,
		20, 20, 21, 22, 23,
		30, 30, 31, 32, 33,
		40, 40, 41, 42, 43,
		50, 50, 51, 52, 53,
	}, result)
}

func TestMergeCubemapFacesWithoutParts(t *testing.T) {
	base := []byte{0, 1, 2, 3, 4, 5}
	assert.Equal(t, base, mergeCubemapFaces(nil, base))
}
