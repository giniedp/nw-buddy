package nwfs_test

import (
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewOSFS(t *testing.T) {
	fs, err := nwfs.NewUnpackedFS("sample")
	assert.NoError(t, err, "creating OSFS")
	files, err := fs.List()
	assert.NoError(t, err, "listing files")
	assert.Equal(t, 3, len(files))

	files, err = fs.Glob("**.txt")
	assert.NoError(t, err, "globbing files")
	assert.Equal(t, 3, len(files))

	files, err = fs.Glob("foo/file1.txt")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(files))

	files, err = fs.Glob("bar/file2.txt")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(files))

	files, err = fs.Glob("bar/baz/file3.txt")
	assert.NoError(t, err)
	assert.Equal(t, 1, len(files))
}
