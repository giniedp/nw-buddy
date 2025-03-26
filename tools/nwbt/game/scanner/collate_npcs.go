package scanner

import (
	"nw-buddy/tools/utils/maps"
	"strings"
)

type ScannedNpc struct {
	NpcID  string            `json:"npcID"`
	Spawns []ScannedNpcSpawn `json:"spawns"`
}

type ScannedNpcSpawn struct {
	MapID     string     `json:"mapID"`
	Positions []Position `json:"positions"`
}

func CollateNpcs(rows []NpcEntry) (result []ScannedNpc, count int) {
	result = make([]ScannedNpc, 0)
	index := maps.NewDict[*maps.Dict[*ScannedNpcSpawn]]()
	for _, row := range rows {
		mapId := strings.ToLower(row.MapID)
		position := PositionFromV3(row.Position).Truncate()
		recordID := strings.ToLower(row.NpcID)

		node := index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId, func() *ScannedNpcSpawn {
				return &ScannedNpcSpawn{
					MapID: mapId,
				}
			})
		node.Positions = append(node.Positions, position)
	}

	for recordId, b1 := range index.SortedIter() {
		record := ScannedNpc{
			NpcID:  recordId,
			Spawns: make([]ScannedNpcSpawn, 0),
		}
		for _, value := range b1.SortedIter() {
			positions := sortAndFilterPositions(value.Positions)
			count += len(positions)
			record.Spawns = append(record.Spawns, ScannedNpcSpawn{
				MapID:     value.MapID,
				Positions: positions,
			})
		}
		result = append(result, record)
	}

	return
}
