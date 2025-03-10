package mtl_test

import (
	"nw-buddy/tools/formats/mtl"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	data, err := os.ReadFile("sample/male_alchemist_chest_matgroup.mtl")
	assert.NoError(t, err)

	doc, err := mtl.Parse(data)
	assert.NoError(t, err)

	assert.Equal(t, 524544, doc.MtlFlags)
	assert.NotNil(t, doc.Params)
	assert.Equal(t, 3, doc.Params.Len())
	assert.Equal(t, "0", doc.Params.Get("SSSIndex"))
	assert.Equal(t, "0.25,0.25,0.25,0.25", doc.Params.Get("IndirectColor"))
}
