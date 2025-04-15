package heightmap_test

import (
	"bytes"
	"errors"
	"image"
	"image/png"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/utils/tiff"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestReadPathMetadata(t *testing.T) {
	meta, ok := heightmap.ReadPathMetadata("sharedassets/coatlicue/templateworld/regions/r_+01_+02")
	assert.True(t, ok)
	assert.Equal(t, heightmap.Meta{X: 1, Y: 2, Level: "templateworld"}, meta)
}

func TestParseHeightField(t *testing.T) {
	data, err := os.ReadFile("samples/region.heightmap")
	assert.NoError(t, err)
	region, err := heightmap.ParseHeightField(data)
	assert.NoError(t, err)
	assert.Equal(t, 2048*2048, len(region))

	size := 2048
	img := image.NewRGBA(image.Rect(0, 0, size, size))

	index := 0
	for y := range size {
		for x := range size {
			col := heightmap.EncodeHeightToR8G8B8(region[index])
			index++
			img.Set(x, y, col)
		}
	}
	f, err := os.Create("samples/region.png")
	assert.NoError(t, err)
	err = png.Encode(f, img)
	assert.NoError(t, err)
}

func TestNativeTiff(t *testing.T) {
	data, err := os.ReadFile("samples/region.heightmap")
	assert.NoError(t, err)
	pngData, err := ConvertTiffToPng(data)

	// Assert that the conversion succeeded
	assert.NoError(t, err)
	assert.NotNil(t, pngData)

	// Add assertion to compare pngData with reference file
	expectedPngBytes, err := os.ReadFile("samples/region-16bit.png")
	require.NoError(t, err, "Failed to read reference PNG file samples/region-16bit.png")
	if !assert.Equal(t, expectedPngBytes, pngData, "Generated PNG data does not match reference file samples/region-16bit.png") {
		// Write the generated PNG to a file for inspection if the assertion fails
		_ = os.MkdirAll("samples", 0755) // Ensure the samples directory exists
		err = os.WriteFile("samples/generated_region.png", pngData, 0644)
		require.NoError(t, err, "Failed to write generated PNG file")
		t.Log("Generated PNG data written to samples/generated_region.png for inspection")
	}
}

func ConvertTiffToPng(data []byte) ([]byte, error) {
	img, _, err := tiff.Decode(bytes.NewReader(data), nil)
	if err != nil {
		return nil, err
	}

	var pngBuf bytes.Buffer
	err = png.Encode(&pngBuf, img)
	if err != nil {
		return nil, errors.New("failed to encode PNG: " + err.Error())
	}
	return pngBuf.Bytes(), nil
}
