package importer

type AssetGroup struct {
	TargetFile string
	Animations []Animation
	Meshes     []GeometryAsset
	Lights     []LightAsset
	Cameras    []CameraAsset
	Entities   []Entity
	Extra      map[string]any
}

type Animation struct {
	File string `json:"file"`
	Name string `json:"name"`
}

type Entity struct {
	Name      string
	Transform [16]float32
	Extra     map[string]any
}

type GeometryAsset struct {
	Entity
	GeometryFile          string
	MaterialFile          string
	SkipSkin              bool
	SkipGeometry          bool
	OverrideMaterialIndex *int
}

type LightAsset struct {
	Entity
	Type           int
	Color          [3]float32
	Intensity      float32
	InnerConeAngle float32
	OuterConeAngle float32
	Range          float32
}

type CameraAsset struct {
	ZNear float32
	ZFar  float32
	Fov   float32
}
