package level

import (
	"fmt"
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
	Level              string                 `json:"level"`              // related level folder name, may be nested
	Name               string                 `json:"name"`               // coatlicue folder name, never nested
	RegionSize         int                    `json:"regionSize"`         // from [coatlicue]/tracts.json, usually 2048
	RegionCellSize     int                    `json:"regionCellSize"`     // from [coatlicue]/offlineoptions.json,  usually 128
	EnableChunks       bool                   `json:"enableChunks"`       // from [coatlicue]/offlineoptions.json
	EnableVegetation   bool                   `json:"enableVegetation"`   // from [coatlicue]/offlineoptions.json
	EnableDistribution bool                   `json:"enableDistribution"` // from [coatlicue]/offlineoptions.json
	MountainHeight     float32                `json:"mountainHeight"`     // from [coatlicue]/terrain.json
	MountainRoughness  float32                `json:"mountainRoughness"`  // from [coatlicue]/terrain.json
	OceanLevel         float32                `json:"oceanLevel"`         // from [coatlicue]/terrain.json
	ValleyIntensity    float32                `json:"valleyIntensity"`    // from [coatlicue]/terrain.json
	Tracts             *tracts.Document       `json:"tracts"`             // from [coatlicue]/tracts.json
	Regions            []RegionLocation       `json:"regions"`            // from world.json and playable.json
	GameModeMaps       []GameModeMap          `json:"gameModeMaps"`       // from datasheets, all maps referencing this level/coatlicue
	Mission            *mission.Document      `json:"mission"`            // from [level]/mission_mission0.xml
	MissionEntities    []ViewerEntity         `json:"missionEntities"`    // from [level]/mission0.entities_xml
	SkyboxSystem       *ViewerSlice           `json:"skyboxSystem"`       // from slices/system/skyboxsystem, spawned by the game for every level
	TerritorySystem    *ViewerSlice           `json:"territorySystem"`    // from tracts.json territoryMasterSlicePath, spawned by the game
	Slices             map[string]ViewerSlice `json:"slices"`             // slices referenced by SkyboxSystem and TerritorySystem
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
	ID              string `json:"name"`            // folder base name, e.g. "r_+00_+00" (or r_+xx_+yy)
	Location        [2]int `json:"location"`        // grid location, e.g. [0,0], [1,0], [2,0] etc. first value is X, second is Y
	Playable        bool   `json:"playable"`        // from playable.json
	HasVegetation   bool   `json:"hasVegetation"`   // region folder has a region.vegetation file
	HasDistribution bool   `json:"hasDistribution"` // region folder has a region.distribution file
}

type RegionInfo struct {
	ID              string           `json:"name"`
	PoiImpostors    []RegionImpostor `json:"poiImpostors"` // from impostros.json
	Impostors       []RegionImpostor `json:"impostors"`    // from poi_impostors.json
	TerrainMaterial *RegionMaterial  `json:"terrainMaterial"`
	// region local tract names from localmappings.json, indexed by the values of tractmap.bin
	Tracts []string `json:"tracts"`
	// whether the region has a region.slicedata file, which flags the capital meshes baked into the POI impostors.
	// Without it no mesh carries an impostor flag (e.g. dungeons).
	HasSliceData bool `json:"hasSliceData"`
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

	MacroMaterialParams    MacroMaterialParams  `json:"macroMaterialParams"`
	CustomBackgroundParams *MacroMaterialParams `json:"customBackgroundParams,omitempty"`
	CustomForegroundParams *MacroMaterialParams `json:"customForegroundParams,omitempty"`
	WorldBackgroundParams  MacroMaterialParams  `json:"worldBackgroundParams"`
	WorldForegroundParams  MacroMaterialParams  `json:"worldForegroundParams"`
	POMDisplacement        float32              `json:"pomDisplacement"`
	POMHeightBias          float32              `json:"pomHeightBias"`
	POMSelfShadowStrength  float32              `json:"pomSelfShadowStrength"`
}

