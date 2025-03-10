package chrparams_test

import (
	"nw-buddy/tools/formats/chrparams"
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad(t *testing.T) {
	archive, err := nwfs.NewUnpackedArchive("sample")
	assert.NoError(t, err)

	file, ok := archive.Lookup("npc_skel.chrparams")
	assert.True(t, ok)

	doc, err := chrparams.Load(file)
	assert.NoError(t, err)

	assert.Len(t, doc.AnimationIncludePaths(), 2)
	assert.Len(t, doc.AnimationGlobPaths(), 93)
}
