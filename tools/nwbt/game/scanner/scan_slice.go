package scanner

import (
	"fmt"
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/vshapec"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
	"path"
	"slices"
	"strings"
)

func findName(node *game.SliceNode) string {
	for _, component := range node.Components {
		switch v := component.(type) {
		case nwt.NameComponent:
			return string(v.M_name)
		}
	}
	return ""
}

const (
	ctxVitalsId             = "vitalsId"
	ctxVitalsCategoryId     = "vitalsCategoryId"
	ctxVitalsLevel          = "vitalsLevel"
	ctxVitalsTerritoryLevel = "vitalsTerritoryLevel"
	ctxVariantId            = "variantId"
	ctxGatherableId         = "gatherableId"
	ctxEncounterRef         = "encounterRef"
	ctxEncounterName        = "encounterName"
	ctxSpawnerName          = "spawnerName"
	ctxHotspotType          = "hotspotType"
	ctxLuckConstraint       = "luckConstraint"
	ctxTodConstraint        = "todConstraint"
)

func (ctx *Scanner) ScanSlice(file nwfs.File) iter.Seq[Spawn] {
	return func(yield func(Spawn) bool) {
		if file == nil {
			return
		}

		options := game.SliceWalkOptions{
			// entities below an encounter manager belong to its encounter
			InheritKeys: []string{ctxEncounterRef, ctxEncounterName, ctxSpawnerName},
		}
		ctx.Assets.WalkSliceWith(file, options, func(node *game.SliceNode) {
			hasVital := false
			ownVitalsId := ""
			damageTable := ""
			hasGatherable := false
			hasHotspot := false
			hasVariant := false
			poiConfig := ""
			var poiConfigShapes [][]nwt.AzVec2

			for _, component := range node.Components {
				switch v := component.(type) {
				case nwt.POIManagerComponent:
					if facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.POIManagerComponentServerFacet); ok {
						poiConfig = string(facet.Config_name)
					}
				case nwt.HubLocalCacheComponent:
					for _, el := range v.M_detectorDescriptors.Element {
						poiConfigShapes = append(poiConfigShapes, ctx.buildDetectorShape(node, el))
					}
				case nwt.VariationDataComponent:
					if v.M_selectedVariant != "" {
						hasVariant = true
						node.ContextProvideIfMissing(ctxVariantId, string(v.M_selectedVariant))
					}
				case nwt.GatherableControllerComponent:
					if v.M_gatherableEntryId != "" {
						hasGatherable = true
						node.ContextStrSet(ctxGatherableId, string(v.M_gatherableEntryId)) // do not inherit
					}
				case nwt.FishingHotspotComponent:
					if v.M_fishingHotspotType != "" {
						hasHotspot = true
						node.ContextStrSet(ctxHotspotType, string(v.M_fishingHotspotType))
					}
				case nwt.VitalsComponent:
					hasVital = true
					ownVitalsId = string(v.M_rowReference)
				case nwt.TimeOfDayConstraintComponent:
					if facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.TimeOfDayConstraintComponentServerFacet); ok {
						node.ContextStrSet(ctxTodConstraint, encodeTimeOfDay(facet))
					}
				case nwt.LuckConstraintComponent:
					if facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.LuckConstraintComponentServerFacet); ok {
						node.ContextFloatSet(ctxLuckConstraint, float32(facet.M_successProbability))
					}
				case nwt.TagComponent:
				case nwt.ActionListComponent:
					damageTable = vitalTableName(v)
				case nwt.FtueIslandComponent:
					result := &VitalsEntry{
						VitalsID: "Player",
						spawn: spawn{
							Position: mat4.PositionOf(node.Transform),
						},
					}
					if !yield(result) {
						return
					}
				case nwt.NpcComponent:
					npcId := string(v.M_npcKey)
					if npcId != "" {
						result := &NpcEntry{
							NpcID: npcId,
							spawn: spawn{
								Position: mat4.PositionOf(node.Transform),
							},
						}
						if !yield(result) {
							return
						}
					}
				case nwt.ReadingInteractionComponent:
					result := &LorenoteEntry{
						LoreID: string(v.M_loreId),
						spawn: spawn{
							Position: mat4.PositionOf(node.Transform),
						},
					}
					if !yield(result) {
						return
					}
				case nwt.HousingPlotComponent:
					result := &HouseEntry{
						HouseID: string(v.M_houseTypeString),
						spawn: spawn{
							Position: mat4.PositionOf(node.Transform),
						},
					}
					if !yield(result) {
						return
					}
				case nwt.AssemblyComponent:
					result := &StationEntry{
						Name:      findName(node),
						StationID: string(v.M_craftingStationReference.M_craftingStationEntry),
						spawn: spawn{
							Position: mat4.PositionOf(node.Transform),
						},
					}
					if !yield(result) {
						return
					}
				case nwt.TradingPostComponent:
					result := &StructureEntry{
						Name:   findName(node),
						TypeID: "TradingPost",
						spawn: spawn{
							Position: mat4.PositionOf(node.Transform),
						},
					}
					if !yield(result) {
						return
					}
				case nwt.StorageComponent:
					ptr := v.BaseClass1.M_clientFacetPtr
					if facet, ok := ptr.(nwt.StorageComponentClientFacet); ok && !bool(facet.M_showPreview) && bool(v.M_isPlayerUniqueStorage) {
						result := &StructureEntry{
							Name:   findName(node),
							TypeID: "Storage",
							spawn: spawn{
								Position: mat4.PositionOf(node.Transform),
							},
						}
						if !yield(result) {
							return
						}
					}
				}
			}

			encounterFallback := getEncounterFallback(node.Slice)
			if encounterFallback == "" {
				encounterFallback = node.ContextStrGet(ctxSpawnerName)
			}
			encounter := node.ContextStrGet(ctxEncounterName)
			if encounter == "" {
				encounter = encounterFallback
			}

			// the spawner's variant replaces the entity's own row
			vitalId := node.ContextStrGet(ctxVitalsId)
			if vitalId == "" {
				vitalId = ownVitalsId
			}
			if vitalId != "" && hasVital {
				gatherableId := ""
				if hasGatherable {
					gatherableId = node.ContextStrGet(ctxGatherableId)
				}
				result := &VitalsEntry{
					spawn: spawn{
						Position: mat4.PositionOf(node.Transform),
					},

					Encounter:    encounter,
					GatherableID: gatherableId,
					VitalsID:     vitalId,
					CategoryID:   node.ContextStrGet(ctxVitalsCategoryId),
					Level:        node.ContextIntGet(ctxVitalsLevel),
					UseZoneLevel: node.ContextBoolGet(ctxVitalsTerritoryLevel),
					DamageTable:  damageTable,
					Model:        ctx.vitalModel(node),
					Tod:          node.ContextStrGet(ctxTodConstraint),
					Luck:         node.ContextFloatPtrOrNil(ctxLuckConstraint),
				}
				if !yield(result) {
					return
				}
			}

			gatherableId := node.ContextStrGet(ctxGatherableId)
			variantId := node.ContextStrGet(ctxVariantId)
			if (gatherableId != "" || variantId != "") && (hasGatherable || hasVariant) {
				if gatherableId != "" && variantId == "" {
					result := &GatherableEntry{
						spawn: spawn{
							Position:  mat4.PositionOf(node.Transform),
							Encounter: encounter,
						},
						GatherableID: gatherableId,
					}
					if !yield(result) {
						return
					}
				}
				if variantId != "" {
					result := &VariantEntry{
						spawn: spawn{
							Position:  mat4.PositionOf(node.Transform),
							Encounter: encounter,
						},
						VariantID:    variantId,
						GatherableID: gatherableId,
					}
					if !yield(result) {
						return
					}
				}
			}
			hotspotType := node.ContextStrGet(ctxHotspotType)
			if (hotspotType != "" || variantId != "") && (hasHotspot || hasVariant) {
				if hotspotType != "" && variantId == "" {
					result := &GatherableEntry{
						spawn: spawn{
							Position:  mat4.PositionOf(node.Transform),
							Encounter: encounter,
						},
						GatherableID: hotspotType,
					}
					if !yield(result) {
						return
					}
				}
				if variantId != "" {
					result := &VariantEntry{
						spawn: spawn{
							Position:  mat4.PositionOf(node.Transform),
							Encounter: encounter,
						},
						VariantID:    variantId,
						GatherableID: hotspotType,
					}
					if !yield(result) {
						return
					}
				}
			}

			if poiConfig != "" && len(poiConfigShapes) > 0 {
				for _, shape := range poiConfigShapes {
					result := &ZoneConfigEntry{
						Config: poiConfig,
						Shape:  transformShape(shape, node.Transform),
						spawn:  spawn{},
					}
					if !yield(result) {
						return
					}
				}
			}

			if game.HasSpawner(node.Components) {
				provideSpawnVariant(node)
			}
			for _, component := range node.Components {
				switch v := component.(type) {
				case nwt.SpawnerComponent:
					facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.SpawnerComponentServerFacet)
					if !ok {
						continue
					}
					assets := make([]nwt.AzAsset, 0)
					assets = utils.AppendUniqNoZero(assets, facet.M_sliceAsset)
					assets = utils.AppendUniqNoZero(assets, facet.M_aliasAsset)
					if encounterFallback != "" {
						node.ContextProvideIfMissing(ctxSpawnerName, encounterFallback)
					}
					for _, asset := range assets {
						node.WalkAsset(asset)
					}
				case nwt.PointSpawnerComponent:
					assets := make([]nwt.AzAsset, 0)
					assets = utils.AppendUniqNoZero(assets, v.BaseClass1.M_sliceAsset)
					assets = utils.AppendUniqNoZero(assets, v.BaseClass1.M_aliasAsset)

					if encounterFallback != "" {
						node.ContextProvideIfMissing(ctxSpawnerName, encounterFallback)
					}
					for _, asset := range assets {
						node.WalkAsset(asset)
					}
				case nwt.PrefabSpawnerComponent:
					if variantId := string(v.M_sliceVariant); variantId != "" {
						node.ContextProvideIfMissing(ctxVariantId, variantId)
					}
					assets := make([]nwt.AzAsset, 0)
					assets = utils.AppendUniqNoZero(assets, v.M_sliceAsset)
					assets = utils.AppendUniqNoZero(assets, v.M_aliasAsset)

					if encounterFallback != "" {
						node.ContextProvideIfMissing(ctxSpawnerName, encounterFallback)
					}
					for _, asset := range assets {
						node.WalkAsset(asset)
					}
				case nwt.ProjectileComponent:
					facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.ProjectileComponentServerFacet)
					if !ok {
						continue
					}
					node.WalkAsset(facet.M_spawnOnHitAsset)
				case nwt.ProjectileSpawnerComponent:
					ammoId := string(v.M_ammoId)
					prefabPath := ctx.FindPrefabPathForAmmoId(ammoId)
					file := ctx.ResolveDynamicSliceByName(prefabPath)
					if file != nil {
						node.Walk(file)
					}
				case nwt.AreaSpawnerComponent:
					facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
					if !ok {
						continue
					}
					if encounterFallback != "" {
						node.ContextProvideIfMissing(ctxSpawnerName, encounterFallback)
					}
					assets := make([]nwt.AzAsset, 0)
					assets = utils.AppendUniqNoZero(assets, facet.M_sliceAsset)
					assets = utils.AppendUniqNoZero(assets, facet.M_aliasAsset)
					for _, location := range facet.M_locations.Element {
						if transform, ok := node.LocationTransform(location); ok {
							node.WalkAt(transform, func() {
								for _, asset := range assets {
									node.WalkAsset(asset)
								}
							})
						}
					}
				case nwt.EncounterManagerComponent:
					fileName := utils.ReplaceExt(path.Base(node.File.Path()), "")
					encounter := scanEncounterManagerObject(node, node.Entity, v)
					encounter.Position = mat4.PositionOf(node.Transform)
					encounter.Tag = game.ParseEncounterName(string(node.Entity.Name))
					asset := ctx.Catalog.FindByFile(node.File.Path())
					if asset != nil {
						// assume there is only one encounter manager per file
						encounter.EncounterID = asset.Guid
					} else {
						slog.Warn("Asset not found for", "file", node.File.Path())
						encounter.EncounterID = fmt.Sprintf("%s#%s", fileName, encounter.EncounterID)
					}
					if !yield(&encounter) {
						return
					}

					node.ContextSetValue(ctxEncounterRef, encounter.EncounterID)
					node.ContextSetValue(ctxEncounterName, game.ParseEncounterName(string(node.Entity.Name)))
					if encounterFallback != "" {
						node.ContextProvideIfMissing(ctxSpawnerName, encounterFallback)
					}

					for _, spawn := range game.WalkEncounterSpawns(node.Slice, v.M_stages.Element) {
						assets := make([]nwt.AzAsset, 0)
						assets = utils.AppendUniqNoZero(assets, spawn.M_sliceAsset)
						assets = utils.AppendUniqNoZero(assets, spawn.M_aliasAsset)
						walk := func() {
							for _, asset := range assets {
								node.WalkAsset(asset)
							}
						}
						locations := game.EncounterSpawnLocations(node, spawn)
						if len(locations) == 0 && spawn.M_count > 0 {
							walk()
						}
						for _, location := range locations {
							if transform, ok := node.LocationTransform(location); ok {
								node.WalkAt(transform, walk)
							}
						}
					}
					for _, spawn := range game.WalkEncounterObjectives(node.Slice, v.M_stages.Element) {
						assets := make([]nwt.AzAsset, 0)
						switch objective := spawn.Element.(type) {
						case nwt.SliceDestroyedObjective:
							assets = utils.AppendUniqNoZero(assets, objective.M_trackedSlice)
							assets = utils.AppendUniqNoZero(assets, objective.M_trackedAlias)
						case nwt.SliceSpawnedObjective:
							assets = utils.AppendUniqNoZero(assets, objective.M_trackedSlice)
							assets = utils.AppendUniqNoZero(assets, objective.M_trackedAlias)
						case nwt.BossPhaseObjective:
							assets = utils.AppendUniqNoZero(assets, objective.M_trackedSlice)
							assets = utils.AppendUniqNoZero(assets, objective.M_trackedAlias)
						}
						for _, asset := range assets {
							node.WalkAsset(asset)
						}
					}
				}
			}
		})
	}
}

