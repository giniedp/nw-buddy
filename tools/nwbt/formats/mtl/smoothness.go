package mtl

import (
	"regexp"
	"strings"
)

// normalMapSmoothness pairs a normal map slot with the smoothness slot that takes its attached alpha: the normal map
// (EFTT_NORMALS) and the normal map of the blend layer (EFTT_CUSTOM_SECONDARY)
var normalMapSmoothness = [][2]TexMap{
	{MtlMap_Bumpmap, MtlMap_Smoothness},
	{MtlMap_1_Custom, MtlMap_SecondSmoothness},
}

// attachedAlphaPattern matches the normal maps with smoothness in an attached alpha (`x_ddna.dds.a`)
var attachedAlphaPattern = regexp.MustCompile(`_ddna(_lod\d+)?\.(dds|tif)$`)

// HasAttachedAlpha tells whether a texture file is a normal map with smoothness in its attached alpha (`_ddna`)
func HasAttachedAlpha(file string) bool {
	return attachedAlphaPattern.MatchString(strings.ToLower(file))
}

// WithNormalMapSmoothness returns the texture slots as the engine binds them: a normal map with an attached alpha
// (`_ddna`) gives the smoothness, also when the material names no smoothness texture or another one. The slot keeps
// its own settings (tiling, TexMod).
//
// Lumberyard ShaderTemplate.cpp ("Support for gloss in regular normal map"), the same rule as the viewer's
// withNormalMapSmoothness (apps/viewer/src/formats/mtl/loader.ts).
func WithNormalMapSmoothness(textures []Texture) []Texture {
	result := append([]Texture{}, textures...)
	for _, pair := range normalMapSmoothness {
		normal := findTexture(textures, pair[0])
		if normal == nil || !HasAttachedAlpha(normal.File) {
			continue
		}
		index := -1
		for i := range result {
			if result[i].Map == pair[1] {
				index = i
				break
			}
		}
		if index < 0 {
			result = append(result, Texture{Map: pair[1], File: normal.File, AssetId: normal.AssetId})
			continue
		}
		result[index].File = normal.File
		result[index].AssetId = normal.AssetId
	}
	return result
}

func findTexture(textures []Texture, slot TexMap) *Texture {
	for i := range textures {
		if textures[i].Map == slot {
			return &textures[i]
		}
	}
	return nil
}
