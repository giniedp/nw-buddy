package scanner

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/maps"
	"slices"
	"strconv"
	"strings"
)

type ScannedVital struct {
	VitalsID    string                          `json:"vitalsID"`
	Tables      []string                        `json:"tables"`
	MapIDs      []string                        `json:"mapIDs"`
	Models      []string                        `json:"models"`
	CatIDs      []string                        `json:"catIDs"`
	GthIDs      []string                        `json:"gthIDs"`
	Levels      []int                           `json:"levels"`
	Territories []int                           `json:"territories"`
	Spawns      map[string][]*ScannedVitalSpawn `json:"spawns"`
}

type ScannedVitalSpawn struct {
	Position    Position `json:"p"`
	Encounter   []string `json:"e"`
	Levels      []int    `json:"l"`
	Categories  []string `json:"c"`
	Gatherables []string `json:"g"`
	Territories []int    `json:"t"`
	Models      []string `json:"m"`
	Tables      []string `json:"-"`
	Trace       []any    `json:"-"`
}

type ScannedVitalModel struct {
	Id       string   `json:"id"`
	Cdf      string   `json:"cdf"`
	Mtl      string   `json:"mtl"`
	Adb      string   `json:"adb"`
	Tags     []string `json:"tags"`
	VitalIds []string `json:"vitalIds"`
}

type ModelMap map[string]*ScannedVitalModel

func (it ModelMap) add(entry VitalsEntry) string {
	if entry.ModelFile == "" {
		return ""
	}

	data := maps.NewDict[any]()
	data.Store("id", "")
	data.Store("cdf", strings.ToLower(entry.ModelFile))
	data.Store("mtl", strings.ToLower(entry.MtlFile))
	data.Store("adb", strings.ToLower(entry.AdbFile))
	data.Store("tags", entry.Tags)
	data.Store("vitalIds", []string{})
	bytes, _ := json.MarshalJSON(data)
	sum := md5.Sum([]byte(strings.TrimSpace(string(bytes))))
	hash := hex.EncodeToString(sum[:])
	if row, ok := it[hash]; !ok {
		it[hash] = &ScannedVitalModel{
			Id:       hash,
			Cdf:      strings.ToLower(entry.ModelFile),
			Mtl:      strings.ToLower(entry.MtlFile),
			Adb:      strings.ToLower(entry.AdbFile),
			Tags:     entry.Tags,
			VitalIds: []string{entry.VitalsID},
		}
	} else {
		row.VitalIds = utils.AppendUniqNoZero(row.VitalIds, entry.VitalsID)
	}
	return hash
}

