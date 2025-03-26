package scanner

import (
	"bytes"
	"fmt"
	"math"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/maps"
	"slices"
	"strings"
)

type ScannedGatherable struct {
	GatherableID string                   `json:"gatherableID"`
	Spawns       []ScannedGatherableSpawn `json:"spawns"`
}

type ScannedGatherableSpawn struct {
	MapID     string     `json:"mapID"`
	Encounter string     `json:"encounter"`
	Positions []Position `json:"positions"`
}

func CollateGatherables(rows []GatherableEntry) (result []ScannedGatherable, count int) {
	result = make([]ScannedGatherable, 0)
	index := maps.NewDict[*maps.Dict[*maps.Dict[*ScannedGatherableSpawn]]]()

	for _, row := range rows {

		recordID := strings.ToLower(row.GatherableID)
		mapId := strings.ToLower(row.MapID)
		position := PositionFromV3(row.Position).Truncate()

		node := index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId, maps.NewDict).
			LoadOrCreate(row.Encounter, func() *ScannedGatherableSpawn {
				return &ScannedGatherableSpawn{
					MapID:     mapId,
					Encounter: row.Encounter,
					Positions: make([]Position, 0),
				}
			})
		node.Positions = append(node.Positions, position)
	}

	for recordId, b1 := range index.SortedIter() {
		record := ScannedGatherable{
			GatherableID: recordId,
			Spawns:       make([]ScannedGatherableSpawn, 0),
		}
		for _, b2 := range b1.SortedIter() {
			for _, value := range b2.SortedIter() {
				positions := sortAndFilterPositions(value.Positions)
				count += len(positions)
				record.Spawns = append(record.Spawns, ScannedGatherableSpawn{
					MapID:     value.MapID,
					Encounter: value.Encounter,
					Positions: positions,
				})
			}
		}
		result = append(result, record)
	}

	return
}

type Position [2]float32

func PositionFromV3(v3 nwt.AzVec3) Position {
	return Position{float32(v3[0]), float32(v3[1])}
}

func (p Position) Key() string {
	return fmt.Sprintf("%010.3f %010.3f", p[0], p[1])
}

func (p Position) Truncate() (out Position) {
	for i := range p {
		out[i] = float32((math.RoundToEven(float64(p[i]) * 1000)) / 1000)
	}
	return out
}

func (it *Position) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteString("[")
	for i, v := range it {
		if i > 0 {
			buf.WriteString(",")
		}
		buf.WriteString(fmt.Sprintf("%0.3f", v))
	}
	buf.WriteString("]")
	return buf.Bytes(), nil
}

func comparePositions(a, b Position) int {
	if a[0] < b[0] {
		return -1
	}
	if a[0] > b[0] {
		return 1
	}
	if a[1] < b[1] {
		return -1
	}
	if a[1] > b[1] {
		return 1
	}
	return 0
}

func sortAndFilterPositions(list []Position) (result []Position) {
	slices.SortFunc(list, comparePositions)
	result = slices.Compact(list)
	result = slices.DeleteFunc(result, func(a Position) bool {
		return a[0] == 0 && a[1] == 0
	})
	return
}
