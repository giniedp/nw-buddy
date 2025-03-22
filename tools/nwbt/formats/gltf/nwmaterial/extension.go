package nwmaterial

import "github.com/qmuntal/gltf"

const (
	ExtensionName = "EXT_nw_material"
)

type Extension struct {
	MaskTexture *gltf.TextureInfo `json:"maskTexture,omitempty"`
	Params      *Appearance       `json:"params,omitempty"`
}
