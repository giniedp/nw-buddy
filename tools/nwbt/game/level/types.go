package level

import (
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/formats/localmappings"
	"nw-buddy/tools/formats/mapsettings"
	"nw-buddy/tools/formats/terrain"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

const (
	SegmentSize = 128
)

type Definition struct {
	Name                string
	CoatlicueName       string
	MissionEntitiesFile nwfs.File
	MissionFile         nwfs.File
	Maps                []MapDefinition
	Tracts              tracts.Document
	PlayableArea        [][2]int
	WorldArea           [][2]int
	Regions             []RegionReference
	TerrainSettings     *terrain.Document
}

type MapDefinition struct {
	GameModeMapId    string
	GameModeId       string
	SlicePath        string
	CoatlicueName    string
	WorldBounds      string
	TeamTeleportData string
}

type RegionDefinition struct {
	Name          string
	LocalMappings localmappings.Document
	MapSettings   mapsettings.Document
	Impostors     []impostors.Impostor
	PoiImpostors  []impostors.Impostor
	Capitals      []CapitalLayerDefinition

	Chunks       nwfs.File
	Distribution nwfs.File
	Heightmap    nwfs.File
	Metadata     nwfs.File
	Slicedata    nwfs.File
	Tractmap     nwfs.File
}

type CapitalLayerDefinition struct {
	Name     string
	Capitals []capitals.Capital
	Chunks   []nwt.ChunkEntry
}

type RegionMacroMaterial struct {
	RegionsX  int       `json:"regionsX"`
	RegionsY  int       `json:"regionsY"`
	NormalMap nwfs.File `json:"normalMap"`
	ColorMap  nwfs.File `json:"colorMap"`
	GlossMap  nwfs.File `json:"specularMap"`
}

type CollectionLoader interface {
	Level(name string) Loader
}

type Loader interface {
	Info() *Info
	MissionEntities() []EntityInfo
	Region(name string) RegionLoader
	Terrain() *heightmap.Mipmaps
	TerrainInfo() *TerrainInfo
}

type RegionLoader interface {
	Info() *RegionInfo
	Entities() map[string]map[string][]EntityInfo
	Distribution() *DistributionInfo
}

type Info struct {
	Name            string                `json:"name"`
	CoatlicueName   string                `json:"coatlicueName"`
	OceanLevel      float32               `json:"oceanLevel"`
	MountainHeight  float32               `json:"mountainHeight"`
	GroundMaterial  string                `json:"groundMaterial"`
	RegionSize      int                   `json:"regionSize"`
	Regions         []RegionReference     `json:"regions"`
	Maps            []MapInfo             `json:"maps"`
	TimeOfDay       *TimeOfDayInfo        `json:"timeOfDay"`
	Environment     *EnvironmentInfo      `json:"environment"`
	RegionMaterials []RegionMacroMaterial `json:"regionMaterials"`
}

type MapInfo struct {
	GameModeMapId    string `json:"gameModeMapId"`
	GameModeId       string `json:"gameModeId"`
	SlicePath        string `json:"slicePath"`
	CoatlicueName    string `json:"coatlicueName"`
	WorldBounds      string `json:"worldBounds"`
	TeamTeleportData string `json:"teamTeleportData"`
}

type RegionReference struct {
	ID       string  `json:"name"`
	Location *[2]int `json:"location"`
}

type RegionInfo struct {
	Name           string             `json:"name"`
	Size           int                `json:"size"`
	CellResolution int                `json:"cellResolution"`
	SegmentSize    int                `json:"segmentSize"`
	Segments       []SegmentReference `json:"segments"`
	Capitals       []CapitalLayerInfo `json:"capitals"`
	PoiImpostors   []ImpostorInfo     `json:"poiImpostors"`
	Impostors      []ImpostorInfo     `json:"impostors"`
	Distribution   string             `json:"distribution"`
}
type SegmentReference struct {
	ID       int     `json:"id"`
	Location *[2]int `json:"location"`
}

type ImpostorInfo struct {
	Position [2]float64 `json:"position"`
	Model    string     `json:"model"`
}

type CapitalLayerInfo struct {
	Name     string        `json:"name"`
	Capitals []CapitalInfo `json:"capitals"`
	Chunks   []ChunkInfo   `json:"chunks"`
}

type CapitalInfo struct {
	ID        string    `json:"id"`
	Transform mat4.Data `json:"transform"`
	Radius    float32   `json:"radius"`
	Slice     string    `json:"slice"`
}

type ChunkInfo struct {
	ID        string    `json:"id"`
	Transform mat4.Data `json:"transform"`
	Size      float32   `json:"size"`
	Slice     string    `json:"slice"`
}

type EnvironmentInfo struct {
}

type TimeOfDayInfo struct {
	Time          float32             `json:"time"`
	TimeStart     float32             `json:"timeStart"`
	TimeEnd       float32             `json:"timeEnd"`
	TimeAnimSpeed float32             `json:"timeAnimSpeed"`
	Variables     []TimeOfDayVariable `json:"variables"`
}

type TimeOfDayVariable struct {
	Name  string `json:"name"`
	Color string `json:"color"`
	Value string `json:"value"`
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

type EncounterInfo struct {
	Name   string   `json:"name"`
	Stages []string `json:"stages"`
}

type LightInfo struct {
	Type              uint             `json:"type"`
	Color             [4]nwt.AzFloat32 `json:"color"`
	DiffuseIntensity  float32          `json:"diffuseIntensity"`
	SpecularIntensity float32          `json:"specularIntensity"`
	PointDistance     float32          `json:"pointDistance"`
	PointAttenuation  float32          `json:"pointAttenuation"`
}

type TerrainInfo struct {
	Level          string  `json:"level"`
	TileSize       int     `json:"tileSize"`
	MipCount       int     `json:"mipCount"`
	Width          int     `json:"width"`
	Height         int     `json:"height"`
	RegionsX       int     `json:"regionsX"`
	RegionsY       int     `json:"regionsY"`
	RegionSize     int     `json:"regionSize"`
	OceanLevel     float32 `json:"oceanLevel"`
	MountainHeight float32 `json:"mountainHeight"`
	GroundMaterial string  `json:"groundMaterial"`
}

type DistributionInfo struct {
	Slices   map[string][]EntityInfo        `json:"slices"`
	Segments map[string][]DistributionSlice `json:"segments"`
}

type DistributionSlice struct {
	Slice     string       `json:"slice"`
	Positions [][2]float32 `json:"positions"`
}
