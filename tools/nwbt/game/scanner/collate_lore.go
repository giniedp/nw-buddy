package scanner

import (
	"nw-buddy/tools/utils/maps"
	"strings"
)

type ScannedLore struct {
	LoreID string             `json:"loreID"`
	Spawns []ScannedLoreSpawn `json:"spawns"`
}

type ScannedLoreSpawn struct {
	MapID     string     `json:"mapID"`
	Positions []Position `json:"positions"`
}

func CollateLoreNotes(rows []LorenoteEntry) (result []ScannedLore, count int) {
	result = make([]ScannedLore, 0)
	index := maps.NewDict[*maps.Dict[*ScannedLoreSpawn]]()
	for _, row := range rows {
		mapId := strings.ToLower(row.MapID)
		position := PositionFromV3(row.Position).Truncate()
		recordID := strings.ToLower(row.LoreID)

		node := index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId, func() *ScannedLoreSpawn {
				return &ScannedLoreSpawn{
					MapID: mapId,
				}
			})
		node.Positions = append(node.Positions, position)
	}

	for recordID, b1 := range index.SortedIter() {
		record := ScannedLore{
			LoreID: recordID,
			Spawns: make([]ScannedLoreSpawn, 0),
		}
		for _, value := range b1.SortedIter() {
			positions := sortAndFilterPositions(value.Positions)
			count += len(positions)
			record.Spawns = append(record.Spawns, ScannedLoreSpawn{
				MapID:     value.MapID,
				Positions: positions,
			})
		}
		result = append(result, record)
	}

	return
}
