package cgf_test

import (
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	_ "nw-buddy/tools/utils/env"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRead_MusiDrumDrum(t *testing.T) {

	tests := [][2]string{
		{
			"sample/season_07/buff_leaderboards_season7_t1.cgf",
			"sample/season_07/buff_leaderboards_season7_t1_mat.mtl",
		},
		{
			"sample/season_07/buff_special_season7_t1.cgf",
			"sample/season_07/buff_special_season7_t1_mat.mtl",
		},
	}

	for _, input := range tests {

		cgfData, err := os.ReadFile(input[0])
		assert.NoError(t, err)

		model, err := cgf.Parse(cgfData)
		assert.NoError(t, err)

		mtlData, err := os.ReadFile(input[1])
		assert.NoError(t, err)

		materials, err := mtl.Parse(mtlData)
		assert.NoError(t, err)

		archive, err := nwfs.NewUnpackedArchive(
			"sample",
			nwfs.WithVirtualPath("objects/housing"),
		)
		assert.NoError(t, err)

		converter := gltf.NewConverter()
		converter.ImageLoader = image.LoaderWithConverter{
			Archive:   archive,
			Converter: image.BasicConverter{},
		}
		converter.ImportCgf(model, materials.Collection())
		converter.ImportCgfMaterials()

		err = converter.Save(utils.ReplaceExt(input[0], ".gltf"))
		assert.NoError(t, err)
	}
}
