package level

import (
	"nw-buddy/tools/formats/mission"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

type LevelListEntry struct {
	Name           string   `json:"name"`
	CoatlicueNames []string `json:"coatlicueNames"`
}

type CoatlicueListEntry struct {
	Name  string        `json:"name"`
	Level string        `json:"level"`
	Maps  []GameModeMap `json:"maps"`
}

type LevelIndex struct {
	Levels     []LevelListEntry     `json:"levels"`
	Coatlicues []CoatlicueListEntry `json:"coatlicues"`
}

type Vec2 struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
}

type Vec3 struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
	Z float32 `json:"z"`
}

type CoatlicueInfo struct {
	Level              string            `json:"level"`              // related level folder name, may be nested
	Name               string            `json:"name"`               // coatlicue folder name, never nested
	RegionSize         int               `json:"regionSize"`         // from [coatlicue]/tracts.json, usually 2048
	RegionCellSize     int               `json:"regionCellSize"`     // from [coatlicue]/offlineoptions.json,  usually 128
	EnableChunks       bool              `json:"enableChunks"`       // from [coatlicue]/offlineoptions.json
	EnableVegetation   bool              `json:"enableVegetation"`   // from [coatlicue]/offlineoptions.json
	EnableDistribution bool              `json:"enableDistribution"` // from [coatlicue]/offlineoptions.json
	MountainHeight     float32           `json:"mountainHeight"`     // from [coatlicue]/terrain.json
	MountainRoughness  float32           `json:"mountainRoughness"`  // from [coatlicue]/terrain.json
	OceanLevel         float32           `json:"oceanLevel"`         // from [coatlicue]/terrain.json
	ValleyIntensity    float32           `json:"valleyIntensity"`    // from [coatlicue]/terrain.json
	Tracts             *tracts.Document  `json:"tracts"`             // from [coatlicue]/tracts.json
	Regions            []RegionLocation  `json:"regions"`            // from world.json and playable.json
	GameModeMaps       []GameModeMap     `json:"gameModeMaps"`       // from datasheets, all maps referencing this level/coatlicue
	Mission            *mission.Document `json:"mission"`            // from [level]/mission_mission0.xml
	MissionEntities    []ViewerEntity    `json:"missionEntities"`    // from [level]/mission0.entities_xml
}

type GameModeMap struct {
	GameModeMapId      string   `json:"gameModeMapId"`
	GameModeId         string   `json:"gameModeId"`
	SlicePath          string   `json:"slicePath"`
	CoatlicueName      string   `json:"coatlicueName"`
	WorldBounds        []string `json:"worldBounds"`
	TeamTeleportData   string   `json:"teamTeleportData"`
	UIMapId            string   `json:"uiMapId"`
	SliceExclusionList []string `json:"sliceExclusionList"`
}

type RegionLocation struct {
	ID       string `json:"name"`     // folder base name, e.g. "r_+00_+00" (or r_+xx_+yy)
	Location [2]int `json:"location"` // grid location, e.g. [0,0], [1,0], [2,0] etc. first value is X, second is Y
	Playable bool   `json:"playable"` // from playable.json
}

type RegionInfo struct {
	ID              string           `json:"name"`
	PoiImpostors    []RegionImpostor `json:"poiImpostors"` // from impostros.json
	Impostors       []RegionImpostor `json:"impostors"`    // from poi_impostors.json
	TerrainMaterial *RegionMaterial  `json:"terrainMaterial"`
}

type RegionImpostor struct {
	Position Vec2   `json:"position"`
	Model    string `json:"model"`
}

type RegionMaterial struct {
	TileX                   int                   `json:"tileX"`
	TileY                   int                   `json:"tileY"`
	DefaultMaterial         nwfs.File             `json:"defaultMaterial"`
	NormalMap               nwfs.File             `json:"normalMap"`
	ColorMap                nwfs.File             `json:"colorMap"`
	GlossMap                nwfs.File             `json:"specularMap"`
	Layers                  []RegionMaterialLayer `json:"layers"`
	PertinentLayersMipChain []string              `json:"pertinentLayersMipChain"`
}

type RegionMaterialLayer struct {
	Material      nwfs.File `json:"material"`
	SplatMap      nwfs.File `json:"splatMap"`
	AffectedTiles string    `json:"affectedTiles"`
	Priority      int       `json:"priority"`
}

type CapitalRuntimeData struct {
	ID        string         `json:"id"`
	Transform mat4.Data      `json:"transform"`
	Radius    float32        `json:"radius"`
	Slice     AssetReference `json:"slice"`
}

type ChunkRuntimeData struct {
	ID        string    `json:"id"`
	Transform mat4.Data `json:"transform"`
	Size      float32   `json:"size"`
	// Stream margin input: the game uses margin = spawnRadius - size, clamped to >= 0 for mesh chunks smaller than 128, otherwise to >= 25
	SpawnRadius float32 `json:"spawnRadius"`
	// 0: static, 1: mesh, 2: collision
	ChunkType int32          `json:"chunkType"`
	Slice     AssetReference `json:"slice"`
}

