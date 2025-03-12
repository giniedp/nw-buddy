package importer

import "nw-buddy/tools/utils/maps"

type AssetGroup struct {
	Appearance any
	Animations []Animation
	Meshes     []GeometryAsset
	Lights     []LightAsset
	Cameras    []CameraAsset
	Entities   []Entity
	TargetFile string
}

type Animation struct {
	File      string
	Name      string
	DamageIds []string
	Actions   []string
	Meta      map[string]any
}

type Entity struct {
	Name      string
	Transform [16]float32
	Meta      maps.Dict[any]
}

type GeometryAsset struct {
	Entity
	GeometryFile string
	MaterialFile string
	SkipSkin     bool
	SkipGeometry bool
}

type LightAsset struct {
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
