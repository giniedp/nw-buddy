package image_test

import (
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/utils/env"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConvert(t *testing.T) {

	binDir, err := filepath.Abs("../../../bin")
	assert.NoError(t, err, "build bin dir")
	env.AppendToPATH(binDir)

	tmpDir, err := filepath.Abs("./tmp")
	assert.NoError(t, err, "build tmp dir")
	os.MkdirAll(tmpDir, 0755)

	data, err := os.ReadFile("./sample/loadingimageancient02.dds")
	assert.NoError(t, err, "reading sample")

	png, err := image.ConvertDDS(data, image.FormatPNG, image.WithTempDir(tmpDir))
	assert.NoError(t, err, "converting to PNG")
	os.WriteFile("./sample/loadingimageancient02.png", png, os.ModePerm)

	webp, err := image.ConvertDDS(data, image.FormatWEBP, image.WithTempDir(tmpDir))
	assert.NoError(t, err, "converting to WEBP")
	os.WriteFile("./sample/loadingimageancient02.webp", webp, os.ModePerm)

	data, err = os.ReadFile("./sample/bannerachievementrunec.dds")
	assert.NoError(t, err, "reading sample")

	png, err = image.ConvertDDS(data, image.FormatPNG, image.WithTempDir(tmpDir))
	assert.NoError(t, err, "converting to PNG")
	os.WriteFile("./sample/bannerachievementrunec.png", png, os.ModePerm)

	webp, err = image.ConvertDDS(data, image.FormatWEBP, image.WithTempDir(tmpDir))
	assert.NoError(t, err, "converting to WEBP")
	os.WriteFile("./sample/bannerachievementrunec.webp", webp, os.ModePerm)

	data, err = os.ReadFile("./sample/fish_ddna.dds")
	assert.NoError(t, err, "reading sample")

	png, err = image.ConvertDDS(data, image.FormatPNG, image.WithTempDir(tmpDir), image.WithNormalMap(true))
	assert.NoError(t, err, "converting to PNG")
	os.WriteFile("./sample/fish_ddna.png", png, os.ModePerm)

	webp, err = image.ConvertDDS(data, image.FormatWEBP, image.WithTempDir(tmpDir), image.WithNormalMap(true))
	assert.NoError(t, err, "converting to WEBP")
	os.WriteFile("./sample/fish_ddna.webp", webp, os.ModePerm)

	data, err = os.ReadFile("./sample/fish_diff.dds")
	assert.NoError(t, err, "reading sample")

	png, err = image.ConvertDDS(data, image.FormatPNG, image.WithTempDir(tmpDir))
	assert.NoError(t, err, "converting to PNG")
	os.WriteFile("./sample/fish_diff.png", png, os.ModePerm)

	webp, err = image.ConvertDDS(data, image.FormatWEBP, image.WithTempDir(tmpDir))
	assert.NoError(t, err, "converting to WEBP")
	os.WriteFile("./sample/fish_diff.webp", webp, os.ModePerm)
}
