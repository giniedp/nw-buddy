package level

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/mission"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
	"path"
	"strings"
)

// TrackSliceAsset is told the slices a slice spawns, with the lower case variant they are spawned as (empty for the
// master)
type TrackSliceAsset func(asset catalog.AssetId, variant string)

// resolveProbeCubemap normalizes the authored cubemap path of an environment probe, e.g. backslashes, upper case and
// the source .tif extension (the shipped file is always .dds). Returns an empty string if the file does not exist.
func resolveProbeCubemap(assets *game.Assets, file string) string {
	file = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(file), "\\", "/"))
	if file == "" {
		return ""
	}
	file = strings.TrimSuffix(file, path.Ext(file)) + ".dds"
	if _, ok := assets.Archive.Lookup(file); !ok {
		slog.Warn("environment probe cubemap not found", "file", file)
		return ""
	}
	return file
}

// LoadViewerLight converts the configuration of a LightComponent to the viewer's light, as served with the slices and
// written to the `extras` of exported glTF lights (gltf.ImportAssetLights)
func LoadViewerLight(assets *game.Assets, config nwt.LightConfiguration) ViewerLight {
	light := ViewerLight{
		Color:             [4]nwt.AzFloat32(config.Color),
		SpecMultiplier:    float32(config.SpecMultiplier),
		DiffuseMultiplier: float32(config.DiffuseMultiplier),
		Ambient:           bool(config.Ambient),
		// participation in the froxel volumetric fog (light grid of InjectVolumetricInscattering)
		VolumetricFog:     bool(config.VolumetricFog),
		VolumetricFogOnly: bool(config.VolumetricFogOnly),
		// the cap is an absolute distance, the multiplier is the engine view distance ratio
		ViewDistance:           float32(config.ViewDistanceCap),
		ViewDistanceEnabled:    bool(config.ViewDistanceCapEnabled),
		ViewDistanceMultiplier: float32(config.ViewDistanceMultiplier),
		// the game does not render invisible lights, sequences and scripts switch them on
		Hidden: !bool(config.Visible),
	}
	switch config.LightType {
	case 0:
		light.Type = "Point"
		light.Range = float32(config.PointMaxDistance)
		light.Attenuation = float32(config.PointAttenuationBulbSize)
	case 1:
		light.Type = "Area"
		light.Range = float32(config.AreaMaxDistance)
		light.AreaWidth = float32(config.AreaWidth)
		light.AreaHeight = float32(config.AreaHeight)
		light.AreaFOV = float32(config.AreaFOV)
	case 2:
		light.Type = "Projector"
		light.Range = float32(config.ProjectorDistance)
		light.Attenuation = float32(config.ProjectorAttenuationBulbSize)
		light.ProjectorFOV = float32(config.ProjectorFOV)
		light.ProjectorNearPlane = float32(config.ProjectorNearPlane)
		light.ProjectorDistance = float32(config.ProjectorDistance)
	case 3:
		light.Type = "Probe"
		light.ProbeArea = &[3]float32{
			float32(config.Area_X_Y_Z[0]),
			float32(config.Area_X_Y_Z[1]),
			float32(config.Area_X_Y_Z[2]),
		}
		light.Cubemap = resolveProbeCubemap(assets, string(config.CubemapTexture))
		light.SortPriority = uint32(config.SortPriority)
		light.Falloff = float32(config.AttenuationFalloffMax)
		light.TodInfluence = float32(config.TodInfluence)
		light.BoxProject = bool(config.BoxProject)
		light.BoxWidth = float32(config.BoxWidth)
		light.BoxLength = float32(config.BoxLength)
		light.BoxHeight = float32(config.BoxHeight)
	}
	return light
}