// provideSpawnVariant sets the vitals variant the entity's spawns take. Empty values clear the variant of spawners
// further up: without a provider, the spawned vitals keep their own row.
func provideSpawnVariant(node *game.SliceNode) {
	facet, _ := game.SpawnVariantProvider(node)
	node.ContextSetValue(ctxVitalsId, nilIfZero(string(facet.M_vitalsTableRowId)))
	node.ContextSetValue(ctxVitalsCategoryId, nilIfZero(string(facet.M_vitalsCategoryTableRowId)))
	node.ContextSetValue(ctxVitalsLevel, nilIfZero(int(facet.M_vitalsLevel)))
	node.ContextSetValue(ctxVitalsTerritoryLevel, nilIfZero(bool(facet.M_useTerritoryLevelOverride)))
}

func nilIfZero[T comparable](value T) any {
	var zero T
	if value == zero {
		return nil
	}
	return value
}

func getEncounterFallback(slice *nwt.SliceComponent) string {
	for entity := range game.EntitiesOf(slice) {
		name := strings.ToLower(string(entity.Name))
		if name == "" {
			continue
		}
		if strings.Contains(name, "randomencounter") {
			return "random"
		}
		if strings.Contains(name, "enc_darkness") {
			return "darkness"
		}
		if strings.Contains(name, "lootgoblin") {
			return "goblin"
		}
	}
	return ""
}

