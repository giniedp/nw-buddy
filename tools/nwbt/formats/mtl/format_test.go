package mtl_test

import (
	"encoding/json"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils/math"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	data, err := os.ReadFile("sample/male_alchemist_chest_matgroup.mtl")
	assert.NoError(t, err)

	doc, err := mtl.Parse(data)
	assert.NoError(t, err)

	assert.Equal(t, 524544, *doc.MtlFlags)
	assert.NotNil(t, doc.Params)
	assert.Equal(t, 3, doc.Params.Len())
	assert.Equal(t, "0", doc.Params.Get("SSSIndex"))
	assert.Equal(t, "0.25,0.25,0.25,0.25", doc.Params.Get("IndirectColor"))
}

func TestParseDeform(t *testing.T) {
	data, err := os.ReadFile("sample/jav_prp_cloth_tattered_d.mtl")
	assert.NoError(t, err)

	doc, err := mtl.Parse(data)
	assert.NoError(t, err)

	assert.NotNil(t, doc.VertexDeform)
	assert.Equal(t, 2, doc.VertexDeform.Type)
	assert.Equal(t, float32(4.0), doc.VertexDeform.DividerX)
	assert.Equal(t, float32(0.01), doc.VertexDeform.DividerY)
	assert.Equal(t, math.Float32List{3, 3, 3}, doc.VertexDeform.NoiseScale)
	assert.Equal(t, 1, doc.VertexDeform.WaveX.Type)
	assert.Equal(t, float32(0.3), doc.VertexDeform.WaveX.Amp)
	assert.Equal(t, float32(0), doc.VertexDeform.WaveX.Level)
	assert.Equal(t, float32(0), doc.VertexDeform.WaveX.Phase)
	assert.Equal(t, float32(1), doc.VertexDeform.WaveX.Freq)
}

func TestTextureSerialize(t *testing.T) {
	{
		tex := mtl.Texture{}
		data, err := json.Marshal(tex)
		assert.NoError(t, err)
		value := string(data)
		assert.Equal(t, "{}", value)
	}

	{
		tex := mtl.Texture{
			Filter: ptr[mtl.TextureFilter](0),
		}
		data, err := json.Marshal(tex)
		assert.NoError(t, err)
		value := string(data)
		assert.Equal(t, "{\"Filter\":0}", value)
	}

	{
		tex := mtl.Texture{
			IsTileU: ptr[mtl.TextureTile](0),
		}
		data, err := json.Marshal(tex)
		assert.NoError(t, err)
		value := string(data)
		assert.Equal(t, "{\"IsTileU\":0}", value)
	}

	{
		tex := mtl.Texture{
			IsTileV: ptr[mtl.TextureTile](0),
		}
		data, err := json.Marshal(tex)
		assert.NoError(t, err)
		value := string(data)
		assert.Equal(t, "{\"IsTileV\":0}", value)
	}
}

func ptr[T any](v T) *T {
	return &v
}

func TestIsShadowProxy(t *testing.T) {
	allExceptNoShadow := -1 ^ int(mtl.MTL_FLAG_NOSHADOW)

	e := mtl.Material{
		MaterialAttrs: mtl.MaterialAttrs{
			Opacity:  ptr[float32](0),
			MtlFlags: ptr(allExceptNoShadow),
			Shader:   "Illum",
		},
	}
	assert.True(t, e.IsShadowProxy())

	e.MaterialAttrs.Opacity = ptr[float32](1) // change
	e.MaterialAttrs.MtlFlags = ptr(0)
	e.MaterialAttrs.Shader = "Illum"
	assert.False(t, e.IsShadowProxy())

	e.MaterialAttrs.Opacity = ptr[float32](0)
	e.MaterialAttrs.MtlFlags = ptr(allExceptNoShadow | mtl.MTL_FLAG_NOSHADOW) // change
	e.MaterialAttrs.Shader = "Illum"
	assert.False(t, e.IsShadowProxy())

	e.MaterialAttrs.Opacity = ptr[float32](0)
	e.MaterialAttrs.MtlFlags = ptr(0)
	e.MaterialAttrs.Shader = "Other" // change

	assert.False(t, e.IsShadowProxy())
}
