package heightmap_test

import (
	"bytes"
	"image"
	"image/png"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/tiff"
	"nw-buddy/tools/utils"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/HugoSmits86/nativewebp"
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
		"samples/r_+03_+02/region.heightmap",
		"samples/r_+03_+05/region.heightmap",
	}
	for _, file := range files {
		data, err := os.ReadFile(file)
		assert.NoError(t, err, "Failed to read file: %s", file)
		_, err = heightmap.LoadFromTiff(data)
		assert.NoError(t, err, "Failed to load heightmap from file: %s", file)
	}
}

func TestSaveAsPNG(t *testing.T) {
	files := []string{
		"samples/region.heightmap",
		"samples/r_+03_+02/region.heightmap",
		"samples/r_+03_+05/region.heightmap",
	}
	for _, file := range files {
		t.Run(file, func(t *testing.T) {
			data, err := os.ReadFile(file)
			assert.NoError(t, err, "Failed to read file")
			if err != nil {
				return
			}

			imgData, err := tiff.DecodeWithPhotometricPatch(data)
			assert.NoError(t, err, "Failed to load heightmap")
			if err != nil {
				return
			}

			// --- Save as PNG ---
			pngOutPath := strings.TrimSuffix(file, filepath.Ext(file)) + ".png"
			pngFile, err := os.Create(pngOutPath)
			assert.NoError(t, err, "Failed to create PNG output file: %s", pngOutPath)
			if err == nil {
				defer pngFile.Close()
				err = png.Encode(pngFile, imgData)
				assert.NoError(t, err, "Failed to encode PNG: %s", pngOutPath)
			}

			// --- Save as WebP ---
			webpOutPath := strings.TrimSuffix(file, filepath.Ext(file)) + ".webp"
			webpFile, err := os.Create(webpOutPath)
			assert.NoError(t, err, "Failed to create WebP output file: %s", webpOutPath)
			if err == nil {
				defer webpFile.Close()
				// Use default options (lossless) for encoding
				err = nativewebp.Encode(webpFile, imgData, nil)
				assert.NoError(t, err, "Failed to encode WebP: %s", webpOutPath)
			}
		})
	}
}
