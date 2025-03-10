package nwfs_test

import (
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewUnpackedFS(t *testing.T) {
	// with root dir
	fs, err := nwfs.NewUnpackedArchive("sample")
	assert.NoError(t, err, "creating OSFS")
	files, err := fs.List()
	assert.NoError(t, err, "listing files")
	assert.Len(t, files, 3)

	files, err = fs.Glob("**.txt")
	assert.NoError(t, err, "globbing files")
	assert.Len(t, files, 3)

	files, err = fs.Glob("foo/file1.txt")
	assert.NoError(t, err)
	assert.Len(t, files, 1)

	files, err = fs.Glob("bar/file2.txt")
	assert.NoError(t, err)
	assert.Len(t, files, 1)

	files, err = fs.Glob("bar/baz/file3.txt")
	assert.NoError(t, err)
	assert.Len(t, files, 1)

	// without root dir
	fs, err = nwfs.NewUnpackedArchive("")
	assert.NoError(t, err, "creating OSFS")

	files, err = fs.Glob("foo/file1.txt")
	assert.NoError(t, err)
	assert.Empty(t, files)

	files, err = fs.Glob("sample/foo/file1.txt")
	assert.NoError(t, err)
	assert.Len(t, files, 1)

	// with prefix
	fs, err = nwfs.NewUnpackedArchive(
		"sample",
		nwfs.WithVirtualPath("virtual/path"),
	)
	assert.NoError(t, err)

	files, err = fs.Glob("foo/file1.txt")
	assert.NoError(t, err)
	assert.Empty(t, files)

	files, err = fs.Glob("virtual/path/foo/file1.txt")
	assert.NoError(t, err)
	assert.Len(t, files, 1)
}
