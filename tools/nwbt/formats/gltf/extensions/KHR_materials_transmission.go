package extensions

import "github.com/qmuntal/gltf"

const (
	KHR_materials_transmission = "KHR_materials_transmission"
)

type KHRMaterialsTransmission struct {
	Factor  float64           `json:"transmissionFactor"`
	Texture *gltf.TextureInfo `json:"transmissionTexture,omitempty"`
}
