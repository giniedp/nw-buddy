package scanner

import (
	"nw-buddy/tools/utils"
	"slices"
	"strings"
)

// vitalModelIndex holds the rows of the models the vitals are scanned with
type vitalModelIndex struct {
	rows map[*VitalModel]*ScannedVitalModel
}

// newVitalModelIndex creates the rows. Models without cdf that show equal parts (copies of a slice) share a row, a slice
// that is no copy of the level wins over the generated ones.
func newVitalModelIndex(entries []VitalsEntry) vitalModelIndex {
	models := make([]*VitalModel, 0)
	seen := make(map[*VitalModel]bool)
	for _, entry := range entries {
		if entry.Model != nil && !seen[entry.Model] {
			seen[entry.Model] = true
			models = append(models, entry.Model)
		}
	}
	// the scan order of the parallel workers must not reach the output
	slices.SortFunc(models, func(a, b *VitalModel) int {
		if isGeneratedSlice(a.Id) != isGeneratedSlice(b.Id) {
			if isGeneratedSlice(a.Id) {
				return 1
			}
			return -1
		}
		if c := strings.Compare(a.Id, b.Id); c != 0 {
			return c
		}
		return strings.Compare(vitalModelKey(a), vitalModelKey(b))
	})

	result := vitalModelIndex{rows: make(map[*VitalModel]*ScannedVitalModel)}
	byKey := make(map[string]*ScannedVitalModel)
	for _, model := range models {
		key := vitalModelKey(model)
		row := byKey[key]
		if row == nil {
			it := model.ScannedVitalModel
			it.VitalIds = make([]string, 0)
			row = &it
			byKey[key] = row
		}
		result.rows[model] = row
	}
	return result
}

// add returns the id of the model's row, empty without a model
func (it vitalModelIndex) add(entry VitalsEntry) string {
	row := it.rows[entry.Model]
	if row == nil {
		return ""
	}
	row.VitalIds = utils.AppendUniqNoZero(row.VitalIds, entry.VitalsID)
	return row.Id
}

// list returns the rows that are in use by id
func (it vitalModelIndex) list() []ScannedVitalModel {
	result := make([]ScannedVitalModel, 0)
	seen := make(map[*ScannedVitalModel]bool)
	for _, row := range it.rows {
		if seen[row] || len(row.VitalIds) == 0 {
			continue
		}
		seen[row] = true
		slices.Sort(row.VitalIds)
		result = append(result, *row)
	}
	slices.SortFunc(result, func(a, b ScannedVitalModel) int {
		return strings.Compare(a.Id, b.Id)
	})
	return result
}

func vitalModelKey(model *VitalModel) string {
	id := model.Id
	if model.Cdf == "" {
		id = model.content
	}
	return strings.Join([]string{
		id, model.Cdf, model.Mtl, model.Overcoat, model.Adb, model.Table, model.SpawnAction, strings.Join(model.Tags, ","),
	}, "\n")
}

// isGeneratedSlice reports whether a slice is generated with the level, as a copy of the slice it places
func isGeneratedSlice(id string) bool {
	return strings.HasPrefix(id, "coatgen/")
}
