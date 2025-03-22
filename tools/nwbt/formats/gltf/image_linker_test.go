package gltf_test

import (
	"nw-buddy/tools/formats/gltf"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResourceLinker(t *testing.T) {
	ourDir := "foo/bar"
	outFile := "foo/bar/baz/model.gltf"

	it := gltf.NewResourceLinker(ourDir)
	uri := it.ToAssetURI(outFile, "textures/foo.png")
	assert.Equal(t, "../textures/foo.png", uri)

	uri = it.ToOutputURI(outFile, "../textures/foo.png")
	assert.Equal(t, "textures/foo.png", uri)
}