type MacroMaterialParams struct {
	Color               [4]float32 `json:"color"`
	ColorScale          float32    `json:"colorScale"`
	GlossScale          float32    `json:"glossScale"`
	NormalScale         float32    `json:"normalScale"`
	SpecularReflectance float32    `json:"specularReflectance"`
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
	ColliderComponentName      = "Collider"
	VolumeComponentName        = "Volume"
	CameraComponentName        = "Camera"
	CharacterComponentName     = "Character"
)

// ViewerCharacterComponent is a character a slice shows (a visible SkinnedMeshComponent): the .cdf with its parts and
// the Mannequin data of the action list that animates it. The parts are the skin and cloth attachments in bind pose,
// the viewer reads skeleton and bone attachments from the .cdf itself.
type ViewerCharacterComponent struct {
	Type string `json:"type"` // Character
	// the .cdf, or a single .skin
	Model string `json:"model"`
	// replaces the material of every part (SkinnedMeshComponent Material_Override_Asset)
	MaterialOverride string `json:"materialOverride,omitempty"`
	// the AOI radius of the slice, or the fallback without one
	MaxViewDistance float32               `json:"maxViewDistance"`
	Parts           []ViewerCharacterPart `json:"parts"`
	// nil without an action list
	Mannequin *ViewerMannequin `json:"mannequin,omitempty"`
	// the timeline layers that animate the character (a TimelineComponent of the slice assigns them to its entity)
	Timelines []ViewerTimelineLayer `json:"timelines,omitempty"`
	// the weapons in the hands the spawn action draws
	Weapons []ViewerCharacterWeapon `json:"weapons,omitempty"`
}

// ViewerCharacterWeapon is a weapon a character holds: a character of its own (the weapon .cdf in bind pose) on a
// socket of the holder, which follows the holder's joint
type ViewerCharacterWeapon struct {
	// the paperdoll item
	Item    string `json:"item"`
	OffHand bool   `json:"offHand,omitempty"`
	// the weapon .cdf
	Model string                `json:"model"`
	Parts []ViewerCharacterPart `json:"parts"`
	// the holder's joint the socket follows (its BoneName)
	Joint string `json:"joint"`
	// the socket relative to the joint: position, rotation x, y, z, w
	SocketPosition [3]float32 `json:"socketPosition"`
	SocketRotation [4]float32 `json:"socketRotation"`
	// the equip type's offset on the socket: position, rotation in degrees about x, y, z
	OffsetPosition [3]float32 `json:"offsetPosition"`
	OffsetRotation [3]float32 `json:"offsetRotation"`
}

// ViewerTimelineLayer is a layer of a timeline asset that a TimelineComponent assigns to an entity
// (LayerEntityAssignment). The viewer reads the timeline file (`<timeline>.json`) and plays its clips.
type ViewerTimelineLayer struct {
	// the .timeline
	Timeline string `json:"timeline"`
	// the layer name and id in the timeline
	Layer   string `json:"layer"`
	LayerId string `json:"layerId,omitempty"`
	// the timeline starts when the component activates, and restarts at its end
	RunOnActivate bool `json:"runOnActivate,omitempty"`
	Loop          bool `json:"loop,omitempty"`
}

// ViewerCharacterPart is a skin or cloth attachment of a character
type ViewerCharacterPart struct {
	// the attachment name (AName), empty for a single .skin
	Name string `json:"name,omitempty"`
	// the .skin, for cloth the mesh its .cloth references
	Mesh string `json:"mesh"`
	// the attachment material, empty to use the mesh's own
	Material string `json:"material,omitempty"`
	Cloth    bool   `json:"cloth,omitempty"`
	// the game hides the attachment by default (FLAGS_ATTACH_HIDE_ATTACHMENT): the viewer loads it but does not draw it
	Hidden bool `json:"hidden,omitempty"`
}

