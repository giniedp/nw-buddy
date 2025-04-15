package heightmap_test

import (
	"bytes"
	"fmt"
	"image"
	"image/png"
	"nw-buddy/tools/formats/heightmap"
	"os"
	"testing"

	"golang.org/x/image/tiff"

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

	// Compare pngData with the expected grayscale reference file
	expectedGrayscalePng := "samples/region-16bit-gray.png"
	expectedPngBytes, err := os.ReadFile(expectedGrayscalePng)
	require.NoError(t, err, "Failed to read reference grayscale PNG file %s", expectedGrayscalePng)
	if !assert.Equal(t, expectedPngBytes, pngData, "Generated PNG data does not match reference file %s", expectedGrayscalePng) {
		// Write the generated PNG to a file for inspection if the assertion fails
		_ = os.MkdirAll("samples", 0755) // Ensure the samples directory exists
		generatedPngFile := "samples/generated_region_grayscale.png"
		err = os.WriteFile(generatedPngFile, pngData, 0644)
		require.NoError(t, err, "Failed to write generated grayscale PNG file %s", generatedPngFile)
		t.Logf("Generated grayscale PNG data written to %s for inspection", generatedPngFile)
	}
}

func ConvertTiffToPng(data []byte) ([]byte, error) {
	// Attempt to force grayscale in-place if applicable
	_, err := heightmap.ForceGrayscaleIfRGBSPP1(data)
	if err != nil {
		// If forcing grayscale fails (e.g., unexpected tag format), return the error
		return nil, fmt.Errorf("failed during ForceGrayscaleIfRGBSPP1 check: %w", err)
	}

	// Decode using the standard library decoder. The data might have been modified.
	img, err := tiff.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("failed to decode TIFF: %w", err)
	}

	var pngBuf bytes.Buffer
	err = png.Encode(&pngBuf, img)
	if err != nil {
		return nil, fmt.Errorf("failed to encode PNG: %w", err)
	}
	return pngBuf.Bytes(), nil
}
