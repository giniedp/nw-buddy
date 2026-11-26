package image_test

import (
	"nw-buddy/tools/formats/image"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConvert(t *testing.T) {
	outDir := t.TempDir()
	for _, sample := range []struct {
		name      string
		normalMap bool
	}{
		{"loadingimageancient02", false},
		{"bannerachievementrunec", false},
		{"fish_ddna", true},
		{"fish_diff", false},
	} {
		data, err := os.ReadFile("./sample/" + sample.name + ".dds")
		assert.NoError(t, err, "reading sample")

		png, err := image.ConvertDDS(data, image.FormatPNG, image.WithNormalMap(sample.normalMap))
		assert.NoError(t, err, "converting to PNG")
		os.WriteFile(filepath.Join(outDir, sample.name+".png"), png, os.ModePerm)

		webp, err := image.ConvertDDS(data, image.FormatWEBP, image.WithNormalMap(sample.normalMap))
		assert.NoError(t, err, "converting to WEBP")
		os.WriteFile(filepath.Join(outDir, sample.name+".webp"), webp, os.ModePerm)
	}
}
