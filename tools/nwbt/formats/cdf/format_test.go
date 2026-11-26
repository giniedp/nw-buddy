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
	assert.Equal(t, "objects/characters/player/male/player_male.chrparams", doc.ChrParamsPath())
}

func TestVisibleAttachments(t *testing.T) {
	// dancingfish.cdf: the outline shell is hidden until game code shows it (FLAGS_ATTACH_HIDE_ATTACHMENT)
	doc, err := cdf.Parse([]byte(`<CharacterDefinition>
 <Model File="objects/x/fish_skel.chr"/>
 <AttachmentList>
  <Attachment Type="CA_SKIN" AName="mesh" Binding="objects/x/fish.skin" Flags="0"/>
  <Attachment Type="CA_SKIN" AName="outline" Binding="objects/x/fish.skin" Flags="1"/>
  <Attachment Type="CA_CLOTH" AName="cape" Binding="objects/x/cape.cloth" Flags="6"/>
 </AttachmentList>
</CharacterDefinition>`))
	assert.NoError(t, err)
	assert.Len(t, doc.SkinAndClothAttachments(), 3)
	visible := doc.VisibleSkinAndClothAttachments()
	assert.Len(t, visible, 2)
	assert.Equal(t, "mesh", visible[0].AName)
	assert.Equal(t, "cape", visible[1].AName)
}

func TestRelTransform(t *testing.T) {
	position, rotation := cdf.Attachment{RelPosition: "1, 2,3", RelRotation: "0.5,0.1,0.2,0.3"}.RelTransform()
	assert.Equal(t, [3]float32{1, 2, 3}, position)
	assert.Equal(t, [4]float32{0.1, 0.2, 0.3, 0.5}, rotation)
	position, rotation = cdf.Attachment{}.RelTransform()
	assert.Equal(t, [3]float32{}, position)
	assert.Equal(t, [4]float32{0, 0, 0, 1}, rotation)
}

func TestChrParamsOverride(t *testing.T) {
	doc, err := cdf.Parse([]byte(`<CharacterDefinition>
 <Model File="Objects/Characters/x/x_skel.chr" ParamsOverride="Objects/Characters/IGC/Scene/Scene_x_skel.chrparams"/>
</CharacterDefinition>`))
	assert.NoError(t, err)
	// the override replaces the skeleton's own animation list
	assert.Equal(t, "objects/characters/igc/scene/scene_x_skel.chrparams", doc.ChrParamsPath())
}
