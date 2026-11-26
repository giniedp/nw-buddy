package level

import (
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"strings"
)

// variationEntity is what the variant row of a slice changes on one of its entities
type variationEntity struct {
	// Change Mesh, Change Material
	model       string
	material    string
	materialSet bool
	// Change Mesh Visibility false, or a visual state the viewer leaves out
	hidden bool
	// Change Prefab Spawner Slice: the spawned slice, empty when the spawner spawns nothing
	spawnerSlice string
	spawnerSet   bool
	// Change Prefab Spawner Variant
	spawnerVariant    string
	spawnerVariantSet bool
}

// sliceVariation resolves the VariationDataComponent of a slice with the variant: the changes of its row by entity
// id. Nil without a variant, a variation component or a row.
//
// Visual states of gatherables (spawners of `Visual_*` columns), as a player on no quest sees them:
//   - Depleted: left out
//   - NotOnRequiredQuest: shown when its cell names a slice
//   - Healthy: shown when NotOnRequiredQuest names none
func sliceVariation(assets *game.Assets, slice *nwt.SliceComponent, variant string) map[nwt.AzUInt64]*variationEntity {
	if variant == "" {
		return nil
	}
	var result map[nwt.AzUInt64]*variationEntity
	for _, entity := range slice.Entities.Element {
		v := game.FindVariationDataComponent(&entity)
		if v == nil {
			continue
		}
		row := findVariationRow(assets, string(v.M_variationTableUniqueName), variant)
		if row == nil {
			continue
		}
		if result == nil {
			result = make(map[nwt.AzUInt64]*variationEntity)
		}
		item := func(id nwt.AzUInt64) *variationEntity {
			if result[id] == nil {
				result[id] = &variationEntity{}
			}
			return result[id]
		}
		notOnQuest := false
		for _, data := range v.M_variantData.Element {
			column := strings.ToLower(string(data.M_colName))
			if data.M_action == "Change Prefab Spawner Slice" && strings.Contains(column, "notonrequiredquest") {
				notOnQuest = notOnQuest || row.GetString(string(data.M_colName)) != ""
			}
		}
		for _, data := range v.M_variantData.Element {
			column := string(data.M_colName)
			lower := strings.ToLower(column)
			value := row.GetString(column)
			target := item(data.M_entity.EntityId.Id)
			switch data.M_action {
			case "Change Mesh":
				target.model = nwfs.NormalizePath(value)
			case "Change Material":
				target.material = nwfs.NormalizePath(value)
				target.materialSet = true
			case "Change Mesh Visibility":
				if value != "" && !isTrueCell(value) {
					target.hidden = true
				}
			case "Change Prefab Spawner Slice":
				target.spawnerSlice = nwfs.NormalizePath(value)
				target.spawnerSet = true
				switch {
				case strings.Contains(lower, "depleted"):
					target.hidden = true
				case strings.Contains(lower, "healthy") && notOnQuest:
					target.hidden = true
				}
			case "Change Prefab Spawner Variant":
				target.spawnerVariant = value
				target.spawnerVariantSet = true
			}
		}
	}
	return result
}

// isTrueCell reads a boolean cell: `true` or `1`
func isTrueCell(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == "true" || value == "1"
}
