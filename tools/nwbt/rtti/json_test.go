package rtti_test

import (
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/rtti"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestObjectStreamToJSON(t *testing.T) {
	data, err := os.ReadFile("samples/12mb02_divinegaze_ai_32x32_collision_chunk_11_48_3.dynamicslice")
	assert.NoError(t, err)

	object, err := azcs.Parse(data)
	assert.NoError(t, err)

	crc, err := rtti.LoadCrcTable("nwt/nwt-crc.json")
	assert.NoError(t, err)

	ids, err := rtti.LoadUuIdTable("nwt/nwt-types.json")
	assert.NoError(t, err)

	data, err = rtti.ObjectStreamToJSON(object, crc, ids)
	assert.NoError(t, err)

	err = os.WriteFile("samples/12mb02_divinegaze_ai_32x32_collision_chunk_11_48_3.json", data, 0644)
	assert.NoError(t, err)
}
