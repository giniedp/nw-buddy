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
	keyVitalsId       = "vitalsId"
	keyVitalsLevel    = "vitalsLevel"
	keyVitalsCategory = "vitalsCategory"
	keyEncounterName  = "encounterName"
	keyEncounterStage = "encounterStage"
	keyDamageTable    = "damageTable"
	keyAdbFile        = "adbFile"
	keyTags           = "tags"
)

func LoadEntities(assets *game.Assets, sliceFile string, rootTransform mat4.Data) []EntityInfo {
	file, ok := assets.Archive.Lookup(sliceFile)
	if !ok {
		return nil
	}

	result := make([]EntityInfo, 0)
	contained := make(map[string]bool)
	pushEntity := func(entity EntityInfo) {
		if entity.ID == 0 || entity.Name == "" {
			result = append(result, entity)
			return
		}

		key := fmt.Sprintf("%s-%d-%s-%s-%d-%v", entity.File, entity.ID, entity.Name, entity.Model, entity.ModelInstance, entity.Transform)
		if _, ok := contained[key]; ok {
			return
		}
		contained[key] = true
		result = append(result, entity)
	}

	assets.WalkSlice(file, func(node *game.EntityNode) {
		transform := mat4.Multiply(rootTransform, node.Transform)

		isEncounterTree := false
		if _, ok := node.ContextStr(keyEncounterName); ok {
			isEncounterTree = true
		}
		if _, ok := node.ContextStr(keyEncounterStage); ok {
			isEncounterTree = true
		}

		isVital := false
		for _, component := range node.Components {
			switch v := component.(type) {
			case nwt.AIVariantProviderComponent:
				// can override vitals data from higher level components
				// can be catched at `VitalsComponent`
				facet := v.BaseClass1.M_serverFacetPtr
				switch f := facet.(type) {
				case nwt.AIVariantProviderComponentServerFacet:
					if _, ok := node.ContextStr(keyVitalsId); !ok && (f.M_vitalstablerowid != "") {
						node.ContextStrSet(keyVitalsId, string(f.M_vitalstablerowid))
					}
					if _, ok := node.ContextStr(keyVitalsLevel); !ok && (f.M_vitalslevel != 0) {
						node.ContextStrSet(keyVitalsLevel, fmt.Sprintf("%d", f.M_vitalslevel))
					}
					if _, ok := node.ContextStr(keyVitalsCategory); !ok && (f.M_vitalscategorytablerowid != "") {
						node.ContextStrSet(keyVitalsCategory, string(f.M_vitalscategorytablerowid))
					}
				}
			case nwt.VitalsComponent:
				// at this point we can create a vitals instance
				isVital = true
				if _, ok := node.ContextStr(keyVitalsId); !ok && (v.M_rowreference != "") {
					node.ContextStrSet(keyVitalsId, string(v.M_rowreference))
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
						ID:              uint(node.Entity.Id.Id),
						Name:            string(node.Entity.Name),
						File:            node.File.Path(),
						Transform:       mat4.Multiply(transform, mat4.FromAzTransform(instance)),
						Model:           model,
						ModelInstance:   i,
						Material:        material,
						MaxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
						// Options:   meshNode.Render_Options,
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
					ID:              uint(node.Entity.Id.Id),
					Name:            string(node.Entity.Name),
					File:            node.File.Path(),
					Transform:       transform,
					Model:           model,
					Material:        material,
					MaxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
					Vital:           ResolveVitalSpawnInfo(node),
				})
			case nwt.MeshComponent:
				if isEncounterTree {
					// don't send encounter models to the client to reduce model count
					continue
				}

				meshNode := v.Static_Mesh_Render_Node
				if !meshNode.Visible {
					// || !v.Load_Mesh_On_Activate
					// TODO: what is Load_Mesh_On_Activate exactly for?
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
					ID:   uint(node.Entity.Id.Id),
					Name: string(node.Entity.Name),
					File: node.File.Path(),
					// TODO: this is weird, but it moves some "wrong" nodes out of the way, but keeps others correctly in place
					//Transform: mat4.Multiply(FindTransformMat4(FindAncestorWithPositionInTheWorld(node.Slice, node.Entity)), transform),
					Transform:       transform,
					Model:           model,
					Material:        material,
					MaxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
				})
			case nwt.SpawnerComponent:
				if facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.SpawnerComponentServerFacet); ok {
					if !node.WalkAsset(facet.M_aliasAsset) {
						node.WalkAsset(facet.M_sliceAsset)
					}
				}
			case nwt.PrefabSpawnerComponent:
				if !node.WalkAsset(v.M_aliasAsset) {
					node.WalkAsset(v.M_sliceAsset)
				}
			case nwt.PointSpawnerComponent:
				if !node.WalkAsset(v.BaseClass1.M_aliasAsset) {
					node.WalkAsset(v.BaseClass1.M_sliceAsset)
				}
			case nwt.EncounterManagerComponent:
				isEncounterTree = true
				// TODO: handle encounter manager with encounter spawners
				//   for _, stage := range v.M_stages.Element {
				//     entity := FindEntityById(node.Slice, stage.EntityId.Id)
				//     if entity == nil {
				//       continue
				//     }
				//   }
			case nwt.EncounterComponent:
				isEncounterTree = true

				tmpTm := node.Transform
				for _, spawn := range v.M_spawntimeline.Element {
					for _, location := range spawn.M_spawnlocations.Element {
						entity := game.FindEntityById(node.Slice, location.EntityId.Id)
						if entity == nil {
							continue
						}
						node.Transform = mat4.Multiply(tmpTm, game.FindTransformMat4(entity))
						if !node.WalkAsset(spawn.M_aliasAsset) {
							node.WalkAsset(spawn.M_sliceAsset)
						}
					}
				}
				node.Transform = tmpTm
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
					if !node.WalkAsset(facet.M_aliasAsset) {
						node.WalkAsset(facet.M_sliceAsset)
					}
				}
				node.Transform = tmpTm
			default:
				break
			}
		}
		if isVital {
			if vital := ResolveVitalSpawnInfo(node); vital != nil {
				pushEntity(EntityInfo{
					ID:        uint(node.Entity.Id.Id),
					Name:      string(node.Entity.Name),
					File:      node.File.Path(),
					Transform: transform,
					Vital:     vital,
				})
			}
		}
	})

	return result
}

func ResolveVitalSpawnInfo(node *game.EntityNode) *VitalSpawnInfo {
	result := VitalSpawnInfo{}
	vitalsID, _ := node.ContextStr(keyVitalsId)
	categoryId, _ := node.ContextStr(keyVitalsCategory)

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
	if result.VitalsID == "" {
		return nil
	}
	return &result
}
