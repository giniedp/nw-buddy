package bspace_test

import (
	"nw-buddy/tools/formats/bspace"
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetParamSetValue(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("")
	assert.NoError(t, err)

	file, ok := fs.Lookup("sample/mammoth_movement_blend.bspace")
	assert.True(t, ok)

	doc, err := bspace.Load(file)
	assert.NoError(t, err)
	assert.NotNil(t, doc)

	v, ok := doc.ExampleSetPara(doc.ExampleList.Examples[0], "TurnSpeed")
	assert.True(t, ok)
	assert.Equal(t, "-1", v)

	v, ok = doc.ExampleSetPara(doc.ExampleList.Examples[0], "MoveSpeed")
	assert.False(t, ok)
	assert.Equal(t, "", v)
}