// ViewerMannequin is the Mannequin data of an ActionListComponent
type ViewerMannequin struct {
	// the animation database (.adb) of the character's own scope context
	Database string `json:"database"`
	// the controller definition (.xml): fragments, scopes, tag and fragment definitions
	ControllerDefinition string `json:"controllerDefinition"`
	// the animation databases of further scope contexts (m_scopeData)
	Scopes []ViewerMannequinScope `json:"scopes,omitempty"`
	// tags set when the action list starts (m_defaultTags)
	DefaultTags []string `json:"defaultTags,omitempty"`
	// tags of the main hand item the spawn action draws (its weapon row's MannequinTag), the paperdoll's
	// m_noEquipMannequinTag without one
	ItemTags []string `json:"itemTags,omitempty"`
	// the action played when spawned (m_spawnAction)
	SpawnAction string `json:"spawnAction,omitempty"`
	// the CAGE action grid (.grid)
	Grid string `json:"grid,omitempty"`
	// the SlayerScript program that runs instead of CAGE (m_useSlayerScript), empty when CAGE runs
	SlayerScript string `json:"slayerScript,omitempty"`
}

type ViewerMannequinScope struct {
	// the scope context name, e.g. Audio, VFX, WeaponContext
	Context  string `json:"context"`
	Database string `json:"database"`
}

// ViewerCameraComponent is a camera placed in a level, e.g. the main menu's `EstablishingCameraPlacement`.
// The viewer may start its view there. Angles in degrees, distances in meters.
type ViewerCameraComponent struct {
	Type string  `json:"type"` // Camera
	Fov  float32 `json:"fov"`
	Near float32 `json:"near"`
	Far  float32 `json:"far"`
}

// ViewerShape is a primitive shape in entity space (Z-up), normalized from query shapes and LmbrCentral shapes
type ViewerShape struct {
	// box, sphere, capsule, cylinder, prism
	Kind string `json:"kind"`
	// offset of the shape center in entity space
	Center *[3]float32 `json:"center,omitempty"`
	// box: half extents
	HalfExtents *[3]float32 `json:"halfExtents,omitempty"`
	// sphere, capsule, cylinder
	Radius float32 `json:"radius,omitempty,omitzero"`
	// capsule: length of the segment between the cap centers, cylinder: full height, prism: extrusion height
	Height float32 `json:"height,omitempty,omitzero"`
	// capsule: direction of the segment, Z if omitted
	Axis *[3]float32 `json:"axis,omitempty"`
	// prism: polygon in the XY plane, extruded along Z from 0 to height
	Vertices [][2]float32 `json:"vertices,omitempty"`
}

// ViewerColliderComponent is the collision of a GameRigidBodyComponent.
// The shape is either a RockNRoll shape asset (rnr) or a primitive (shape).
type ViewerColliderComponent struct {
	Type string `json:"type"` // Collider
	// file path of the .rnr shape asset
	Rnr string `json:"rnr,omitempty"`
	// primitive shape, used if there is no rnr
	Shape *ViewerShape `json:"shape,omitempty"`
	// collision filter, e.g. Structure, Terrain
	Filter      string `json:"filter,omitempty"`
	Dynamic     bool   `json:"dynamic,omitempty"`
	ScaleShapes bool   `json:"scaleShapes,omitempty"`
}

