package gltf_test

import (
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/mtl"
	"testing"

	qgltf "github.com/qmuntal/gltf"

	"github.com/stretchr/testify/require"
)

// materials/decals/invasive/textures/human_footprints_a_ddna.dds
// materials/decals/invasive/textures/human_footprints_a_ddna.dds.a
func TestLoadImageBytes(t *testing.T) {
	// assets, err := game.InitPackedAssets(env.GameDir())
	// require.NoError(t, err)

	// linker := gltf.NewResourceLinker("sample")
	// linker.SetRelativeMode(false)
	// linker.SkipWrite(true)

	// doc := gltf.NewDocument()
	// doc.ImageLinker = linker
	// doc.ImageLoader = image.LoaderWithConverter{
	// 	Archive: assets.Archive,
	// 	Catalog: assets.Catalog,
	// 	Converter: image.BasicConverter{
	// 		Format:  ".png",
	// 		TempDir: "sample",
	// 		Silent:  true,
	// 	},
	// }
}

func ptr[T any](v T) *T {
	return &v
}

func TestLoadOrStoreSampler(t *testing.T) {
	d := gltf.NewDocument()

	index := d.LoadOrStoreSampler(nil)
	require.Nil(t, index)
	require.Empty(t, d.Samplers)

	// do not create for gltf default values
	tex := &mtl.Texture{
		Filter: ptr(mtl.TextureFilterLinear),
	}
	index = d.LoadOrStoreSampler(tex)
	require.Nil(t, index)
	require.Empty(t, d.Samplers)

	// create for non-default values
	tex = &mtl.Texture{
		Filter: ptr(mtl.TextureFilterPoint),
	}
	index = d.LoadOrStoreSampler(tex)
	require.NotNil(t, index)
	require.Len(t, d.Samplers, 1)

	// do not create twice for same values
	tex = &mtl.Texture{
		Filter: ptr(mtl.TextureFilterPoint),
	}
	index = d.LoadOrStoreSampler(tex)
	require.NotNil(t, index)
	require.Len(t, d.Samplers, 1)
	require.Equal(t, d.Samplers[0].MinFilter, qgltf.MinNearest)
	require.Equal(t, d.Samplers[0].MagFilter, qgltf.MagNearest)

	d = gltf.NewDocument()
	tex = &mtl.Texture{
		IsTileU: ptr(mtl.TextureTileOn),
	}
	index = d.LoadOrStoreSampler(tex)
	require.Nil(t, index)
	require.Empty(t, d.Samplers)

	tex = &mtl.Texture{
		IsTileU: ptr(mtl.TextureTileOff),
	}
	index = d.LoadOrStoreSampler(tex)
	require.NotNil(t, index)
	require.Len(t, d.Samplers, 1) // sampler created

	tex = &mtl.Texture{
		IsTileV: ptr(mtl.TextureTileOn),
	}
	index = d.LoadOrStoreSampler(tex)
	require.Nil(t, index)
	require.Len(t, d.Samplers, 1) // still same sampler count

	tex = &mtl.Texture{
		IsTileV: ptr(mtl.TextureTileOff),
	}
	index = d.LoadOrStoreSampler(tex)
	require.NotNil(t, index)
	require.Len(t, d.Samplers, 2) // new sampler created
}