type EntityInfo struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	File            string          `json:"file"`
	Transform       mat4.Data       `json:"transform"`
	Model           string          `json:"model,omitempty"`
	ModelInstance   int             `json:"modelInstance,omitempty"`
	Material        string          `json:"material,omitempty"`
	Instances       []mat4.Data     `json:"instances,omitempty"`
	Light           *LightInfo      `json:"light,omitempty"`
	Vital           *VitalSpawnInfo `json:"vital,omitempty"`
	Encounter       string          `json:"encounter,omitempty"`
	EncounterName   string          `json:"encounterName,omitempty"`
	MaxViewDistance float32         `json:"maxViewDistance,omitempty,omitzero"`
	Options         any             `json:"options"`
	Layer           string          `json:"layer,omitempty"`
}

type VitalSpawnInfo struct {
	VitalsID      string   `json:"vitalsId"`
	CategoryID    string   `json:"categoryId"`
	Level         int      `json:"level"`
	DamageTable   string   `json:"damageTable"`
	Tags          []string `json:"tags"`
	AdbFile       string   `json:"adbFile"`
	StatusEffects []string `json:"statusEffects"`
}

type LightInfo struct {
	Type              uint             `json:"type"`
	Color             [4]nwt.AzFloat32 `json:"color"`
	DiffuseIntensity  float32          `json:"diffuseIntensity"`
	SpecularIntensity float32          `json:"specularIntensity"`
	PointDistance     float32          `json:"pointDistance"`
	PointAttenuation  float32          `json:"pointAttenuation"`
}

// RegionDistributionData is the header of a reduced region.distribution file.
// Instance data is served separately as binary, see RegionDirectory.LoadDistribution
type RegionDistributionData struct {
	Region    [2]uint32          `json:"region"`
	Count     int                `json:"count"`     // number of instances in the binary buffer
	Models    []string           `json:"models"`    // interned model paths
	Materials []string           `json:"materials"` // interned material paths
	Types     []DistributionType `json:"types"`
}

type DistributionType struct {
	Slice   string             `json:"slice"`
	Variant string             `json:"variant,omitempty"`
	Meshes  []DistributionMesh `json:"meshes"`
}

type DistributionMesh struct {
	Model           int        `json:"model"`               // index into RegionDistributionData.Models
	Material        int        `json:"material"`            // index into RegionDistributionData.Materials
	Transform       *mat4.Data `json:"transform,omitempty"` // slice local transform, omitted if identity
	MaxViewDistance float32    `json:"maxViewDistance,omitempty"`
}

type RegionCapitalsData struct {
	Capitals map[string][]CapitalRuntimeData `json:"capitals"` // keyed by layer name
	Chunks   map[string][]ChunkRuntimeData   `json:"chunks"`   // keyed by layer name
	Slices   map[string]ViewerSlice          `json:"slices"`   // keyed by asset UUID_SUBID
}

const (
	MeshComponentName          = "Mesh"
	SpawnerComponentName       = "Spawner"
	PointSpawnerComponentName  = "PointSpawner"
	PrefabSpawnerComponentName = "PrefabSpawner"
	AreaSpawnerComponentName   = "AreaSpawner"
	LightComponentName         = "Light"
	TimOfDayComponentName      = "TimeOfDay"
)

type ViewerEntity struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	ParentId   string    `json:"parentId,omitempty"`
	Transfrom  mat4.Data `json:"transform"`
	Components []any     `json:"components"`
	// The entity is not active when the slice is instantiated (AZ::Entity IsRuntimeActive = false),
	// e.g. alternative states that are switched on by scripts or cutscenes
	Inactive bool `json:"inactive,omitempty"`
}

type ViewerComponent struct {
	Type string `json:"type"`
}

type ViewerSlice struct {
	Entities []ViewerEntity `json:"entities"`
	// Transform of the slice root entity, only set if it is not identity.
	// Entity transforms are in slice space where the root sits at this transform. The spawner places the root:
	// entityWorld = spawnerWorld * inverse(Transform) * entityTransform
	Transform *mat4.Data `json:"transform,omitempty"`

	SpawnRadius   float32 `json:"spawnRadius"`
	IsStaticSlice bool    `json:"isStaticSlice"`
}

