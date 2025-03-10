package dds_test

import (
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFindSplits(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("sample/fs")
	assert.NoError(t, err)

	files, err := fs.Glob("male_alchemist_calves_diff.dds")
	assert.NoError(t, err)
	assert.Len(t, files, 1)

	splits, err := dds.FindSplits(files[0])
	assert.NoError(t, err)
	assert.Equal(t, files[0], splits.Base.Header, "first file should be base file")
	assert.Len(t, splits.Base.Files, 7, "should have split files")
	assert.Nil(t, splits.Alpha.Header, "shouldn't have alpha header")
	assert.Nil(t, splits.Alpha.Files, "shouldn't have alpha files")

	files, err = fs.Glob("male_alchemist_calves_ddna.dds")
	assert.NoError(t, err)
	assert.Len(t, files, 1)

	splits, err = dds.FindSplits(files[0])
	assert.NoError(t, err)
	assert.Equal(t, files[0], splits.Base.Header)
	assert.Len(t, splits.Base.Files, 7)
	assert.NotNil(t, splits.Alpha.Header)
	assert.Len(t, splits.Alpha.Files, 7)
}
