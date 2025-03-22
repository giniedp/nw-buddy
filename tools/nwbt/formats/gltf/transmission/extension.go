package transmission

import "github.com/qmuntal/gltf"

const (
	ExtensionName = "KHR_materials_transmission"
)

type Extension struct {
	Factor  float64           `json:"transmissionFactor"`
	Texture *gltf.TextureInfo `json:"transmissionTexture,omitempty"`
}
