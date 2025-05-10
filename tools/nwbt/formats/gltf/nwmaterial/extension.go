package nwmaterial

import "github.com/qmuntal/gltf"

const (
	ExtensionName = "EXT_nw_material"
)

type Extension struct {
	MaskTexture   *gltf.TextureInfo `json:"maskTexture,omitempty"`
	SmoothTexture *gltf.TextureInfo `json:"smoothTexture,omitempty"`
	Params        *Appearance       `json:"params,omitempty"`
	VertColors    bool              `json:"vertColors,omitempty"`
}
