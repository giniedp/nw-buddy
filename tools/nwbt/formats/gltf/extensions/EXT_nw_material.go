package extensions

import (
	"nw-buddy/tools/formats/mtl"

	"github.com/qmuntal/gltf"
)

const EXT_nw_material = "EXT_nw_material"

// ExtNwMaterial is the original mtl of a glTF material (for the game's shaders) and the raw mask and smoothness
// textures (for PBR clients)
type ExtNwMaterial struct {
	Attributes   *mtl.MaterialAttrs  `json:"attrs,omitempty"`
	Textures     []*gltf.TextureInfo `json:"textures,omitempty"`
	Params       *mtl.PublicParams   `json:"params,omitempty"`
	VertexDeform *mtl.VertexDeform   `json:"vertexDeform,omitempty"`

	MaskTexture   *gltf.TextureInfo `json:"maskTexture,omitempty"`
	SmoothTexture *gltf.TextureInfo `json:"smoothTexture,omitempty"`
	VertColors    bool              `json:"vertColors,omitempty"`
}

func (e *ExtNwMaterial) ExtensionName() string {
	return EXT_nw_material
}

// NwMaterial returns the EXT_nw_material of a material, nil without one
func NwMaterial(material *gltf.Material) *ExtNwMaterial {
	if material == nil || material.Extensions == nil {
		return nil
	}
	ext, _ := material.Extensions[EXT_nw_material].(*ExtNwMaterial)
	return ext
}

// EnsureNwMaterial returns the EXT_nw_material of a material, adds an empty one when it has none
func EnsureNwMaterial(material *gltf.Material) *ExtNwMaterial {
	if ext := NwMaterial(material); ext != nil {
		return ext
	}
	if material.Extensions == nil {
		material.Extensions = gltf.Extensions{}
	}
	ext := &ExtNwMaterial{}
	material.Extensions[EXT_nw_material] = ext
	return ext
}
