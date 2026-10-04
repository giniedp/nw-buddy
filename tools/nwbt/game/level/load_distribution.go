package level

import (
	"encoding/binary"
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
	"strings"
	"sync"
)

// LoadDistribution reduces the region.distribution file to a list of resolved
// mesh types and a compact binary instance buffer.
//
// The binary buffer is a structure of arrays with `count` entries each (little endian):
//
//	uint16 type[count] // index into RegionDistributionData.Types
//	uint16 x[count]    // region local x, 0..0xFFFF maps to 0..regionSize
//	uint16 y[count]    // region local y, 0..0xFFFF maps to 0..regionSize
func (dir *RegionDirectory) LoadDistribution(assets *game.Assets) (*RegionDistributionData, []byte) {
	file, ok := assets.Archive.Lookup(dir.PathDistributionFile())
	if !ok {
		return nil, nil
	}
	doc, err := distribution.Load(file)
	if err != nil {
		slog.Error("distribution not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		return nil, nil
	}

	// unique (slice, variant) pairs referenced by the positions
	type typeKey struct{ slice, variant string }
	keys := make([]typeKey, 0)
	keyIndex := make(map[typeKey]int)
	slotKey := make(map[uint16]int)
	for _, slot := range doc.Indices {
		if _, ok := slotKey[slot]; ok {
			continue
		}
		key := typeKey{doc.Slices[slot], doc.Variants[slot]}
		index, ok := keyIndex[key]
		if !ok {
			index = len(keys)
			keyIndex[key] = index
			keys = append(keys, key)
		}
		slotKey[slot] = index
	}

	resolved := make([][]distributionMeshInfo, len(keys))
	progress.Concurrent(WORKER_COUNT, keys, func(key typeKey, i int) error {
		resolved[i] = resolveDistributionMeshes(assets, key.slice, key.variant)
		return nil
	})

	result := &RegionDistributionData{
		Region: doc.Region,
		Types:  make([]DistributionType, 0),
	}
	models := make(map[string]int)
	materials := make(map[string]int)
	intern := func(lookup map[string]int, list *[]string, value string) int {
		if index, ok := lookup[value]; ok {
			return index
		}
		index := len(*list)
		lookup[value] = index
		*list = append(*list, value)
		return index
	}

	// key index -> reduced type index, -1 if nothing renderable
	keyType := make([]int, len(keys))
	for i, meshes := range resolved {
		keyType[i] = -1
		if len(meshes) == 0 {
			continue
		}
		item := DistributionType{
			Slice:   keys[i].slice,
			Variant: keys[i].variant,
			Meshes:  make([]DistributionMesh, 0, len(meshes)),
		}
		for _, mesh := range meshes {
			entry := DistributionMesh{
				Model:           intern(models, &result.Models, mesh.model),
				Material:        intern(materials, &result.Materials, mesh.material),
				MaxViewDistance: mesh.maxViewDistance,
			}
			if mesh.transform != mat4.Identity() {
				transform := mesh.transform
				entry.Transform = &transform
			}
			item.Meshes = append(item.Meshes, entry)
		}
		keyType[i] = len(result.Types)
		result.Types = append(result.Types, item)
	}

	types := make([]uint16, 0, len(doc.Positions))
	posX := make([]uint16, 0, len(doc.Positions))
	posY := make([]uint16, 0, len(doc.Positions))
	for i, position := range doc.Positions {
		typeIndex := keyType[slotKey[doc.Indices[i]]]
		if typeIndex < 0 {
			continue
		}
		types = append(types, uint16(typeIndex))
		posX = append(posX, position[0])
		posY = append(posY, position[1])
	}
	result.Count = len(types)

	data := make([]byte, 0, result.Count*6)
	for _, list := range [][]uint16{types, posX, posY} {
		for _, value := range list {
			data = binary.LittleEndian.AppendUint16(data, value)
		}
	}
	return result, data
}

type distributionMeshInfo struct {
	model           string
	material        string
	transform       mat4.Data
	maxViewDistance float32
}

type meshOverride struct {
	model    string
	material string
	ignore   bool
}

// resolveDistributionMeshes walks the slice and collects all meshes in their initial state.
// Variation data of the root slice is resolved with the given variant, nested slices use the variant of
// their prefab spawner or fall back to their own selected variant.
func resolveDistributionMeshes(assets *game.Assets, sliceName string, variant string) []distributionMeshInfo {
	file := assets.ResolveDynamicSliceByName(sliceName)
	if file == nil {
		return nil
	}

	result := make([]distributionMeshInfo, 0)
	type overrideKey struct {
		slice   *nwt.SliceComponent
		variant string
	}
	overrides := make(map[overrideKey]map[nwt.AzUInt64]meshOverride)
	spawnerVariants := make(map[*game.SliceNode]string)

	assets.WalkSlice(file, func(node *game.SliceNode) {
		key := overrideKey{slice: node.Slice, variant: variant}
		if node.Parent != nil {
			key.variant = spawnerVariants[node.Parent]
		}
		sliceOverrides, ok := overrides[key]
		if !ok {
			sliceOverrides = resolveVariationOverrides(assets, key.slice, key.variant)
			overrides[key] = sliceOverrides
		}
		if sliceOverrides[node.Entity.Id.Id].ignore {
			return
		}

		for _, component := range node.Components {
			switch v := component.(type) {
			case nwt.MeshComponent:
				meshNode := v.Static_Mesh_Render_Node
				if !meshNode.Visible {
					continue
				}
				if strings.Contains(strings.ToLower(string(node.Entity.Name)), "depleted") {
					// gatherables have a mesh for the depleted state which is hidden initially
					continue
				}
				model := ""
				material := ""
				override, hasOverride := sliceOverrides[node.Entity.Id.Id]
				if hasOverride && override.model != "" {
					model = override.model
				} else if file, _ := assets.LookupFileByAsset(meshNode.Static_Mesh); file != nil {
					model = file.Path()
				}
				if hasOverride && override.material != "" {
					material = override.material
				} else if file, _ := assets.LookupFileByAsset(meshNode.Material_Override_Asset); file != nil {
					material = file.Path()
				}
				if model == "" {
					continue
				}
				model, material = assets.ResolveCgfAndMtl(model, material)
				if model == "" {
					continue
				}
				result = append(result, distributionMeshInfo{
					model:           model,
					material:        material,
					transform:       node.Transform,
					maxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
				})
			case nwt.InstancedMeshComponent:
				meshNode := v.Instanced_Mesh_Render_Node.BaseClass1
				if game.ShouldIgnoreMeshNode(meshNode) {
					continue
				}
				modelFile, _ := assets.LookupFileByAsset(meshNode.Static_Mesh)
				if modelFile == nil {
					continue
				}
				material := ""
				if file, _ := assets.LookupFileByAsset(meshNode.Material_Override_Asset); file != nil {
					material = file.Path()
				}
				model, material := assets.ResolveCgfAndMtl(modelFile.Path(), material)
				if model == "" {
					continue
				}
				for _, instance := range v.Instanced_Mesh_Render_Node.Instance_Transforms.Element {
					result = append(result, distributionMeshInfo{
						model:           model,
						material:        material,
						transform:       mat4.Multiply(node.Transform, mat4.FromAzTransform(instance)),
						maxViewDistance: float32(meshNode.Render_Options.MaxViewDistance),
					})
				}
			case nwt.PrefabSpawnerComponent:
				spawnerVariants[node] = string(v.M_sliceVariant)
				for _, asset := range utils.AppendUniqNoZero(utils.AppendUniqNoZero([]nwt.AzAsset{}, v.M_sliceAsset), v.M_aliasAsset) {
					node.WalkAsset(asset)
				}
			case nwt.PointSpawnerComponent:
				for _, asset := range utils.AppendUniqNoZero(utils.AppendUniqNoZero([]nwt.AzAsset{}, v.BaseClass1.M_sliceAsset), v.BaseClass1.M_aliasAsset) {
					node.WalkAsset(asset)
				}
			}
		}
	})
	return result
}

// resolveVariationOverrides maps entity ids to mesh/material overrides defined by the
// VariationDataComponent of the slice. Entities that represent a depleted state are flagged as ignored.
func resolveVariationOverrides(assets *game.Assets, slice *nwt.SliceComponent, variant string) map[nwt.AzUInt64]meshOverride {
	result := make(map[nwt.AzUInt64]meshOverride)
	if slice == nil {
		return result
	}
	for _, entity := range slice.Entities.Element {
		v := game.FindVariationDataComponent(&entity)
		if v == nil {
			continue
		}
		selected := variant
		if selected == "" {
			selected = string(v.M_selectedVariant)
		}
		row := findVariationRow(assets, string(v.M_variationTableUniqueName), selected)
		if row == nil {
			continue
		}
		for _, data := range v.M_variantData.Element {
			column := string(data.M_colName)
			entityId := data.M_entity.EntityId.Id
			item := result[entityId]
			if strings.Contains(strings.ToLower(column), "depleted") {
				// entity is only relevant for the depleted state, e.g. DepletedMesh, DepletedSpawnVariant
				item.ignore = true
				result[entityId] = item
				continue
			}
			switch data.M_action {
			case "Change Mesh":
				if value := row.GetString(column); value != "" {
					item.model = nwfs.NormalizePath(value)
				} else {
					item.ignore = true
				}
			case "Change Material":
				if value := row.GetString(column); value != "" {
					item.material = nwfs.NormalizePath(value)
				}
			default:
				continue
			}
			result[entityId] = item
		}
	}
	return result
}

var variationTables sync.Map // lower case table name -> map[lower case variant id]*datasheet.JSONRow
var variationTablesLock sync.Mutex

func findVariationRow(assets *game.Assets, table string, variant string) *datasheet.JSONRow {
	if table == "" || variant == "" {
		return nil
	}
	table = strings.ToLower(table)
	if rows, ok := variationTables.Load(table); ok {
		return rows.(map[string]*datasheet.JSONRow)[strings.ToLower(variant)]
	}

	variationTablesLock.Lock()
	defer variationTablesLock.Unlock()
	if rows, ok := variationTables.Load(table); ok {
		return rows.(map[string]*datasheet.JSONRow)[strings.ToLower(variant)]
	}

	rows := make(map[string]*datasheet.JSONRow)
	for sheet := range assets.EachDatasheet() {
		if sheet == nil || !strings.EqualFold(sheet.Table, table) {
			continue
		}
		for _, row := range sheet.RowsAsJSON() {
			row := row
			rows[strings.ToLower(row.GetString("VariantID"))] = &row
		}
	}
	variationTables.Store(table, rows)
	return rows[strings.ToLower(variant)]
}