func (ctx *Scanner) buildDetectorShape(node *game.SliceNode, descriptor nwt.HubLocalCacheDetectorDescriptor) []nwt.AzVec2 {
	boundsEntity := game.FindEntityById(node.Slice, descriptor.BoundsEntityId.Id)
	if boundsEntity != nil {
		for _, c := range boundsEntity.Components.Element {
			if p, ok := c.(nwt.PolygonPrismShapeComponent); ok {
				return ctx.readPolygonShape(p)
			}
		}
	}

	result := make([]nwt.AzVec2, 4)
	result[0] = nwt.AzVec2{
		descriptor.BoundsOffset[0] - descriptor.Bounds[0]/2,
		descriptor.BoundsOffset[1] + descriptor.Bounds[1]/2,
	}
	result[1] = nwt.AzVec2{
		descriptor.BoundsOffset[0] + descriptor.Bounds[0]/2,
		descriptor.BoundsOffset[1] + descriptor.Bounds[1]/2,
	}
	result[2] = nwt.AzVec2{
		descriptor.BoundsOffset[0] + descriptor.Bounds[0]/2,
		descriptor.BoundsOffset[1] - descriptor.Bounds[1]/2,
	}
	result[3] = nwt.AzVec2{
		descriptor.BoundsOffset[0] - descriptor.Bounds[0]/2,
		descriptor.BoundsOffset[1] - descriptor.Bounds[1]/2,
	}
	return result
}