func CollateVitals(
	rows []VitalsEntry,
	zones []ScannedTerritory,
	zoneLevels map[string]float32,
	baseLevels map[string]float32,
) ([]ScannedVitalModel, []*ScannedVital, int) {
	index := maps.NewDict[*maps.Dict[*maps.Dict[*ScannedVitalSpawn]]]()
	modelsMap := make(ModelMap)

	for _, row := range rows {
		if row.VitalsID == "" {
			continue
		}

		mapId := strings.ToLower(row.MapID)
		recordID := strings.ToLower(row.VitalsID)
		position := PositionFromV3(row.Position).Truncate()
		modelHash := modelsMap.add(row)

		node := index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId, maps.NewDict).
			LoadOrCreate(position.Key(), func() *ScannedVitalSpawn {
				return &ScannedVitalSpawn{
					Position:    position,
					Categories:  make([]string, 0),
					Gatherables: make([]string, 0),
					Levels:      make([]int, 0),
					Models:      make([]string, 0),
					Encounter:   make([]string, 0),
					Tables:      make([]string, 0),
					Territories: make([]int, 0),
					Trace:       make([]any, 0),
				}
			})

		node.Categories = utils.AppendUniqNoZero(node.Categories, strings.ToLower(row.CategoryID))
		node.Gatherables = utils.AppendUniqNoZero(node.Gatherables, strings.ToLower(row.GatherableID))
		node.Encounter = utils.AppendUniqNoZero(node.Encounter, strings.ToLower(row.Encounter))
		node.Models = utils.AppendUniqNoZero(node.Models, modelHash)
		node.Tables = utils.AppendUniqNoZero(node.Tables, strings.TrimPrefix(strings.ToLower(row.DamageTable), "sharedassets/springboardentitites/datatables/"))
		node.Trace = append(node.Trace, row.Trace)

		if baseLevel, ok := baseLevels[recordID]; ok && baseLevel > 0 {
			// TODO: do we want base lelvel in here although it might not spawn?
			node.Levels = utils.AppendUniqNoZero(node.Levels, int(baseLevel))
		}

		vitalLevel := row.Level
		if isOpenWorld(mapId) {
			for _, zoneId := range getZonesForPosition(position, zones) {
				node.Territories = utils.AppendUniqNoZero(node.Territories, zoneId)
				if lvl := getZoneLevel(zoneId, zoneLevels); lvl != 0 && row.UseZoneLevel {
					vitalLevel = lvl
				}
			}
		}
		node.Levels = utils.AppendUniqNoZero(node.Levels, vitalLevel)
	}

	models := make([]ScannedVitalModel, 0)
	for _, model := range modelsMap {
		slices.Sort(model.VitalIds)
		slices.Sort(model.Tags)
		models = append(models, *model)
	}
	slices.SortFunc(models, func(a, b ScannedVitalModel) int {
		if a.Cdf != b.Cdf {
			return strings.Compare(a.Cdf, b.Cdf)
		}
		if a.Mtl != b.Mtl {
			return strings.Compare(a.Mtl, b.Mtl)
		}
		return strings.Compare(a.Id, b.Id)
	})

	records := maps.NewDict[*ScannedVital]()
	for recordID, b1 := range index.SortedIter() {
		record := records.LoadOrCreate(recordID, func() *ScannedVital {
			return &ScannedVital{
				VitalsID:    recordID,
				CatIDs:      make([]string, 0),
				GthIDs:      make([]string, 0),
				Levels:      make([]int, 0),
				Spawns:      make(map[string][]*ScannedVitalSpawn),
				MapIDs:      make([]string, 0),
				Models:      make([]string, 0),
				Tables:      make([]string, 0),
				Territories: make([]int, 0),
			}
		})

		for mapID, b2 := range b1.SortedIter() {
			for _, entry := range b2.SortedIter() {
				record.CatIDs = utils.AppendUniqNoZero(record.CatIDs, entry.Categories...)
				record.GthIDs = utils.AppendUniqNoZero(record.GthIDs, entry.Gatherables...)
				record.Levels = utils.AppendUniqNoZero(record.Levels, entry.Levels...)
				record.Models = utils.AppendUniqNoZero(record.Models, entry.Models...)
				record.Territories = utils.AppendUniqNoZero(record.Territories, entry.Territories...)
				record.Tables = utils.AppendUniqNoZero(record.Tables, entry.Tables...)
				if mapID != "" {
					record.MapIDs = utils.AppendUniqNoZero(record.MapIDs, mapID)
					record.Spawns[mapID] = append(record.Spawns[mapID], entry)
				}
			}
		}
	}

	count := 0
	result := records.SortedValues()
	for i := range result {
		slices.Sort(result[i].CatIDs)
		slices.Sort(result[i].GthIDs)
		slices.Sort(result[i].Levels)
		slices.Sort(result[i].MapIDs)
		slices.Sort(result[i].Models)
		slices.Sort(result[i].Tables)
		slices.Sort(result[i].Territories)
		for _, row := range result[i].Spawns {
			count += len(row)
			slices.SortFunc(row, func(a, b *ScannedVitalSpawn) int {
				return comparePositions(a.Position, b.Position)
			})
		}
	}

	return models, result, count
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
