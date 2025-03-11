package gltf_test

import (
	"nw-buddy/tools/formats/gltf"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExtraLoad(t *testing.T) {
	doc := gltf.NewDocument()
	assert.Nil(t, doc.Extras)
	doc.Extras = gltf.ExtrasStore(doc.Extras, "foo", "bar")
	assert.NotNil(t, doc.Extras)
	value, ok := gltf.ExtrasLoad[string](doc.Extras, "foo")
	assert.True(t, ok)
	assert.Equal(t, "bar", value)
}

func TestDefaultScene(t *testing.T) {
	doc := gltf.NewDocument()
	assert.NotNil(t, doc.DefaultScene())
}

func TestNewNode(t *testing.T) {
	doc := gltf.NewDocument()
	assert.Len(t, doc.Nodes, 0)

	node, _ := doc.NewNode()
	assert.NotNil(t, node)

	assert.Len(t, doc.Nodes, 1)
}

func TestAddToScene(t *testing.T) {
	doc := gltf.NewDocument()

	scene := doc.DefaultScene()
	assert.Len(t, scene.Nodes, 0)

	node, _ := doc.NewNode()
	doc.AddToScene(scene, node)

	assert.Len(t, scene.Nodes, 1)
}