func (ctx *Scanner) readPolygonShape(vc nwt.PolygonPrismShapeComponent) []nwt.AzVec2 {
	var vshape []nwt.AzVec2
	var shape []nwt.AzVec2
	prism := vc.Configuration.PolygonPrism.Element.VertexContainer.Vertices.Element
	if len(prism) > 0 {
		shape = slices.Clone(prism)
	}
	if len(shape) > 0 {
		return shape
	}

	file, err := ctx.LookupFileByAssetId(vc.Polygon_Shape_Asset_Id)
	if err != nil {
		slog.Warn("polygon shape asset not found", "err", err)
		return nil
	}
	if file == nil || path.Ext(file.Path()) != ".vshapec" {
		return nil
	}
	shapeRecord, err := vshapec.Load(file)
	if err != nil {
		slog.Warn("failed to load vshapec", "file", file, "err", err)
		return nil
	}
	for _, v := range shapeRecord.Vertices {
		vshape = append(vshape, nwt.AzVec2{nwt.AzFloat32(v[0]), nwt.AzFloat32(v[1])})
	}
	if len(vshape) > 0 {
		return vshape
	}
	return shape
}

func transformShape(shape []nwt.AzVec2, transform mat4.Data) []nwt.AzVec2 {
	result := make([]nwt.AzVec2, 0, len(shape))
	for _, v2 := range shape {
		result = append(result, mat4.TransformVec2(transform, v2))
	}
	return result
}

