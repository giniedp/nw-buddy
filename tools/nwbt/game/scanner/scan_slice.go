package scanner

import (
	"iter"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
	"strings"
)

func (ctx *Scanner) ScanSliceComponentForData(slice *nwt.SliceComponent, source string) []SliceData {
	// TODO: get rid of this function

	result := make([]SliceData, 0)
	for entity, components := range game.EntitiesOf(slice) {
		data := SliceData{
			Entity:    entity,
			Trace:     []any{source},
			Transform: game.FindTransform(entity),
		}

		for _, component := range components {
			switch v := component.(type) {
			case nwt.NameComponent:
				data.Name = string(v.M_name)
			case nwt.NpcComponent:
				if data.NpcID == "" {
					data.NpcID = string(v.M_npckey)
				}
			case nwt.VitalsComponent:
				if data.VitalsID == "" {
					data.VitalsID = string(v.M_rowreference)
				}
			case nwt.ActionListComponent:
				if data.DamageTable == "" {
					data.DamageTable = string(v.M_damagetable.Asset.BaseClass1.AssetPath)
				}
				if data.AdbFile == "" {
					data.AdbFile = string(v.M_animationdatabase.BaseClass1.AssetPath)
				}
				for _, tag := range v.M_defaulttags.Element {
					data.Tags = utils.AppendUniqNoZero(data.Tags, string(tag))
				}
			case nwt.AIVariantProviderComponent:
				facet := v.BaseClass1.M_serverFacetPtr
				switch f := facet.(type) {
				case nwt.AIVariantProviderComponentServerFacet:
					if data.VitalsID == "" {
						data.VitalsID = string(f.M_vitalstablerowid)
					}
					if data.CategoryID == "" {
						data.CategoryID = string(f.M_vitalscategorytablerowid)
					}
					if data.Level == 0 {
						data.Level = int(f.M_vitalslevel)
					}
					if !data.TerritoryLevel {
						data.TerritoryLevel = bool(f.M_useterritoryleveloverride)
						// TODO: what is M_useterritorypostfixoverride ?
					}
				}
			case nwt.VariationDataComponent:
				if data.VariantID == "" {
					data.VariantID = string(v.M_selectedvariant)
				}
			case nwt.GatherableControllerComponent:
				if data.GatherableID == "" {
					data.GatherableID = string(v.M_gatherableentryid)
				}
			case nwt.ReadingInteractionComponent:
				data.LoreIDs = utils.AppendUniqNoZero(data.LoreIDs, string(v.M_loreid))
			case nwt.SkinnedMeshComponent:
				if data.ModelFile != "" || !v.Skinned_Mesh_Render_Node.Visible {
					break
				}
				if file, err := ctx.LookupFileByAsset(v.Skinned_Mesh_Render_Node.Skinned_Mesh); err == nil && file != nil {
					data.ModelFile = file.Path()
				}
				if file, err := ctx.LookupFileByAsset(v.Skinned_Mesh_Render_Node.Material_Override_Asset); err == nil && file != nil {
					data.MtlFile = file.Path()
				}
			case nwt.MeshComponent:
				if data.ModelFile != "" || !v.Static_Mesh_Render_Node.Visible {
					break
				}
				if file, err := ctx.LookupFileByAsset(v.Static_Mesh_Render_Node.Static_Mesh); err == nil && file != nil {
					data.ModelFile = file.Path()
				}
				if file, err := ctx.LookupFileByAsset(v.Static_Mesh_Render_Node.Material_Override_Asset); err == nil && file != nil {
					data.MtlFile = file.Path()
				}
			case nwt.HousingPlotComponent:
				if data.HouseType == "" {
					data.HouseType = string(v.M_housetypestring)
				}
			case nwt.AssemblyComponent:
				if data.StationID == "" {
					data.StationID = string(v.M_craftingstationreference.M_craftingstationentry)
				}
			case nwt.TradingPostComponent:
				if data.StructureType == "" {
					data.StructureType = "TradingPost"
				}
			case nwt.StorageComponent:
				ptr := v.BaseClass1.M_clientFacetPtr
				if facet, ok := ptr.(nwt.StorageComponentClientFacet); ok && !bool(facet.M_showPreview) && bool(v.M_isPlayerUniqueStorage) {
					data.StructureType = "Storage"
				}
			}
		}
		result = append(result, data)
	}
	return result
}

