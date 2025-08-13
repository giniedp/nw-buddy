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

		_, err = cgf.Parse(cgfData)
		assert.NoError(t, err)

		mtlData, err := os.ReadFile(input[1])
		assert.NoError(t, err)

		_, err = mtl.Parse(mtlData)
		assert.NoError(t, err)

		archive, err := nwfs.NewUnpackedArchive(
			"sample",
			nwfs.WithVirtualPath("objects/housing"),
		)
		assert.NoError(t, err)

		converter := gltf.NewDocument()
		converter.ImageLoader = image.LoaderWithConverter{
			Archive:   archive,
			Converter: image.BasicConverter{},
		}
		// converter.ImportGeometry(importer.GeometryAsset{
		// 	GeometryFile: input[0],
		// 	MaterialFile: input[1],
		// }, func(mesh importer.GeometryAsset) (*cgf.File, []mtl.Material) {
		// 	modelFile, _ := archive.Lookup(mesh.GeometryFile)
		// 	model, _ := cgf.Load(modelFile)
		// 	mtlFile, _ := archive.Lookup(mesh.MaterialFile)
		// 	material, _ := mtl.Load(mtlFile)
		// 	return model, material.Collection()
		// })
		converter.ImportCgfMaterials(gltf.WithTextureBaking(true))
		converter.TargetFile = utils.ReplaceExt(input[0], ".gltf")

		err = converter.Save()
		assert.NoError(t, err)
	}
}

func TestRead_HorseIdle(t *testing.T) {
	cgfData, err := os.ReadFile("sample/horse_idle.caf")
	assert.NoError(t, err)

	doc, err := cgf.Parse(cgfData)
	assert.NoError(t, err)

	ctrl := cgf.SelectChunks[cgf.ChunkController](doc)
	assert.Len(t, ctrl, 52)
}
