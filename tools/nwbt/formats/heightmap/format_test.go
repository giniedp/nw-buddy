package heightmap_test

import (
	"bytes"
	"image"
	"image/png"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/tiff"
	"nw-buddy/tools/utils"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReadPathMetadata(t *testing.T) {
	meta, ok := heightmap.ReadPathMetadata("sharedassets/coatlicue/templateworld/regions/r_+01_+02")
	assert.True(t, ok)
	assert.Equal(t, heightmap.Meta{X: 1, Y: 2, Level: "templateworld"}, meta)
}

func TestParseHeightField(t *testing.T) {
	data, err := os.ReadFile("samples/region.heightmap")
	assert.NoError(t, err)
	region, err := heightmap.LoadFromTiff(data)
	assert.NoError(t, err)
	assert.Equal(t, 2048*2048, len(region))

	size := 2048
	img := image.NewRGBA(image.Rect(0, 0, size, size))

	index := 0
	for y := range size {
		for x := range size {
			col := heightmap.EncodeHeightToRGBA(float32(region[index]))
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

	img, err := tiff.DecodeWithPhotometricPatch(data)
	// Assert that the conversion succeeded
	assert.NoError(t, err)

	var pngBuf bytes.Buffer
	err = png.Encode(&pngBuf, img)
	assert.NoError(t, err)
	pngData := pngBuf.Bytes()
	assert.NotNil(t, pngData)

	expectedBytes, err := os.ReadFile("samples/region-16bit-gray.png")
	assert.NoError(t, err)
	assert.Equal(t, expectedBytes, pngData)
	err = utils.WriteFile("samples/generated_region_grayscale.png", pngData)
	assert.NoError(t, err)
}

func TestLoad(t *testing.T) {
	files := []string{
		"samples/region.heightmap",
		// "samples/r_+00_+00/region.heightmap",
		// "samples/r_+00_+01/region.heightmap",
		// "samples/r_+00_+02/region.heightmap",
		// "samples/r_+00_+03/region.heightmap",
		// "samples/r_+00_+04/region.heightmap",
		// "samples/r_+00_+05/region.heightmap",
		// "samples/r_+00_+06/region.heightmap",

		// "samples/r_+01_+00/region.heightmap",
		// "samples/r_+01_+01/region.heightmap",
		// "samples/r_+01_+02/region.heightmap",
		// "samples/r_+01_+03/region.heightmap",
		// "samples/r_+01_+04/region.heightmap",
		// "samples/r_+01_+05/region.heightmap",
		// "samples/r_+01_+06/region.heightmap",

		// "samples/r_+02_+00/region.heightmap",
		// "samples/r_+02_+01/region.heightmap",
		// "samples/r_+02_+02/region.heightmap",
		// "samples/r_+02_+03/region.heightmap",
		// "samples/r_+02_+04/region.heightmap",
		// "samples/r_+02_+05/region.heightmap",
		// "samples/r_+02_+06/region.heightmap",

		// "samples/r_+03_+00/region.heightmap",
		// "samples/r_+03_+01/region.heightmap",
		// "samples/r_+03_+02/region.heightmap",
		// "samples/r_+03_+03/region.heightmap",
		// "samples/r_+03_+04/region.heightmap",
		// "samples/r_+03_+05/region.heightmap",
		// "samples/r_+03_+06/region.heightmap",

		// "samples/r_+04_+00/region.heightmap",
		// "samples/r_+04_+01/region.heightmap",
		// "samples/r_+04_+02/region.heightmap",
		// "samples/r_+04_+03/region.heightmap",
		// "samples/r_+04_+04/region.heightmap",
		// "samples/r_+04_+05/region.heightmap",
		// "samples/r_+04_+06/region.heightmap",

		// "samples/r_+05_+00/region.heightmap",
		// "samples/r_+05_+01/region.heightmap",
		// "samples/r_+05_+02/region.heightmap",
		// "samples/r_+05_+03/region.heightmap",
		// "samples/r_+05_+04/region.heightmap",
		// "samples/r_+05_+05/region.heightmap",
		// "samples/r_+05_+06/region.heightmap",

		// "samples/r_+06_+00/region.heightmap",
		// "samples/r_+06_+01/region.heightmap",
		// "samples/r_+06_+02/region.heightmap",
		// "samples/r_+06_+03/region.heightmap",
		// "samples/r_+06_+04/region.heightmap",
		// "samples/r_+06_+05/region.heightmap",
		// "samples/r_+06_+06/region.heightmap",
	}
	for _, file := range files {
		data, err := os.ReadFile(file)
		assert.NoError(t, err, "Failed to read file: %s", file)
		_, err = heightmap.ParseTIFF(data) // heightmap.LoadFromTiff(data)
		assert.NoError(t, err, "Failed to load heightmap from file: %s", file)
	}
}
