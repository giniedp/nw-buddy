package azcs_test

import (
	"nw-buddy/tools/formats/azcs"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	data, err := os.ReadFile("samples/12mb02_divinegaze_ai_32x32_collision_chunk_11_48_3.dynamicslice")
	assert.NoError(t, err)
	_, err = azcs.Parse(data)
	assert.NoError(t, err)

}

func TestParse_aliasasset(t *testing.T) {
	data, err := os.ReadFile("samples/alias_alligator_black.aliasasset")
	assert.NoError(t, err)
	_, err = azcs.Parse(data)
	assert.NoError(t, err)

}