type ViewerMeshComponent struct {
	Type                   string      `json:"type"` // Mesh
	Model                  string      `json:"mesh"`
	Material               string      `json:"material"`
	Instances              []mat4.Data `json:"instances,omitempty"`
	MaxViewDistance        float32     `json:"maxViewDistance,omitempty,omitzero"`
	ViewDistanceMultiplier float32     `json:"viewDistanceMultiplier,omitempty,omitzero"`
	Opacity                float32     `json:"opacity,omitempty,omitzero"`
	CrossFadeTime          float32     `json:"crossFadeTime,omitempty,omitzero"`
	CastShadow             bool        `json:"castShadow,omitempty"`
	ShouldInstance         bool        `json:"shouldInstance,omitempty"`
	ShouldMerge            bool        `json:"shouldMerge,omitempty"`
	ForceMerge             bool        `json:"forceMerge,omitempty"`
	FadeEnabled            bool        `json:"fadeEnabled,omitempty"`
	LoadOnActivate         bool        `json:"loadOnActivate,omitempty"`
	AcceptDecals           bool        `json:"acceptDecals,omitempty"`
	AcceptSand             bool        `json:"acceptSand,omitempty"`
	AcceptSilhouette       bool        `json:"acceptSilhouette,omitempty"`
	AcceptSnow             bool        `json:"acceptSnow,omitempty"`
	AlwaysRender           bool        `json:"alwaysRender,omitempty"`
	SortType               int8        `json:"sortType,omitempty,omitzero"`
	VisibilityOccluder     bool        `json:"visibilityOccluder,omitempty"`
	UseVisAreas            bool        `json:"useVisAreas,omitempty"`
	UseManualViewDistance  bool        `json:"useManualViewDistance,omitempty"`
}

type ViewerSpawnerComponent struct {
	Type      string         `json:"type"` // Spawner
	Slice     AssetReference `json:"slice"`
	AutoSpawn bool           `json:"autoSpawn"`
}

type ViewerPointSpawnerComponent struct {
	Type      string         `json:"type"` // PointSpawner
	Slice     AssetReference `json:"slice"`
	AutoSpawn bool           `json:"autoSpawn"`
}

type ViewerPrefabSpawnerComponent struct {
	Type  string         `json:"type"` // PrefabSpawner
	Slice AssetReference `json:"slice"`
}

type ViewerAreaSpawnerComponent struct {
	Type             string         `json:"type"` // AreaSpawner
	Slice            AssetReference `json:"slice"`
	Locations        []mat4.Data    `json:"locations"`
	LiveCount        int            `json:"liveCount,omitempty,omitzero"`
	MinResspawnRange float32        `json:"minRespawnRange,omitempty,omitzero"`
	MaxRespawnRange  float32        `json:"maxRespawnRange,omitempty,omitzero"`
	SpawnOnEnable    bool           `json:"spawnOnEnable,omitempty"`
	SpawnOnTrigger   bool           `json:"spawnOnTrigger,omitempty"`
}

type AssetReference struct {
	Guid  string `json:"guid"`
	SubId uint32 `json:"subId"`
	Hint  string `json:"hint,omitempty"`
}

type ViewerLightComponent struct {
	Type  string      `json:"type"` // LightComponent
	Light ViewerLight `json:"light"`
}

type ViewerLight struct {
	Type              string           `json:"type"`
	Color             [4]nwt.AzFloat32 `json:"color"`
	SpecMultiplier    float32          `json:"specMultiplier"`
	DiffuseMultiplier float32          `json:"diffuseMultiplier"`
	Attenuation       float32          `json:"attenuation"` // point and projector lights only
	Range             float32          `json:"range"`       // point, area and projector lights
	FOV               float32          `json:"fov"`         // area and projector lights
	// type 0: point light

	// type 1: area light
	AreaWidth  float32 `json:"areaWidth"`
	AreaHeight float32 `json:"areaHeight"`
	AreaFOV    float32 `json:"areaFOV"`

	// type 2: projector light
	ProjectorDistance  float32 `json:"projectorDistance"`
	ProjectorFOV       float32 `json:"projectorFOV"`
	ProjectorNearPlane float32 `json:"projectorNearPlane"`
	// ProjectorTexture          AssetReference

	// type 4: environment probe
	BoxWidth  float32 `json:"boxWidth"`
	BoxHeight float32 `json:"boxHeight"`
	BoxDepth  float32 `json:"boxDepth"`

	ViewDistance           float32 `json:"maxViewDistance,omitempty,omitzero"`
	ViewDistanceEnabled    bool    `json:"viewDistanceEnabled,omitempty,omitzero"`
	ViewDistanceMultiplier float32 `json:"viewDistanceMultiplier,omitempty,omitzero"`
}

type ViewerTimeOfDayComponent struct {
	Type          string             `json:"type"`
	Shape         string             `json:"shape"` // box,sphere,cylinder
	Width         float32            `json:"width,omitempty,omitzero"`
	Height        float32            `json:"height,omitempty,omitzero"`
	Depth         float32            `json:"depth,omitempty,omitzero"`
	Radius        float32            `json:"radius,omitempty,omitzero"`
	BlendDistance float32            `json:"blendDistance,omitempty,omitzero"`
	BlendTime     float32            `json:"blendTime,omitempty,omitzero"`
	Priority      int                `json:"priority,omitempty,omitzero"`
	Override      float32            `json:"override,omitempty,omitzero"`
	File          string             `json:"file,omitempty"`
	Preset        *mission.TimeOfDay `json:"preset,omitempty"`
}
