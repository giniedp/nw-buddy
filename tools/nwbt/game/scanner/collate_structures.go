package scanner

import (
	"nw-buddy/tools/utils/maps"
	"strings"
)

type ScannedStructureType struct {
	TypeID     string             `json:"type"`
	Structures []ScannedStructure `json:"structures"`
}

type ScannedStructure struct {
	MapID    string   `json:"mapID"`
	TypeID   string   `json:"type"`
	Name     string   `json:"name"`
	Position Position `json:"position"`
}

func CollateStructures(rows []StructureEntry) (result []ScannedStructureType, count int) {
	result = make([]ScannedStructureType, 0)
	index := maps.NewDict[*maps.Dict[*ScannedStructure]]()
	for _, row := range rows {
		mapId := strings.ToLower(row.MapID)
		position := PositionFromV3(row.Position).Truncate()
		recordID := strings.ToLower(row.TypeID)
		name := strings.ToLower(row.Name)

		index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId+"@"+name+"@"+position.Key(), func() *ScannedStructure {
				return &ScannedStructure{
					MapID:    mapId,
					TypeID:   row.TypeID,
					Name:     row.Name,
					Position: position,
				}
			})
	}

	for typeId, b1 := range index.SortedIter() {
		record := ScannedStructureType{
			TypeID:     typeId,
			Structures: make([]ScannedStructure, 0),
		}
		for _, value := range b1.SortedIter() {
			count += 1
			record.Structures = append(record.Structures, *value)
		}
		result = append(result, record)
	}

	return
}
