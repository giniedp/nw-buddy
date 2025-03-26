package scanner

import (
	"nw-buddy/tools/utils/maps"
	"strings"
)

type ScannedStationType struct {
	StationID string           `json:"stationID"`
	Stations  []ScannedStation `json:"stations"`
}

type ScannedStation struct {
	MapID     string   `json:"mapID"`
	StationID string   `json:"stationID"`
	Name      string   `json:"name"`
	Position  Position `json:"position"`
}

func CollateStations(rows []StationEntry) (result []ScannedStationType, count int) {
	result = make([]ScannedStationType, 0)
	index := maps.NewDict[*maps.Dict[*ScannedStation]]()
	for _, row := range rows {
		mapId := strings.ToLower(row.MapID)
		position := PositionFromV3(row.Position).Truncate()
		recordID := strings.ToLower(row.StationID)
		name := strings.ToLower(row.Name)

		index.
			LoadOrCreate(recordID, maps.NewDict).
			LoadOrCreate(mapId+"@"+name+"@"+position.Key(), func() *ScannedStation {
				return &ScannedStation{
					MapID:     mapId,
					StationID: row.StationID,
					Name:      row.Name,
					Position:  position,
				}
			})
	}

	for stationID, b1 := range index.SortedIter() {
		record := ScannedStationType{
			StationID: stationID,
			Stations:  make([]ScannedStation, 0),
		}
		for _, value := range b1.SortedIter() {
			record.StationID = value.StationID
			record.Stations = append(record.Stations, *value)
		}
		count += len(record.Stations)
		result = append(result, record)
	}

	return
}