type SpawnNode struct {
	VariantID      string
	GatherableID   string
	LoreIDs        []string
	Encounter      string
	Spawner        string
	Name           string
	VitalsID       string
	NpcID          string
	CategoryID     string
	Level          int
	TerritoryLevel bool
	DamageTable    string
	ModelFile      string
	MtlFile        string
	AdbFile        string
	Position       nwt.AzVec3
	HouseType      string
	StationID      string
	StructureType  string
	Tags           []string
	Trace          []any
}

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
	ctxModelFile            = "modelFile"
	ctxMtlFile              = "mtlFile"
	ctxAdbFile              = "adbFile"
	ctxDamageTable          = "damageTable"
	ctxVariantId            = "variantId"
	ctxGatherableId         = "gatherableId"
	ctxVitalsTags           = "vitalsTags"
	ctxEncounterName        = "encounterName"
	ctxSpawnerName          = "spawnerName"
	ctxHotspotType          = "hotspotType"
)

func (ctx *Scanner) ScanSlice(file nwfs.File) iter.Seq[SpawnNode] {
	return func(yield func(SpawnNode) bool) {
		if file == nil {
			return
		}

		ctx.Assets.WalkSlice(file, func(node *game.SliceNode) {
			hasVital := false
			hasGatherable := false
			hasHotspot := false
			hasVariant := false

			for _, component := range node.Components {
				switch v := component.(type) {
				case nwt.VariationDataComponent:
					if v.M_selectedvariant != "" {
						hasVariant = true
						node.ContextProvideIfMissing(ctxVariantId, string(v.M_selectedvariant))
					}
				case nwt.GatherableControllerComponent:
					if v.M_gatherableentryid != "" {
						hasGatherable = true
						node.ContextStrSet(ctxGatherableId, string(v.M_gatherableentryid)) // do not inherit
					}
				case nwt.FishingHotspotComponent:
					if v.M_fishinghotspottype != "" {
						hasHotspot = true
						node.ContextStrSet(ctxHotspotType, string(v.M_fishinghotspottype))
					}
				case nwt.VitalsComponent:
					if v.M_rowreference != "" {
						hasVital = true
						node.ContextProvideIfMissing(ctxVitalsId, string(v.M_rowreference))
					}
				case nwt.ActionListComponent:
					if v.M_damagetable.Asset.BaseClass1.AssetPath != "" {
						node.ContextProvideIfMissing(ctxDamageTable, string(v.M_damagetable.Asset.BaseClass1.AssetPath))
					}
					if v.M_animationdatabase.BaseClass1.AssetPath != "" {
						node.ContextProvideIfMissing(ctxAdbFile, string(v.M_animationdatabase.BaseClass1.AssetPath))
					}
					tags := make([]string, 0)
					for _, tag := range v.M_defaulttags.Element {
						tags = utils.AppendUniqNoZero(tags, string(tag))
					}
					if len(tags) > 0 {
						node.ContextProvideIfMissing(ctxVitalsTags, tags)
					}
				case nwt.AIVariantProviderComponent:
					facet := v.BaseClass1.M_serverFacetPtr
					switch f := facet.(type) {
					case nwt.AIVariantProviderComponentServerFacet:
						if f.M_vitalstablerowid != "" {
							node.ContextProvideIfMissing(ctxVitalsId, string(f.M_vitalstablerowid))
						}
						if f.M_vitalscategorytablerowid != "" {
							node.ContextProvideIfMissing(ctxVitalsCategoryId, string(f.M_vitalscategorytablerowid))
						}
						if f.M_vitalslevel != 0 {
							node.ContextProvideIfMissing(ctxVitalsLevel, int(f.M_vitalslevel))
						}
						if f.M_useterritoryleveloverride {
							node.ContextProvideIfMissing(ctxVitalsTerritoryLevel, bool(f.M_useterritoryleveloverride))
						}
					}

				case nwt.SkinnedMeshComponent:
					if !v.Skinned_Mesh_Render_Node.Visible {
						break
					}
					if file, err := ctx.LookupFileByAsset(v.Skinned_Mesh_Render_Node.Skinned_Mesh); err == nil && file != nil {
						node.ContextProvideIfMissing(ctxModelFile, file.Path())
					}
					if file, err := ctx.LookupFileByAsset(v.Skinned_Mesh_Render_Node.Material_Override_Asset); err == nil && file != nil {
						node.ContextProvideIfMissing(ctxMtlFile, file.Path())
					}
				case nwt.MeshComponent:
					if !v.Static_Mesh_Render_Node.Visible {
						break
					}
					if file, err := ctx.LookupFileByAsset(v.Static_Mesh_Render_Node.Static_Mesh); err == nil && file != nil {
						node.ContextProvideIfMissing(ctxModelFile, file.Path())
					}
					if file, err := ctx.LookupFileByAsset(v.Static_Mesh_Render_Node.Material_Override_Asset); err == nil && file != nil {
						node.ContextProvideIfMissing(ctxMtlFile, file.Path())
					}
				case nwt.FtueIslandComponent:
					result := SpawnNode{
						Name:     string(node.Entity.Name),
						VitalsID: "Player",
						Position: mat4.PositionOf(node.Transform),
					}
					if !yield(result) {
						return
					}
				case nwt.NpcComponent:
					npcId := string(v.M_npckey)
					if npcId != "" {
						result := SpawnNode{
							Name: findName(node),
							//Encounter: encounterType,
							NpcID:    npcId,
							Position: mat4.PositionOf(node.Transform),
						}
						if !yield(result) {
							return
						}
					}
				case nwt.ReadingInteractionComponent:
					result := SpawnNode{
						Name:     findName(node),
						LoreIDs:  []string{string(v.M_loreid)},
						Position: mat4.PositionOf(node.Transform),
					}
					if !yield(result) {
						return
					}
				case nwt.HousingPlotComponent:
					result := SpawnNode{
						Name:      findName(node),
						HouseType: string(v.M_housetypestring),
						Position:  mat4.PositionOf(node.Transform),
					}
					if !yield(result) {
						return
					}
				case nwt.AssemblyComponent:
					result := SpawnNode{
						Name:      findName(node),
						StationID: string(v.M_craftingstationreference.M_craftingstationentry),
						Position:  mat4.PositionOf(node.Transform),
					}
					if !yield(result) {
						return
					}
				case nwt.TradingPostComponent:
					result := SpawnNode{
						Name:          findName(node),
						StructureType: "TradingPost",
						Position:      mat4.PositionOf(node.Transform),
					}
					if !yield(result) {
						return
					}
				case nwt.StorageComponent:
					ptr := v.BaseClass1.M_clientFacetPtr
					if facet, ok := ptr.(nwt.StorageComponentClientFacet); ok && !bool(facet.M_showPreview) && bool(v.M_isPlayerUniqueStorage) {
						result := SpawnNode{
							Name:          findName(node),
							StructureType: "Storage",
							Position:      mat4.PositionOf(node.Transform),
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

			vitalId := node.ContextStrGet(ctxVitalsId)
			if vitalId != "" && hasVital {
				result := SpawnNode{
					VitalsID:       vitalId,
					Position:       mat4.PositionOf(node.Transform),
					CategoryID:     node.ContextStrGet(ctxVitalsCategoryId),
					Level:          node.ContextIntGet(ctxVitalsLevel),
					TerritoryLevel: node.ContextBoolGet(ctxVitalsTerritoryLevel),
					DamageTable:    node.ContextStrGet(ctxDamageTable),
					ModelFile:      node.ContextStrGet(ctxModelFile),
					MtlFile:        node.ContextStrGet(ctxMtlFile),
					AdbFile:        node.ContextStrGet(ctxAdbFile),
					Tags:           node.ContextStrArrGet(ctxVitalsTags),
					Encounter:      encounter,
				}
				if !yield(result) {
					return
				}
			}

			gatherableId := node.ContextStrGet(ctxGatherableId)
			variantId := node.ContextStrGet(ctxVariantId)
			if (gatherableId != "" || variantId != "") && (hasGatherable || hasVariant) {
				result := SpawnNode{
					GatherableID: gatherableId,
					VariantID:    variantId,
					Position:     mat4.PositionOf(node.Transform),
					Encounter:    encounter,
				}
				if !yield(result) {
					return
				}
			}
			hotspotType := node.ContextStrGet(ctxHotspotType)
			if (hotspotType != "" || variantId != "") && (hasHotspot || hasVariant) {
				result := SpawnNode{
					GatherableID: hotspotType,
					VariantID:    variantId,
					Position:     mat4.PositionOf(node.Transform),
					Encounter:    encounter,
				}
				if !yield(result) {
					return
				}
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
					node.WalkAsset(facet.M_spawnonhitasset)
				case nwt.ProjectileSpawnerComponent:
					ammoId := string(v.M_ammoid)
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
					tmpTm := node.Transform

					if encounterFallback != "" {
						node.ContextProvideIfMissing(ctxSpawnerName, encounterFallback)
					}
					for _, loc := range facet.M_locations.Element {
						entity := game.FindEntityById(node.Slice, loc.EntityId.Id)
						if entity == nil {
							continue
						}
						node.Transform = mat4.Multiply(tmpTm, game.FindTransformMat4(entity))
						assets := make([]nwt.AzAsset, 0)
						assets = utils.AppendUniqNoZero(assets, facet.M_sliceAsset)
						assets = utils.AppendUniqNoZero(assets, facet.M_aliasAsset)
						for _, asset := range assets {
							node.WalkAsset(asset)
						}
					}
					node.Transform = tmpTm
				case nwt.EncounterManagerComponent:
					tmpTm := node.Transform
					// node.Entity.Name
					node.ContextSetValue(ctxEncounterName, game.ParseEncounterName(string(node.Entity.Name)))
					if encounterFallback != "" {
						node.ContextProvideIfMissing(ctxSpawnerName, encounterFallback)
					}
					for _, spawn := range game.WalkEncounterSpawns(node.Slice, v.M_stages.Element) {
						assets := make([]nwt.AzAsset, 0)
						assets = utils.AppendUniqNoZero(assets, spawn.M_sliceAsset)
						assets = utils.AppendUniqNoZero(assets, spawn.M_aliasAsset)
						if len(spawn.M_spawnlocations.Element) == 0 && spawn.M_count > 0 {
							for _, asset := range assets {
								node.WalkAsset(asset)
							}
						} else {
							for _, location := range spawn.M_spawnlocations.Element {
								entity := game.FindEntityById(node.Slice, location.EntityId.Id)
								if entity == nil {
									continue
								}
								node.Transform = mat4.Multiply(tmpTm, game.FindTransformMat4(entity))
								for _, asset := range assets {
									node.WalkAsset(asset)
								}
							}
						}
					}
					node.Transform = tmpTm
				}
			}
		})
	}
}

func getSpawnerName(name string) string {
	name = strings.ToLower(name)
	if strings.Contains(name, "lootgoblin") {
		// e.g.: "WorldEvent_LootGoblin_Spawner_16BS"
		return "goblin"
	}
	if strings.Contains(name, "randomencounter") {
		// e.g.: "WorldEvent_RandomEncounter_Spawner_16BS06"
		return "random"
	}
	return ""
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
