package scanner

import (
	"fmt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"slices"
	"strconv"
	"strings"
)

type ScannedVital struct {
	VitalsID string   `json:"vitalsID"`
	Tables   []string `json:"tables"`
	MapIDs   []string `json:"mapIDs"`
	// ids of ScannedVitalModel the vital spawns with
	Models []string `json:"models"`
	// without own models: the models of the vitals with the same BaseVitalsId
	RelatedModels []string                        `json:"relatedModels"`
	CatIDs        []string                        `json:"catIDs"`
	GthIDs        []string                        `json:"gthIDs"`
	Levels        []int                           `json:"levels"`
	Territories   []int                           `json:"territories"`
	Spawns        map[string][]*ScannedVitalSpawn `json:"spawns"`
}

// ScannedVitalSpawn is the positions of a map that share all attributes
type ScannedVitalSpawn struct {
	Positions   []Position `json:"p"`
	Encounter   []string   `json:"e"`
	Levels      []int      `json:"l"`
	Categories  []string   `json:"c"`
	Gatherables []string   `json:"g"`
	Territories []int      `json:"t"`
	// indices into ScannedVital.Models
	Models []int    `json:"m"`
	Luck   *float32 `json:"lc"`
	Tod    string   `json:"tc"`
}

// vitalSpawn is the merged entries of a vital at a position
type vitalSpawn struct {
	position    Position
	encounter   []string
	levels      []int
	categories  []string
	gatherables []string
	territories []int
	models      []string
	tables      []string
	luck        *float32
	tod         string
}

// CollateVitals groups the entries by vital and their models.
//   - zoneLevels: level override by territory
//   - baseLevels: level by lower case vitals id
//   - baseIds: BaseVitalsId by vitals id (both lower case)
func CollateVitals(
	rows []VitalsEntry,
	zones []ScannedTerritory,
	zoneLevels map[string]float32,
	baseLevels map[string]float32,
	baseIds map[string]string,
) ([]ScannedVitalModel, []*ScannedVital, int) {
	index := maps.NewDict[*maps.Dict[*maps.Dict[*vitalSpawn]]]()
	rows = selectVitalEntries(rows)
	models := newVitalModelIndex(rows)

	for _, row := range rows {
		mapId := strings.ToLower(row.MapID)
		recordID := strings.ToLower(row.VitalsID)
		position := PositionFromV3(row.Position).Truncate()
		key := position.Key()
		if row.Luck != nil {
			key = fmt.Sprintf("%s-l:%v", key, *row.Luck)
		}
		if row.Tod != "" {
			key = fmt.Sprintf("%s-t:%s", key, row.Tod)
		}
		node := index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId, maps.NewDict).
			LoadOrCreate(key, func() *vitalSpawn {
				return &vitalSpawn{
					position: position,
					luck:     row.Luck,
					tod:      row.Tod,
				}
			})

		node.categories = utils.AppendUniqNoZero(node.categories, strings.ToLower(row.CategoryID))
		node.gatherables = utils.AppendUniqNoZero(node.gatherables, strings.ToLower(row.GatherableID))
		node.encounter = utils.AppendUniqNoZero(node.encounter, strings.ToLower(row.Encounter))
		node.models = utils.AppendUniqNoZero(node.models, models.add(row))
		node.tables = utils.AppendUniqNoZero(node.tables, row.DamageTable)

		baseLevel := baseLevels[recordID]
		vitalLevel := row.Level
		if vitalLevel == 0 && baseLevel > 0 {
			vitalLevel = int(baseLevel)
		}
		if isOpenWorld(mapId) {
			for _, zoneId := range getZonesForPosition(position, zones) {
				node.territories = utils.AppendUniqNoZero(node.territories, zoneId)
				if lvl := getZoneLevel(zoneId, zoneLevels); lvl != 0 && row.UseZoneLevel {
					vitalLevel = lvl
				}
			}
		}
		node.levels = utils.AppendUniqNoZero(node.levels, vitalLevel)
	}

	records := maps.NewDict[*ScannedVital]()
	count := 0
	for recordID, byMap := range index.SortedIter() {
		record := newScannedVital(recordID)
		records.Store(recordID, record)
		for mapID, byKey := range byMap.SortedIter() {
			for _, entry := range byKey.SortedIter() {
				record.CatIDs = utils.AppendUniqNoZero(record.CatIDs, entry.categories...)
				record.GthIDs = utils.AppendUniqNoZero(record.GthIDs, entry.gatherables...)
				record.Levels = utils.AppendUniqNoZero(record.Levels, entry.levels...)
				record.Models = utils.AppendUniqNoZero(record.Models, entry.models...)
				record.Territories = utils.AppendUniqNoZero(record.Territories, entry.territories...)
				record.Tables = utils.AppendUniqNoZero(record.Tables, entry.tables...)
				if mapID != "" {
					record.MapIDs = utils.AppendUniqNoZero(record.MapIDs, mapID)
					count++
				}
			}
		}
		slices.Sort(record.CatIDs)
		slices.Sort(record.GthIDs)
		slices.Sort(record.Levels)
		slices.Sort(record.MapIDs)
		slices.Sort(record.Models)
		slices.Sort(record.Tables)
		slices.Sort(record.Territories)
		for mapID, byKey := range byMap.SortedIter() {
			if mapID != "" {
				record.Spawns[mapID] = groupVitalSpawns(byKey.SortedValues(), record.Models)
			}
		}
	}

	addRelatedModels(records, baseIds)
	return models.list(), records.SortedValues(), count
}

