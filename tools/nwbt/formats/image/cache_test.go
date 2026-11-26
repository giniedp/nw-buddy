package image

import (
	"nw-buddy/tools/nwfs"
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/require"
)

func writeSourceFiles(t *testing.T, dir string, files map[string]string) nwfs.Archive {
	for name, content := range files {
		require.NoError(t, os.WriteFile(path.Join(dir, name), []byte(content), 0644))
	}
	archive, err := nwfs.NewUnpackedArchive(dir)
	require.NoError(t, err)
	return archive
}

func TestCacheKeyedBySourceContent(t *testing.T) {
	sourceDir := t.TempDir()
	cache := NewCache(t.TempDir(), string(FormatKTX2))

	archive := writeSourceFiles(t, sourceDir, map[string]string{
		"tex.dds":   "header",
		"tex.dds.1": "mip",
		"tex.dds.a": "alpha header",
	})
	file, ok := archive.Lookup("tex.dds")
	require.True(t, ok)
	alphaFile, ok := archive.Lookup("tex.dds.a")
	require.True(t, ok)

	_, ok = cache.Load(file)
	require.False(t, ok)

	cache.Save(file, &LoadedImage{Data: []byte("data"), Alpha: []byte("alpha")})
	loaded, ok := cache.Load(file)
	require.True(t, ok)
	require.Equal(t, "data", string(loaded.Data))
	require.Equal(t, "alpha", string(loaded.Alpha))
	require.Equal(t, FormatKTX2, loaded.Format)
	require.Equal(t, "tex.dds", loaded.Source)

	// a split part is its DDS
	loaded, ok = cache.Load(alphaFile)
	require.True(t, ok)
	require.Equal(t, "data", string(loaded.Data))

	// a changed mip is a new entry (a new archive: the hashes are memoized per archive)
	archive = writeSourceFiles(t, sourceDir, map[string]string{"tex.dds.1": "patched mip"})
	file, ok = archive.Lookup("tex.dds")
	require.True(t, ok)
	_, ok = cache.Load(file)
	require.False(t, ok)
}