// ViewerVolumeComponent is a query or trigger volume without collision response
type ViewerVolumeComponent struct {
	Type string `json:"type"` // Volume
	// hit, detection, trigger
	Volume string      `json:"volume"`
	Shape  ViewerShape `json:"shape"`
	Filter string      `json:"filter,omitempty"`
	Name   string      `json:"name,omitempty"`
}

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
	// The name of the entity with the EncounterManagerComponent (a scripted fight in waves),
	// e.g. Enc_WorldEvent_LootGoblin_00, empty without one
	Encounter string `json:"encounter,omitempty"`
	// The slice has an NpcComponent: a quest or mission NPC
	Npc bool `json:"npc,omitempty"`
	// The slice has a VitalsComponent: a creature (or a gimmick with health, e.g. an explosive barrel)
	Creature bool `json:"creature,omitempty"`
	// The largest view distance of the characters the slice shows or spawns through its nested spawners, 0 without
	// characters (see applyActorReach)
	ActorReach float32 `json:"actorReach,omitempty"`
	// The view distance of the character the slice shows itself (a visible SkinnedMeshComponent), 0 without one
	characterReach float32
	// Streaming data of the slice from the region slice table (region.slicedata), the variant meta, or in levels
	// without slicedata the slice's own .slice.meta. Nil for slices without an entry (chunks, nested slices)
	Gde *ViewerSliceGde `json:"gde,omitempty"`
}

// ViewerSliceGde is the GDE streaming data of a slice (SliceMetaData). The game spawns a slice within
// min(SpawnRadius, g_GDE_ImpostorsRenderMaxRange) * g_GDE_AOIScale, held to the near reach (235 m) unless LongDistance,
// and builds its meshes within 225 + PhysicalRadius unless LongDistance or SkipMidRangeImpostors
type ViewerSliceGde struct {
	SpawnRadius           float32 `json:"spawnRadius"`
	PhysicalRadius        float32 `json:"physicalRadius"`
	LongDistance          bool    `json:"longDistance,omitempty"`
	SkipMidRangeImpostors bool    `json:"skipMidRangeImpostors,omitempty"`
}

func sliceGde(meta *nwt.SliceMetaData) *ViewerSliceGde {
	if meta == nil {
		return nil
	}
	return &ViewerSliceGde{
		SpawnRadius:           float32(meta.GdeSpawnRadius),
		PhysicalRadius:        float32(meta.SlicePhysicalRadius),
		LongDistance:          bool(meta.IsLongDistanceGDE),
		SkipMidRangeImpostors: bool(meta.SkipMidRangeImpostors),
	}
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
	LodRatio               uint32      `json:"lodRatio,omitempty"`
	LodMinScreenPct        []float32   `json:"lodMinScreenPct,omitempty"`
	Impostor               bool        `json:"impostor,omitempty"` // baked into the POI impostor (m_impostorFarDistance in region.slicedata)
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
	// The game spawns the slice only on an event: m_spawnOnInitialize or the server facet's m_autoSpawnEnabled is false
	TriggerOnly bool `json:"triggerOnly,omitempty"`
	// Phases of the day in which the spawner spawns (TimeOfDayConstraintComponent), nil without a constraint
	TimeOfDay *ViewerSpawnTimeOfDay `json:"timeOfDay,omitempty"`
	// The patrol path of the spawned actor (m_patrolPathEntity), nil without waypoints
	Patrol *ViewerPatrolPath `json:"patrol,omitempty"`
	// The spawned actor stands on the ground under the spawn point (NavMeshConstraintComponent)
	OnGround bool `json:"onGround,omitempty"`
}

// ViewerPatrolPath is the AIPathComponent a point spawner names: its actor walks the waypoints by the policy
type ViewerPatrolPath struct {
	// m_pathTravesalPolicy: Loop 0, Bounce 1, Random 2, Undefined 3 (walks as Loop)
	Policy    int                    `json:"policy"`
	Waypoints []ViewerPatrolWaypoint `json:"waypoints"`
}

// ViewerPatrolWaypoint is an AIWaypointComponent: where the actor walks to and what it does there
type ViewerPatrolWaypoint struct {
	// Slice space, as the spawner's transform
	Transform mat4.Data `json:"transform"`
	// m_taskName, the fragment the actor runs at the waypoint, empty for none
	Task string `json:"task,omitempty"`
	// m_minDuration, m_maxDuration in seconds, a negative minimum is no wait
	MinDuration float32 `json:"minDuration"`
	MaxDuration float32 `json:"maxDuration"`
	// m_matchAlignment: the actor turns to the waypoint's facing
	MatchAlignment bool `json:"matchAlignment,omitempty"`
}