func newScannedVital(id string) *ScannedVital {
	return &ScannedVital{
		VitalsID:      id,
		CatIDs:        make([]string, 0),
		GthIDs:        make([]string, 0),
		Levels:        make([]int, 0),
		Spawns:        make(map[string][]*ScannedVitalSpawn),
		MapIDs:        make([]string, 0),
		Models:        make([]string, 0),
		RelatedModels: make([]string, 0),
		Tables:        make([]string, 0),
		Territories:   make([]int, 0),
	}
}

// selectVitalEntries leaves out entries without vital and the templates of vitals the other entries have models for. A
// template adds only its model to a vital with other entries.
func selectVitalEntries(rows []VitalsEntry) []VitalsEntry {
	hasEntry := make(map[string]bool)
	hasModel := make(map[string]bool)
	for _, row := range rows {
		if !row.Template {
			id := strings.ToLower(row.VitalsID)
			hasEntry[id] = true
			hasModel[id] = hasModel[id] || row.Model != nil
		}
	}
	result := make([]VitalsEntry, 0, len(rows))
	for _, row := range rows {
		id := strings.ToLower(row.VitalsID)
		if id == "" || row.Template && hasModel[id] {
			continue
		}
		if row.Template && hasEntry[id] {
			row = VitalsEntry{VitalsID: row.VitalsID, Model: row.Model, Template: true}
		}
		result = append(result, row)
	}
	return result
}

// groupVitalSpawns groups the spawns of a map by equal attributes, models are the sorted models of the vital
func groupVitalSpawns(spawns []*vitalSpawn, models []string) []*ScannedVitalSpawn {
	result := make([]*ScannedVitalSpawn, 0)
	groups := make(map[string]*ScannedVitalSpawn)
	for _, spawn := range spawns {
		// the scan order of the parallel workers must not reach the output
		it := &ScannedVitalSpawn{
			Encounter:   sortedCopy(spawn.encounter),
			Levels:      sortedCopy(spawn.levels),
			Categories:  sortedCopy(spawn.categories),
			Gatherables: sortedCopy(spawn.gatherables),
			Territories: sortedCopy(spawn.territories),
			Models:      make([]int, 0, len(spawn.models)),
			Luck:        spawn.luck,
			Tod:         spawn.tod,
		}
		for _, id := range spawn.models {
			if i, ok := slices.BinarySearch(models, id); ok {
				it.Models = append(it.Models, i)
			}
		}
		slices.Sort(it.Models)
		luck := ""
		if it.Luck != nil {
			luck = fmt.Sprint(*it.Luck)
		}
		key := fmt.Sprintf(
			"%q|%v|%q|%q|%v|%v|%s|%s",
			it.Encounter, it.Levels, it.Categories, it.Gatherables, it.Territories, it.Models, luck, it.Tod,
		)
		group, ok := groups[key]
		if !ok {
			group = it
			groups[key] = group
			result = append(result, group)
		}
		group.Positions = append(group.Positions, spawn.position)
	}
	for _, group := range result {
		slices.SortFunc(group.Positions, comparePositions)
	}
	return result
}

func sortedCopy[T int | string](list []T) []T {
	result := make([]T, len(list))
	copy(result, list)
	slices.Sort(result)
	return result
}

// addRelatedModels gives vitals without models those of the vitals with the same base. Vitals without record get one.
func addRelatedModels(records *maps.Dict[*ScannedVital], baseIds map[string]string) {
	byBase := make(map[string][]string)
	for id, base := range baseIds {
		if record, ok := records.Load(id); ok {
			byBase[base] = utils.AppendUniqNoZero(byBase[base], record.Models...)
		}
	}
	for id, base := range baseIds {
		related := byBase[base]
		if len(related) == 0 {
			continue
		}
		record := records.LoadOrCreate(id, func() *ScannedVital {
			return newScannedVital(id)
		})
		if len(record.Models) == 0 {
			record.RelatedModels = sortedCopy(related)
		}
	}
}

func isPointInAABB(point Position, aabb BBox) bool {
	x := point[0]
	y := point[1]
	if x < aabb[0] || x > aabb[2] || y < aabb[1] || y > aabb[3] {
		return false
	}
	return true
}

func isPointInPolygon(point Position, vs []Position) bool {
	// ray-casting algorithm based on
	// https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

	x := point[0]
	y := point[1]

	var inside = false
	for i := 0; i < len(vs); i++ {
		j := i - 1
		if j < 0 {
			j = len(vs) - 1
		}
		xi := vs[i][0]
		yi := vs[i][1]
		xj := vs[j][0]
		yj := vs[j][1]
		if (yi > y) != (yj > y) && x < ((xj-xi)*(y-yi))/(yj-yi)+xi {
			inside = !inside
		}
	}

	return inside
}

func isOpenWorld(mapId string) bool {
	return mapId == "newworld_vitaeeterna"
}

func getZonesForPosition(position Position, zones []ScannedTerritory) []int {
	result := make([]int, 0)
	for _, zone := range zones {
		if !isPointInAABB(position, zone.Geometry[0].BBox) {
			continue
		}
		if !isPointInPolygon(position, zone.Geometry[0].Coordinates[0]) {
			continue
		}

		id, _ := strconv.Atoi(zone.TerritoryID)
		if id != 0 {
			result = append(result, id)
		}
	}
	return result
}

func getZoneLevel(zoneId int, zoneLevels map[string]float32) int {
	stringId := fmt.Sprintf("%02v", zoneId) // ids are 2 digits
	if lvl, ok := zoneLevels[stringId]; ok {
		return int(lvl)
	}
	return 0
}
