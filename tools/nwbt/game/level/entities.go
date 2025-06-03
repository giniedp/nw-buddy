package level

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
)

const (
	ctxVitalsId         = "vitalsId"
	ctxVitalsLevel      = "vitalsLevel"
	ctxVitalsCategoryId = "vitalsCategory"
	ctxEncounter        = "encounter"
	ctxEncounterName    = "encounterName"
	ctxSpawnerName      = "encounterStage"
	ctxDamageTable      = "damageTable"
	ctxAdbFile          = "adbFile"
)

func LoadEntities(assets *game.Assets, sliceFile string, rootTransform mat4.Data) []EntityInfo {
	file, ok := assets.Archive.Lookup(sliceFile)
	if !ok {
		return nil
	}

	result := make([]EntityInfo, 0)
	contained := make(map[string]bool)
	pushEntity := func(entity EntityInfo) {
		if entity.ID == "" || entity.ID == "0" || entity.Name == "" {
			result = append(result, entity)
			return
		}

		key := fmt.Sprintf("%s-%s-%s-%s-%d-%v", entity.File, entity.ID, entity.Name, entity.Model, entity.ModelInstance, entity.Transform)
		if _, ok := contained[key]; ok {
			return
		}
		contained[key] = true
		result = append(result, entity)
	}

	visitSlice := func(node *game.SliceNode) {
		transform := mat4.Multiply(rootTransform, node.Transform)

		encounter, _ := node.ContextStr(ctxEncounter)
		encounterName, isEncounterTree := node.ContextStr(ctxEncounterName)

		isVital := false
		for _, component := range node.Components {
			switch v := component.(type) {
			case nwt.AIVariantProviderComponent:
				// can override vitals data from higher level components
				// can be catched at `VitalsComponent`
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
					// if f.M_useterritoryleveloverride {
					//   node.ContextProvideIfMissing(ctxVitalsTerritoryLevel, bool(f.M_useterritoryleveloverride))
					// }
				}
			case nwt.VitalsComponent:
				// at this point we can create a vitals instance
				isVital = true
				if v.M_rowreference != "" {
					node.ContextProvideIfMissing(ctxVitalsId, string(v.M_rowreference))
				}
			case nwt.InstancedMeshComponent:
				if isEncounterTree {
					// don't send encounter models to the client to reduce model count
					continue
				}

				meshNode := v.Instanced_mesh_render_node.BaseClass1
				if !meshNode.Visible {
					continue
				}
				modelAsset := meshNode.Static_Mesh
				modelFile, err := assets.LookupFileByAsset(modelAsset)
				if err != nil {
					slog.Error("model file not found", "asset", modelAsset, "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := meshNode.Material_Override_Asset
				materialFile, err := assets.LookupFileByAsset(materialAsset)
				if err != nil {
					slog.Error("material not found", "asset", materialAsset, "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}

				// TODO: instances don't show up correctly. use individual meshes as workaround
				model, material = assets.ResolveCgfAndMtl(model, material)
				for i, instance := range v.Instanced_mesh_render_node.Instance_transforms.Element {
					pushEntity(EntityInfo{
						ID:              fmt.Sprintf("%d", node.Entity.Id.Id),
						Name:            string(node.Entity.Name),
						File:            node.File.Path(),
						Transform:       mat4.Multiply(transform, mat4.FromAzTransform(instance)),
						Model:           model,
						ModelInstance:   i,
						Material:        material,
						MaxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
						Encounter:       encounter,
						EncounterName:   encounterName,
					})
				}
			case nwt.SkinnedMeshComponent:
				meshNode := v.Skinned_Mesh_Render_Node
				if !meshNode.Visible {
					return
				}
				modelAsset := meshNode.Skinned_Mesh
				modelFile, err := assets.LookupFileByAsset(modelAsset)
				if err != nil {
					slog.Error("model file not found", "asset", modelAsset, "err", err)
					return
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := meshNode.Material_Override_Asset
				materialFile, err := assets.LookupFileByAsset(materialAsset)
				if err != nil {
					slog.Error("material not found", "asset", materialAsset, "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}
				pushEntity(EntityInfo{
					ID:              fmt.Sprintf("%d", node.Entity.Id.Id),
					Name:            string(node.Entity.Name),
					File:            node.File.Path(),
					Transform:       transform,
					Model:           model,
					Material:        material,
					MaxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
					Vital:           ResolveVitalSpawnInfo(assets, node),
					Encounter:       encounter,
					EncounterName:   encounterName,
				})
			case nwt.MeshComponent:

				meshNode := v.Static_Mesh_Render_Node
				if !meshNode.Visible {
					continue
				}
				modelAsset := meshNode.Static_Mesh
				modelFile, err := assets.LookupFileByAsset(modelAsset)
				if err != nil {
					slog.Error("model file not found", "asset", modelAsset, "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := meshNode.Material_Override_Asset
				materialFile, err := assets.LookupFileByAsset(materialAsset)
				if err != nil {
					slog.Error("material not found", "asset", materialAsset, "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}

				model, material = assets.ResolveCgfAndMtl(model, material)
				pushEntity(EntityInfo{
					ID:              fmt.Sprintf("%d", node.Entity.Id.Id),
					Name:            string(node.Entity.Name),
					File:            node.File.Path(),
					Transform:       mat4.Multiply(mat4.Identity(), transform),
					Model:           model,
					Material:        material,
					MaxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
					Encounter:       encounter,
					EncounterName:   encounterName,
				})
			case nwt.SpawnerComponent:
				facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.SpawnerComponentServerFacet)
				if !ok {
					continue
				}
				assets := make([]nwt.AzAsset, 0)
				assets = utils.AppendUniqNoZero(assets, facet.M_sliceAsset)
				assets = utils.AppendUniqNoZero(assets, facet.M_aliasAsset)
				for _, asset := range assets {
					node.WalkAsset(asset)
				}
			case nwt.PointSpawnerComponent:
				assets := make([]nwt.AzAsset, 0)
				assets = utils.AppendUniqNoZero(assets, v.BaseClass1.M_sliceAsset)
				assets = utils.AppendUniqNoZero(assets, v.BaseClass1.M_aliasAsset)
				for _, asset := range assets {
					node.WalkAsset(asset)
				}
			case nwt.PrefabSpawnerComponent:
				// if variantId := string(v.M_sliceVariant); variantId != "" {
				//   node.ContextProvideIfMissing(ctxVariantId, variantId)
				// }
				assets := make([]nwt.AzAsset, 0)
				assets = utils.AppendUniqNoZero(assets, v.M_sliceAsset)
				assets = utils.AppendUniqNoZero(assets, v.M_aliasAsset)
				for _, asset := range assets {
					node.WalkAsset(asset)
				}
			case nwt.AreaSpawnerComponent:
				facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
				if !ok {
					break
				}
				tmpTm := node.Transform
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
				node.ContextSetValue(ctxEncounter, string(node.Entity.Name))
				node.ContextSetValue(ctxEncounterName, game.ParseEncounterName(string(node.Entity.Name)))
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
			default:
				break
			}
		}
		if isVital {
			if vital := ResolveVitalSpawnInfo(assets, node); vital != nil {
				pushEntity(EntityInfo{
					ID:        fmt.Sprintf("%d", node.Entity.Id.Id),
					Name:      string(node.Entity.Name),
					File:      node.File.Path(),
					Transform: mat4.Multiply(mat4.Identity(), transform),
					Vital:     vital,
					Encounter: encounterName,
				})
			}
		}
	}

	assets.WalkSlice(file, visitSlice)

	return result
}

func ResolveVitalSpawnInfo(assets *game.Assets, node *game.SliceNode) *VitalSpawnInfo {
	result := VitalSpawnInfo{}
	vitalsID, _ := node.ContextStr(ctxVitalsId)
	categoryId, _ := node.ContextStr(ctxVitalsCategoryId)
	vitalsLevel, _ := node.ContextInt(ctxVitalsLevel)

	for _, component := range node.Components {
		switch v := component.(type) {
		case nwt.VitalsComponent:
			if vitalsID == "" {
				vitalsID = string(v.M_rowreference)
			}

		case nwt.TagComponent:
			// TODO: remap crc32 tags to strings
			// for _, tag := range v.Tags.Element {

			// }
		case nwt.CharacterComponent:
			//
		case nwt.ActionListComponent:
			result.DamageTable = string(v.M_damagetable.Asset.BaseClass1.AssetPath)
			result.AdbFile = string(v.M_animationdatabase.BaseClass1.AssetPath)
			for _, tag := range v.M_defaulttags.Element {
				result.Tags = utils.AppendUniqNoZero(result.Tags, string(tag))
			}
		case nwt.StatusEffectsComponent:
			if it, ok := v.BaseClass1.M_clientFacetPtr.(nwt.StatusEffectsComponentServerFacet); ok {
				for _, effect := range it.M_initialstatuseffects.Element {
					result.StatusEffects = utils.AppendUniqNoZero(result.StatusEffects, string(effect.M_effectid))
				}
			}
			facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
			if !ok {
				break
			}
			tmpTm := node.Transform
			for _, loc := range facet.M_locations.Element {
				entity := game.FindEntityById(node.Slice, loc.EntityId.Id)
				if entity == nil {
					continue
				}
				node.Transform = mat4.Multiply(tmpTm, game.FindTransformMat4(entity))
				if !node.WalkAsset(facet.M_aliasAsset) {
					node.WalkAsset(facet.M_sliceAsset)
				}
			}
			node.Transform = tmpTm
		default:
			break
		}
	}

	result.VitalsID = vitalsID
	result.CategoryID = categoryId
	result.Level = vitalsLevel
	if result.VitalsID == "" {
		return nil
	}
	return &result
}