// LoadViewerTimeOfDay converts a time of day zone (TimeOfDayPOIComponent with its shape) and loads its preset, as
// served with the slices and written to the `extras` of exported glTF nodes. Without the sky slice, the caller tracks
// that. Nil for zones without a supported shape or preset file.
func LoadViewerTimeOfDay(assets *game.Assets, entity *nwt.AZ__Entity, v nwt.TimeOfDayPOIComponent) *ViewerTimeOfDayComponent {
	tod := ViewerTimeOfDayComponent{
		Type:          TimOfDayComponentName,
		BlendDistance: float32(v.Configuration.BlendDistance),
		BlendTime:     float32(v.Configuration.BlendTime),
		Priority:      int(v.Configuration.Priority),
		File:          string(v.Configuration.FileName),
		Override:      float32(v.Configuration.TimeOfDayOverride),
	}
	for _, cc := range entity.Components.Element {
		switch vv := cc.(type) {
		case nwt.BoxShapeComponent:
			tod.Shape = "box"
			// dimensions are x, y, z: depth is y, height is z (up)
			tod.Width = float32(vv.Configuration.Dimensions[0])
			tod.Depth = float32(vv.Configuration.Dimensions[1])
			tod.Height = float32(vv.Configuration.Dimensions[2])
		case nwt.SphereShapeComponent:
			tod.Shape = "sphere"
			tod.Radius = float32(vv.Configuration.Radius)
		case nwt.CylinderShapeComponent:
			tod.Shape = "cylinder"
			tod.Height = float32(vv.Configuration.Height)
			tod.Radius = float32(vv.Configuration.Radius)
		case nwt.CapsuleShapeComponent:
			tod.Shape = "cylinder"
			tod.Height = float32(vv.Configuration.Height)
			tod.Radius = float32(vv.Configuration.Radius)
		}
	}
	if tod.Shape == "" {
		return nil
	}
	file, ok := assets.Archive.Lookup(string(v.Configuration.FileName))
	if !ok {
		return nil
	}
	if preset, _ := mission.LoadTOD(file); preset != nil {
		tod.Preset = preset
	}
	return &tod
}

