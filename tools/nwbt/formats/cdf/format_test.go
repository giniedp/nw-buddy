package cdf_test

import (
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad(t *testing.T) {
	archive, err := nwfs.NewUnpackedArchive("sample")
	assert.NoError(t, err)

	file, ok := archive.Lookup("male_leather_seta_t5.cdf")
	assert.True(t, ok)

	doc, err := cdf.Load(file)
	assert.NoError(t, err)

	assert.EqualValues(t, "objects/characters/player/male/player_male.chr", doc.Model.File)
	assert.Len(t, doc.SkinAndClothAttachments(), 7)
}
