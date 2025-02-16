package dds_test

import (
	"nw-buddy/tools/nw-kit/formats/dds"
	"nw-buddy/tools/nw-kit/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFindSplits(t *testing.T) {
	fs, err := nwfs.NewUnpackedFS("sample/fs")
	assert.NoError(t, err, "creating OSFS")

	files, err := fs.Glob("male_alchemist_calves_diff.dds")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(files))

	splits, err := dds.FindSplits(files[0])
	assert.NoError(t, err)
	assert.Equal(t, files[0], splits.Base.Header)
	assert.Equal(t, 7, len(splits.Base.Files))
	assert.Nil(t, splits.Alpha.Header)
	assert.Nil(t, splits.Alpha.Files)

	files, err = fs.Glob("male_alchemist_calves_ddna.dds")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(files))

	splits, err = dds.FindSplits(files[0])
	assert.NoError(t, err)
	assert.Equal(t, files[0], splits.Base.Header)
	assert.Equal(t, 7, len(splits.Base.Files))
	assert.NotNil(t, splits.Alpha.Header)
	assert.Equal(t, 7, len(splits.Alpha.Files))
}
