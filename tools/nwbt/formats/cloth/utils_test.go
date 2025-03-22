package cloth

import (
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTryResolveGeometryReference(t *testing.T) {
	fs, err := nwfs.NewUnpackedArchive("sample")
	assert.NoError(t, err)
	file, ok := fs.Lookup("male_leathert1_skirt.cloth")
	assert.True(t, ok)
	ref, err := TryResolveGeometryReference(file)
	assert.NoError(t, err)
	assert.NotEmpty(t, ref)
	assert.Equal(t, "objects/characters/player/male/leathert1/male_leathert1_skirt.skin", ref)
}
