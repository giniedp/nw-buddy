package importer

type AssetGroup struct {
	TargetFile string
	Animations []AnimationAsset // caf files
	Geometries []GeometryAsset  // cgf + mtl files
	Materials  []string         // mtl files only
	Lights     []LightAsset
	Cameras    []CameraAsset
	Entities   []Entity
	Extra      map[string]any
	// Pose sets the local transforms of the skeleton's joints by controller id: translation xyz and rotation xyzw in
	// the coordinates of the export (e.g. y-up), as a viewer posed them
	Pose map[uint32][7]float32
}

type AnimationAsset struct {
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
	OvercoatFile          string // the material the geometry is drawn with a second time
	Joint                 string // the joint the geometry is attached to, its transform is relative to it
	SkipSkin              bool
	SkipGeometry          bool
	OverrideMaterialIndex *int
	// MaterialParams override the public params of the geometry's materials (e.g. the colors of an armor appearance
	// and its dyes), the materials are copies then
	MaterialParams map[string]string
}

type LightAsset struct {
	Entity
	Type           int
	Color          [3]float32
	Intensity      float32
	InnerConeAngle float32
	OuterConeAngle float32
	Range          float32
	// written to the extras of the glTF light
	Extras map[string]any
}

type CameraAsset struct {
	ZNear float32
	ZFar  float32
	Fov   float32
}
