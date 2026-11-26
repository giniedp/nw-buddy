package rtti_test

import (
	"encoding/json"
	"flag"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/rtti"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// update rewrites the sample json, run with: go test ./rtti/ -run TestObjectStreamToJSON -update
var update = flag.Bool("update", false, "rewrite the sample json files")

const sampleName = "samples/12mb02_divinegaze_ai_32x32_collision_chunk_11_48_3"

func TestObjectStreamToJSON(t *testing.T) {
	data, err := os.ReadFile(sampleName + ".dynamicslice")
	require.NoError(t, err)

	object, err := azcs.Parse(data)
	require.NoError(t, err)

	crc, err := rtti.LoadCrcTable("nwt/nwt-crc.json")
	require.NoError(t, err)

	ids, err := rtti.LoadUuIdTable("nwt/nwt-types.json")
	require.NoError(t, err)

	data, err = rtti.ObjectStreamToJSON(object, crc, ids)
	require.NoError(t, err)
	assert.True(t, json.Valid(data), "the output is valid json")
	assert.NotEmpty(t, data)

	if *update {
		require.NoError(t, os.WriteFile(sampleName+".json", data, 0644))
	}
}
