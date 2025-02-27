package scan

import (
	"nw-buddy/tools/utils"
	"strings"
)

type ScannedHouseType struct {
	HouseTypeId string         `json:"houseTypeID"`
	Houses      []ScannedHouse `json:"houses"`
}

type ScannedHouse struct {
	MapID       string   `json:"mapID"`
	HouseTypeID string   `json:"houseTypeID"`
	Position    Position `json:"position"`
}

func CollateHouses(rows []HouseEntry) (result []ScannedHouseType, count int) {
	index := utils.NewRecord[*utils.Record[*ScannedHouse]]()
	for _, row := range rows {
		mapId := strings.ToLower(row.MapID)
		position := PositionFromV3(row.Position).Truncate()
		typeID := strings.ToLower(row.HouseID)

		index.
			GetOrCreate(typeID, utils.NewRecord).
			GetOrCreate(mapId+"@"+position.Key(), func() *ScannedHouse {
				return &ScannedHouse{
					MapID:       mapId,
					HouseTypeID: row.HouseID,
					Position:    position,
				}
			})
	}

	for typeID, b1 := range index.SortedIter() {
		record := ScannedHouseType{
			HouseTypeId: typeID,
		}
		for _, value := range b1.SortedIter() {
			count += 1
			record.Houses = append(record.Houses, *value)
		}
		result = append(result, record)
	}

	return
}
