package dds_test

import (
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadMeta(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("sample/fs")
	assert.NoError(t, err, "creating OSFS")

	files, err := fs.Glob("male_alchemist_calves_diff.dds")
	assert.NoError(t, err)

	_, err = dds.LoadMeta(files[0])
	assert.NoError(t, err)

	files, err = fs.Glob("male_alchemist_calves_ddna.dds")
	assert.NoError(t, err)

	_, err = dds.LoadMeta(files[0])
	assert.NoError(t, err)
}