// ViewerSpawnTimeOfDay is the TimeOfDayConstraintComponent of a spawner entity: the phases of the day in which the
// spawner spawns its slice
type ViewerSpawnTimeOfDay struct {
	Dawn  bool `json:"dawn"`
	Day   bool `json:"day"`
	Dusk  bool `json:"dusk"`
	Night bool `json:"night"`
}

type ViewerPrefabSpawnerComponent struct {
	Type  string         `json:"type"` // PrefabSpawner
	Slice AssetReference `json:"slice"`
	// The game spawns the slice only on an event, not when the spawner initializes: m_spawnOnInitialize is false
	// (e.g. the death loot bag of a creature, the trunk of a depleted tree)
	TriggerOnly bool `json:"triggerOnly,omitempty"`
	// Phases of the day in which the spawner spawns (TimeOfDayConstraintComponent), nil without a constraint
	TimeOfDay *ViewerSpawnTimeOfDay `json:"timeOfDay,omitempty"`
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
	// The game spawns the population only on an event, not when the spawner is enabled: m_spawnOnEnable is false
	// (e.g. the rats a creature calls)
	TriggerOnly bool `json:"triggerOnly,omitempty"`
	// Phases of the day in which the spawner spawns (TimeOfDayConstraintComponent), nil without a constraint
	TimeOfDay *ViewerSpawnTimeOfDay `json:"timeOfDay,omitempty"`
}

type AssetReference struct {
	Guid  string `json:"guid"`
	SubId uint32 `json:"subId"`
	Hint  string `json:"hint,omitempty"`
	// Lower case variant of the slice, the referenced slice is keyed by "guid_subId_variant" (see AssetReference.Key)
	Variant string `json:"variant,omitempty"`
}

// Key is the key of the referenced slice in RegionCapitalsData.Slices
func (it AssetReference) Key() string {
	if it.Variant != "" {
		return fmt.Sprintf("%s_%d_%s", it.Guid, it.SubId, it.Variant)
	}
	return fmt.Sprintf("%s_%d", it.Guid, it.SubId)
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
	// ambient only light, modulates the ambient (probe) lighting instead of adding direct light (TiledShading.cfi)
	Ambient bool `json:"ambient,omitempty"`
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

	// type 3: environment probe
	// full size of the oriented influence box along the local x, y, z axes (Area X,Y,Z, the engine uses half of it)
	ProbeArea *[3]float32 `json:"probeArea,omitempty"`
	// specular cubemap path, normalized and verified to exist. The diffuse cubemap is the `_diff` sibling. Empty disables the probe
	Cubemap      string  `json:"cubemap,omitempty"`
	SortPriority uint32  `json:"sortPriority,omitempty"`
	Falloff      float32 `json:"falloff,omitempty"`
	TodInfluence float32 `json:"todInfluence,omitempty"`
	// world axis aligned parallax box, only meaningful with BoxProject
	BoxProject bool    `json:"boxProject,omitempty"`
	BoxWidth   float32 `json:"boxWidth,omitempty"`
	BoxLength  float32 `json:"boxLength,omitempty"`
	BoxHeight  float32 `json:"boxHeight,omitempty"`
	// the light (any type) contributes to the froxel volumetric fog
	VolumetricFog bool `json:"volumetricFog,omitempty"`
	// the light (any type) only contributes to volumetric fog, not to surfaces
	VolumetricFogOnly bool `json:"volumetricFogOnly,omitempty"`
	// invisible lights and probes are not rendered (LightInstance.cpp)
	Hidden bool `json:"hidden,omitempty"`

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
	Sky           *AssetReference    `json:"sky,omitempty"` // skybox slice (slices/sky/*), spawns the cloud dome
}
