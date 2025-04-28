package game

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

const (
	keyVitalsId       = "vitalsId"
	keyVitalsLevel    = "vitalsLevel"
	keyVitalsCategory = "vitalsCategory"
	keyEncounterName  = "encounterName"
	keyEncounterStage = "encounterStage"
)

func LoadEntities(assets *Assets, sliceFile string, rootTransform mat4.Data) []EntityInfo {
	file, ok := assets.Archive.Lookup(sliceFile)
	if !ok {
		return nil
	}

	result := make([]EntityInfo, 0)

	assets.WalkSlice(file, func(node *EntityNode) {
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
			case nwt.TagComponent:
				// TODO: remap crc32 tags to strings
				// for _, tag := range v.Tags.Element {
				// }
			case nwt.CharacterComponent:
				//
			case nwt.ActionListComponent:
				// TODO:
				// - damage table
				// - default tags
			case nwt.StatusEffectsComponent:
				// TODO:
				// - get initial status effects

			// TODO: lights can't be used right now, engine only supports a few
			// case nwt.LightComponent:
			// 	config := v.LightConfiguration
			// 	if !config.Visible {
			// 		break
			// 	}
			// 	switch config.LightType {
			// 	case 0:
			// 		// Point light
			// 		result = append(result, EntityInfo{
			// 			ID:        uint(node.Entity.Id.Id),
			// 			Name:      string(node.Entity.Name),
			// 			File:      node.File.Path(),
			// 			Transform: transform,
			// 			Light: &LightInfo{
			// 				Type:              0,
			// 				Color:             config.Color,
			// 				DiffuseIntensity:  float32(config.DiffuseMultiplier),
			// 				SpecularIntensity: float32(config.SpecMultiplier),
			// 				PointDistance:     float32(config.PointMaxDistance),
			// 				PointAttenuation:  float32(config.PointAttenuationBulbSize),
			// 			},
			// 		})

			// 	case 1: // area
			// 	case 2: // projector
			// 	case 3: // probe
			// 	}
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
				for _, instance := range v.Instanced_mesh_render_node.Instance_transforms.Element {
					result = append(result, EntityInfo{
						ID:        uint(node.Entity.Id.Id),
						Name:      string(node.Entity.Name),
						File:      node.File.Path(),
						Transform: mat4.Multiply(transform, mat4.FromAzTransform(instance)),
						Model:     model,
						Material:  material,
						// Options:   meshNode.Render_Options,
					})
				}

				// instances := make([]gltf.Mat4x4, 0)
				// for _, instance := range v.Instanced_mesh_render_node.Instance_transforms.Element {
				// 	transform := math.TransformFromAzTransform(instance).ToMat4()
				// 	instances = append(instances, transform)
				// }
				// result = append(result, EntityInfo{
				// 	ID:        uint(node.Entity.Id.Id),
				// 	Name:      string(node.Entity.Name),
				// 	File:      node.File.Path(),
				// 	Transform: transform,
				// 	Model:     model,
				// 	Material:  material,
				// 	Instances: instances,
				// // 	Options:   meshNode.Render_Options,
				// })
			case nwt.MeshComponent:
				if isEncounterTree {
					// don't send encounter models to the client to reduce model count
					continue
				}

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
				result = append(result, EntityInfo{
					ID:   uint(node.Entity.Id.Id),
					Name: string(node.Entity.Name),
					File: node.File.Path(),
					// TODO: this is weird, but it moves some "wrong" nodes out of the way, but keeps others correctly in place
					//Transform: mat4.Multiply(FindTransformMat4(FindAncestorWithPositionInTheWorld(node.Slice, node.Entity)), transform),
					Transform: transform,
					Model:     model,
					Material:  material,
					// Options:   meshNode.Render_Options,
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
						entity := FindEntityById(node.Slice, location.EntityId.Id)
						if entity == nil {
							continue
						}
						node.Transform = mat4.Multiply(tmpTm, FindTransformMat4(entity))
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
					entity := FindEntityById(node.Slice, loc.EntityId.Id)
					if entity == nil {
						continue
					}
					node.Transform = mat4.Multiply(tmpTm, FindTransformMat4(entity))
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
			vitalsID, _ := node.ContextStr(keyVitalsId)
			categoryId, _ := node.ContextStr(keyVitalsCategory)

			if vitalsID != "" {
				result = append(result, EntityInfo{
					ID:        uint(node.Entity.Id.Id),
					Name:      string(node.Entity.Name),
					File:      node.File.Path(),
					Transform: transform,
					Vital: &VitalSpawnInfo{
						VitalsID:   vitalsID,
						CategoryID: categoryId,
					},
				})
			}
		}
	})
	return result
}
