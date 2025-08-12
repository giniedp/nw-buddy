package dds_test

import (
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadDDS(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("sample/fs")
	assert.NoError(t, err, "creating OSFS")

	files, err := fs.Glob("male_alchemist_calves_diff.dds")
	assert.NoError(t, err)

	image, err := dds.Load(files[0])
	assert.NoError(t, err)
	assert.NotNil(t, image.Data)
	assert.Nil(t, image.Alpha)
}

func TestLoadDDS_Alpha(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("sample/fs")
	assert.NoError(t, err, "creating OSFS")

	files, err := fs.Glob("male_alchemist_calves_ddna.dds")
	assert.NoError(t, err)

	image, err := dds.Load(files[0])
	assert.NoError(t, err)
	assert.NotNil(t, image.Data)
	assert.NotNil(t, image.Alpha)
}

func TestLoadDDS_AlphaOnly(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("sample/fs")
	assert.NoError(t, err, "creating OSFS")

	files, err := fs.Glob("male_alchemist_calves_ddna.dds.a")
	assert.NoError(t, err)

	image, err := dds.Load(files[0])
	assert.NoError(t, err)
	// assert.Nil(t, image.Data)
	assert.NotNil(t, image.Alpha)
}

func TestLoad(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("sample/fs")
	assert.NoError(t, err, "creating OSFS")

	files, err := fs.Glob("male_alchemist_calves_diff.dds")
	assert.NoError(t, err)

	image, err := dds.Load(files[0])
	assert.NoError(t, err)
	assert.NotNil(t, image.Data)
	assert.Nil(t, image.Alpha)

	err = os.WriteFile("sample/male_alchemist_calves_diff.dds", image.Data, 0644)
	assert.NoError(t, err)

	files, err = fs.Glob("male_alchemist_calves_ddna.dds")
	assert.NoError(t, err)

	image, err = dds.Load(files[0])
	assert.NoError(t, err)
	assert.NotNil(t, image.Data)
	assert.NotNil(t, image.Alpha)

	err = os.WriteFile("sample/male_alchemist_calves_ddna.dds", image.Data, 0644)
	assert.NoError(t, err)

	err = os.WriteFile("sample/male_alchemist_calves_ddna.a.dds", image.Alpha, 0644)
	assert.NoError(t, err)
}