// LoadViewerSlice converts a slice for the viewer. A variant applies the row of the slice's variation data (see
// sliceVariation), empty loads the master.
func LoadViewerSlice(assets *game.Assets, file nwfs.File, variant string, track TrackSliceAsset) (ViewerSlice, error) {
	if track == nil {
		track = func(asset catalog.AssetId, variant string) {}
	}
	result := ViewerSlice{
		Entities: make([]ViewerEntity, 0),
	}

	slice, err := assets.LoadSliceComponent(file)
	if err != nil {
		return result, err
	}

	if slice == nil {
		return result, nil
	}

	if tm, ok := game.SliceRootTransform(slice); ok && !mat4.IsIdentity(tm) {
		result.Transform = &tm
	}

	// waterfall audio followers move along a spline, resolved from their scripts
	followers := collectAudioFollowers(slice)
	// characters are shown within the AOI radius of their slice
	aoiRadius := sliceAoiRadius(slice)
	actionLists := sliceActionLists(slice)
	paperdoll := game.SlicePaperdoll(slice)
	timelineLayers := sliceTimelineLayers(assets, slice)
	variation := sliceVariation(assets, slice, variant)

	for _, entity := range slice.Entities.Element {
		changes := variation[entity.Id.Id]
		viewerEntity := ViewerEntity{
			ID:         fmt.Sprintf("%d", entity.Id.Id),
			Name:       string(entity.Name),
			Transfrom:  game.FindEntityTransformMat4(&entity),
			Components: make([]any, 0),
			Inactive:   !bool(entity.IsRuntimeActive),
		}
		if parent := game.FindEntityParent(slice, &entity); parent != nil {
			viewerEntity.ParentId = fmt.Sprintf("%d", parent.Id.Id)
		}
		// the spawners of the entity spawn only in these phases of the day
		timeOfDay := spawnerTimeOfDay(&entity)

		for _, comp := range entity.Components.Element {
			switch v := comp.(type) {
			case nwt.AoiComponent:
				result.IsStaticSlice = bool(v.M_isStaticSlice)
				result.SpawnRadius = float32(v.M_sliceSpawnRadius)
			case nwt.MeshComponent:
				meshNode := v.Static_Mesh_Render_Node
				if game.ShouldIgnoreMeshNode(meshNode) {
					continue
				}
				if changes != nil && changes.hidden {
					continue
				}
				modelAsset := meshNode.Static_Mesh
				modelFile, err := assets.LookupFileByAsset(modelAsset)
				if err != nil {
					slog.Warn("skip missing model", "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := meshNode.Material_Override_Asset
				materialFile, err := assets.LookupFileByAsset(materialAsset)
				if err != nil {
					slog.Warn("ignore model material", "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}
				if changes != nil && changes.model != "" {
					// a changed mesh takes the variant's material, none draws the mesh's own
					model = changes.model
					material = changes.material
				} else if changes != nil && changes.materialSet {
					material = changes.material
				}

				model, material = assets.ResolveCgfAndMtl(model, material)
				viewerEntity.Components = append(viewerEntity.Components, ViewerMeshComponent{
					Type:                   MeshComponentName,
					Model:                  model,
					Material:               material,
					LoadOnActivate:         bool(v.Load_Mesh_On_Activate),
					Opacity:                float32(meshNode.Render_Options.Opacity),
					MaxViewDistance:        float32(meshNode.Render_Options.MaxViewDistance),
					ViewDistanceMultiplier: float32(meshNode.Render_Options.ViewDistanceMultiplier),
					CrossFadeTime:          float32(meshNode.Render_Options.CrossFadeTime),
					CastShadow:             bool(meshNode.Render_Options.CastShadows),
					ShouldInstance:         bool(meshNode.Render_Options.ShouldInstance),
					ShouldMerge:            bool(meshNode.Render_Options.ShouldMerge),
					ForceMerge:             bool(meshNode.Render_Options.ForceMerge),
					FadeEnabled:            bool(meshNode.Render_Options.FadeEnabled),
					AcceptDecals:           bool(meshNode.Render_Options.AcceptDecals),
					AcceptSand:             bool(meshNode.Render_Options.AcceptSand),
					AcceptSilhouette:       bool(meshNode.Render_Options.AcceptSilhouette),
					AcceptSnow:             bool(meshNode.Render_Options.AcceptSnow),
					AlwaysRender:           bool(meshNode.Render_Options.AlwaysRender),
					SortType:               int8(meshNode.Render_Options.SortType),
					VisibilityOccluder:     bool(meshNode.Render_Options.VisibilityOccluder),
					UseVisAreas:            bool(meshNode.Render_Options.UseVisAreas),
					LodRatio:               lodRatio(meshNode.Render_Options),
					LodMinScreenPct:        lodMinScreenPct(meshNode.Render_Options),
				})
			case nwt.InstancedMeshComponent:
				meshNode := v.Instanced_Mesh_Render_Node.BaseClass1
				if game.ShouldIgnoreMeshNode(meshNode) {
					continue
				}
				modelAsset := meshNode.Static_Mesh
				modelFile, err := assets.LookupFileByAsset(modelAsset)
				if err != nil {
					slog.Warn("skip missing model", "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := meshNode.Material_Override_Asset
				materialFile, err := assets.LookupFileByAsset(materialAsset)
				if err != nil {
					slog.Warn("ignore model material", "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}

				instances := make([]mat4.Data, 0)
				for _, t := range v.Instanced_Mesh_Render_Node.Instance_Transforms.Element {
					instances = append(instances, mat4.FromAzTransform(t))
				}

				model, material = assets.ResolveCgfAndMtl(model, material)
				viewerEntity.Components = append(viewerEntity.Components, ViewerMeshComponent{
					Type:                   MeshComponentName,
					Model:                  model,
					Material:               material,
					Instances:              instances,
					LoadOnActivate:         true,
					Opacity:                float32(meshNode.Render_Options.Opacity),
					MaxViewDistance:        float32(meshNode.Render_Options.MaxViewDistance),
					ViewDistanceMultiplier: float32(meshNode.Render_Options.ViewDistanceMultiplier),
					CrossFadeTime:          float32(meshNode.Render_Options.CrossFadeTime),
					CastShadow:             bool(meshNode.Render_Options.CastShadows),
					ShouldInstance:         bool(meshNode.Render_Options.ShouldInstance),
					ShouldMerge:            bool(meshNode.Render_Options.ShouldMerge),
					ForceMerge:             bool(meshNode.Render_Options.ForceMerge),
					FadeEnabled:            bool(meshNode.Render_Options.FadeEnabled),
					AcceptDecals:           bool(meshNode.Render_Options.AcceptDecals),
					AcceptSand:             bool(meshNode.Render_Options.AcceptSand),
					AcceptSilhouette:       bool(meshNode.Render_Options.AcceptSilhouette),
					AcceptSnow:             bool(meshNode.Render_Options.AcceptSnow),
					AlwaysRender:           bool(meshNode.Render_Options.AlwaysRender),
					SortType:               int8(meshNode.Render_Options.SortType),
					VisibilityOccluder:     bool(meshNode.Render_Options.VisibilityOccluder),
					UseVisAreas:            bool(meshNode.Render_Options.UseVisAreas),
					LodRatio:               lodRatio(meshNode.Render_Options),
					LodMinScreenPct:        lodMinScreenPct(meshNode.Render_Options),
				})

			case nwt.SkinnedMeshComponent:
				actionList := actionLists[entity.Id.Id]
				timelines := timelineLayers[entity.Id.Id]
				if character := LoadViewerCharacter(assets, v, aoiRadius, actionList, paperdoll, timelines); character != nil {
					viewerEntity.Components = append(viewerEntity.Components, *character)
					result.characterReach = character.MaxViewDistance
				}
			case nwt.EncounterManagerComponent:
				result.Encounter = string(entity.Name)
				for _, spawner := range loadEncounterSpawners(assets, slice, &entity, v, track) {
					viewerEntity.Components = append(viewerEntity.Components, spawner)
				}
			case nwt.NpcComponent:
				result.Npc = true
			case nwt.VitalsComponent:
				result.Creature = true
			case nwt.SpawnerComponent:
				facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.SpawnerComponentServerFacet)
				if !ok {
					continue
				}
				list := make([]nwt.AzAsset, 0)
				list = utils.AppendUniqNoZero(list, facet.M_sliceAsset)
				list = utils.AppendUniqNoZero(list, facet.M_aliasAsset)
				asset := findSpawnTarget(assets, list)
				if asset == nil {
					continue
				}

				track(asset.AssetId, "")
				viewerEntity.Components = append(viewerEntity.Components, ViewerSpawnerComponent{
					Type: SpawnerComponentName,
					Slice: AssetReference{
						Guid:  asset.Guid,
						SubId: asset.SubID,
						Hint:  asset.File,
					},
				})
			case nwt.PointSpawnerComponent:
				list := make([]nwt.AzAsset, 0)
				list = utils.AppendUniqNoZero(list, v.BaseClass1.M_sliceAsset)
				list = utils.AppendUniqNoZero(list, v.BaseClass1.M_aliasAsset)
				asset := findSpawnTarget(assets, list)
				if asset == nil {
					continue
				}
				track(asset.AssetId, "")
				autoSpawn := true
				var patrol *ViewerPatrolPath
				if facet, ok := v.BaseClass1.BaseClass1.M_serverFacetPtr.(nwt.PointSpawnerComponentServerFacet); ok {
					autoSpawn = bool(facet.M_autoSpawnEnabled)
					patrol = loadPatrolPath(slice, facet.M_patrolPathEntity)
				}
				viewerEntity.Components = append(viewerEntity.Components, ViewerPointSpawnerComponent{
					Type: PointSpawnerComponentName,
					Slice: AssetReference{
						Guid:  asset.Guid,
						SubId: asset.SubID,
						Hint:  asset.File,
					},
					AutoSpawn:   autoSpawn,
					TriggerOnly: !bool(v.BaseClass1.M_spawnOnInitialize) || !autoSpawn,
					TimeOfDay:   timeOfDay,
					Patrol:      patrol,
					OnGround:    spawnerOnGround(&entity),
				})
			case nwt.PrefabSpawnerComponent:
				list := make([]nwt.AzAsset, 0)
				list = utils.AppendUniqNoZero(list, v.M_sliceAsset)
				list = utils.AppendUniqNoZero(list, v.M_aliasAsset)
				asset := findSpawnTarget(assets, list)
				spawnedVariant := string(v.M_sliceVariant)
				if changes != nil {
					if changes.hidden {
						continue
					}
					if changes.spawnerSet {
						// an empty cell clears the slice, the spawner spawns nothing
						asset = nil
						if changes.spawnerSlice != "" {
							asset = assets.Catalog.FindByFile(changes.spawnerSlice)
						}
					}
					if changes.spawnerVariantSet {
						spawnedVariant = changes.spawnerVariant
					}
				}
				if asset == nil {
					continue
				}
				spawnedVariant = strings.ToLower(spawnedVariant)
				track(asset.AssetId, spawnedVariant)
				viewerEntity.Components = append(viewerEntity.Components, ViewerPrefabSpawnerComponent{
					Type: PrefabSpawnerComponentName,
					Slice: AssetReference{
						Guid:    asset.Guid,
						SubId:   asset.SubID,
						Hint:    asset.File,
						Variant: spawnedVariant,
					},
					TriggerOnly: !bool(v.M_spawnOnInitialize),
					TimeOfDay:   timeOfDay,
				})
			case nwt.AreaSpawnerComponent:
				facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
				if !ok {
					break
				}
				list := make([]nwt.AzAsset, 0)
				list = utils.AppendUniqNoZero(list, facet.M_sliceAsset)
				list = utils.AppendUniqNoZero(list, facet.M_aliasAsset)
				asset := findSpawnTarget(assets, list)
				if asset == nil {
					continue
				}

				locations := make([]mat4.Data, 0)
				for _, loc := range facet.M_locations.Element {
					entity := game.FindEntityById(slice, loc.EntityId.Id)
					if entity == nil {
						continue
					}
					locations = append(locations, game.FindEntityTransformMat4(entity))
				}
				track(asset.AssetId, "")
				viewerEntity.Components = append(viewerEntity.Components, ViewerAreaSpawnerComponent{
					Type: AreaSpawnerComponentName,
					Slice: AssetReference{
						Guid:  asset.Guid,
						SubId: asset.SubID,
						Hint:  asset.File,
					},
					Locations:        locations,
					MinResspawnRange: float32(facet.M_minRespawnRange),
					MaxRespawnRange:  float32(facet.M_maxRespawnRange),
					LiveCount:        int(facet.M_liveCount),
					SpawnOnEnable:    bool(facet.M_spawnOnEnable),
					SpawnOnTrigger:   bool(facet.M_spawnOnTrigger),
					TriggerOnly:      !bool(facet.M_spawnOnEnable),
					TimeOfDay:        timeOfDay,
				})
			case nwt.SplineComponent:
				// used by roads and rivers, see LoadViewerRoad below
			case nwt.FogVolumeComponent:
				if volume := LoadViewerFogVolume(&entity, v); volume != nil {
					viewerEntity.Components = append(viewerEntity.Components, *volume)
				}
			case nwt.DecalComponent:
				if decal := LoadViewerDecal(assets, v); decal != nil {
					viewerEntity.Components = append(viewerEntity.Components, *decal)
				}
			case nwt.GameRigidBodyComponent:
				if collider := loadCollider(assets, &entity, v); collider != nil {
					viewerEntity.Components = append(viewerEntity.Components, *collider)
				}
			case nwt.HitVolumeComponent, nwt.DetectionVolumeComponent, nwt.TriggerAreaComponent:
				if volume := loadVolume(&entity, v); volume != nil {
					viewerEntity.Components = append(viewerEntity.Components, *volume)
				}
			case nwt.LightComponent:
				viewerEntity.Components = append(viewerEntity.Components, ViewerLightComponent{
					Type:  LightComponentName,
					Light: LoadViewerLight(assets, v.LightConfiguration),
				})

			case nwt.PrefabReferencerComponent:
				refs := ViewerPrefabReferencerComponent{
					Type:   PrefabReferencerComponentName,
					Slices: make([]AssetReference, 0),
				}
				for _, it := range v.Slice_Asset_List.Element {
					asset := findAsset(assets, []nwt.AzAsset{it})
					if asset == nil {
						continue
					}
					track(asset.AssetId, "")
					refs.Slices = append(refs.Slices, AssetReference{
						Guid:  asset.Guid,
						SubId: asset.SubID,
						Hint:  asset.File,
					})
				}
				if len(refs.Slices) > 0 {
					viewerEntity.Components = append(viewerEntity.Components, refs)
				}
			case nwt.MeshMergerComponent:
				// TODO:
			case nwt.RiverComponent, nwt.RoadComponent:
				// see LoadViewerRoad below
			case nwt.ParticleComponent:
				if particle := LoadViewerParticle(assets, v); particle != nil {
					viewerEntity.Components = append(viewerEntity.Components, *particle)
				}
			case nwt.CameraComponent:
				viewerEntity.Components = append(viewerEntity.Components, ViewerCameraComponent{
					Type: CameraComponentName,
					Fov:  float32(v.Field_of_View),
					Near: float32(v.Near_Clip_Plane_Distance),
					Far:  float32(v.Far_Clip_Plane_Distance),
				})
			case nwt.SnowComponent:
				viewerEntity.Components = append(viewerEntity.Components, *LoadViewerSnow(v))
			case nwt.WaterOceanComponent:
				viewerEntity.Components = append(viewerEntity.Components, *LoadViewerWaterOcean(v))
			case nwt.VegetationAreaComponent:
				// TODO:
			case nwt.TimeOfDayPOIComponent:
				tod := LoadViewerTimeOfDay(assets, &entity, v)
				if tod == nil {
					continue
				}

				if asset := findAsset(assets, utils.AppendUniqNoZero([]nwt.AzAsset{}, v.Configuration.SliceAsset)); asset != nil {
					track(asset.AssetId, "")
					tod.Sky = &AssetReference{
						Guid:  asset.Guid,
						SubId: asset.SubID,
						Hint:  asset.File,
					}
				}

				viewerEntity.Components = append(viewerEntity.Components, *tod)
			}
		}

		// road and river need both their own and the spline component
		if road := LoadViewerRoad(&entity); road != nil {
			viewerEntity.Components = append(viewerEntity.Components, *road)
		}

		// water volume needs both its own and the shape component
		if water := LoadViewerWaterVolume(&entity); water != nil {
			viewerEntity.Components = append(viewerEntity.Components, *water)
		}

		// audio trigger collects its preloads and the shape it may follow
		if audio := LoadViewerAudioTrigger(&entity, followers); audio != nil {
			viewerEntity.Components = append(viewerEntity.Components, *audio)
		}

		// instance audio scripts (dungeon and trial ambience loaders, audio areas)
		viewerEntity.Components = append(viewerEntity.Components, LoadViewerAudioScripts(&entity)...)

		// territory needs both the territory data provider and the polygon prism
		if territory := LoadViewerTerritory(assets, &entity); territory != nil {
			viewerEntity.Components = append(viewerEntity.Components, *territory)
		}

		if len(viewerEntity.Components) > 0 {
			result.Entities = append(result.Entities, viewerEntity)
		}
	}

	return result, nil
}

func findAsset(assets *game.Assets, list []nwt.AzAsset) *catalog.Asset {
	if len(list) == 0 {
		return nil
	}

	isEmpty := true
	for _, asset := range list {
		if catalog.UUID(asset.Guid).IsZeroOrEmpty() {
			continue
		}

		isEmpty = false

		result := assets.Catalog.Find(asset.Guid, asset.Subid, asset.Type, asset.Hint)
		if result != nil {
			return result
		}
	}

	if !isEmpty {
		slog.Warn("asset not found in catalog", "tried", list)
	}

	return nil
}

// lodRatio returns the LOD ratio of the render options, 0 for the default (100) so it is omitted in json
func lodRatio(options nwt.MeshRenderOptions) uint32 {
	if options.LODRatio == 100 {
		return 0
	}
	return uint32(options.LODRatio)
}

func lodMinScreenPct(options nwt.MeshRenderOptions) []float32 {
	if len(options.Lod_MinScreenPct.Element) == 0 {
		return nil
	}
	result := make([]float32, len(options.Lod_MinScreenPct.Element))
	for i, value := range options.Lod_MinScreenPct.Element {
		result[i] = float32(value)
	}
	return result
}