func encodeTimeOfDay(facet nwt.TimeOfDayConstraintComponentServerFacet) string {
	result := make([]string, 0)
	if facet.M_dawn {
		result = append(result, "dawn")
	}
	if facet.M_day {
		result = append(result, "day")
	}
	if facet.M_dusk {
		result = append(result, "dusk")
	}
	if facet.M_night {
		result = append(result, "night")
	}
	if facet.M_despawnOnTimeEnd {
		result = append(result, "despawn")
	}
	if len(result) > 0 {
		return strings.Join(result, ",")
	}
	return ""
}

func scanEncounterManagerObject(node *game.SliceNode, entity *nwt.AZ__Entity, manager nwt.EncounterManagerComponent) EncounterEntry {
	result := EncounterEntry{
		Name:        string(entity.Name),
		EncounterID: fmt.Sprintf("%v", manager.BaseClass1.BaseClass1.Id),
		Stages:      make([]EncounterStage, 0),
	}

	for _, stage := range manager.M_stages.Element {
		stageEntity := game.FindEntityById(node.Slice, stage.EntityId.Id)
		if stageEntity == nil {
			continue
		}
		encounter := findEncounterComponent(stageEntity)
		if encounter == nil {
			continue
		}
		result.Stages = append(result.Stages, scanEncounterStage(node, stageEntity, encounter))
	}
	return result
}

func scanEncounterStage(node *game.SliceNode, entity *nwt.AZ__Entity, encounter *nwt.EncounterComponent) EncounterStage {
	result := EncounterStage{
		Name:       string(entity.Name),
		Stages:     make([]EncounterStage, 0),
		Objectives: make([]any, 0),
	}
	for _, stage := range encounter.M_stages.Element {
		stageEntity := game.FindEntityById(node.Slice, stage.EntityId.Id)
		if stageEntity == nil {
			continue
		}
		encounter := findEncounterComponent(stageEntity)
		if encounter == nil {
			continue
		}
		result.Stages = append(result.Stages, scanEncounterStage(node, stageEntity, encounter))
	}

	for _, objective := range encounter.M_objectives.Element {
		result.Objectives = append(result.Objectives, objective.Element)
	}
	return result
}

func findEncounterComponent(entity *nwt.AZ__Entity) *nwt.EncounterComponent {
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.EncounterComponent:
			return &v
		}
	}
	return nil
}
