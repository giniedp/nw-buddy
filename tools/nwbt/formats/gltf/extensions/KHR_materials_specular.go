package extensions

import (
	"github.com/qmuntal/gltf"
)

const KHR_materials_specular = "KHR_materials_specular"

type KHRMaterialsSpecular struct {
	SpecularFactor       *float64          `json:"specularFactor,omitempty"`
	SpecularTexture      *gltf.TextureInfo `json:"specularTexture,omitempty"`
	SpecularColorFactor  *[3]float64       `json:"specularColorFactor,omitempty"`
	SpecularColorTexture *gltf.TextureInfo `json:"specularColorTexture,omitempty"`
}
