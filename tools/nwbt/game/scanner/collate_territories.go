package scanner

import (
	"nw-buddy/tools/utils/maps"
	"strings"
)

type BBox [4]float32

type ScannedTerritory struct {
	TerritoryID string    `json:"territoryID"`
	Geometry    []Polygon `json:"geometry"`
}

type Polygon struct {
	Type        string       `json:"type"`
	BBox        BBox         `json:"bbox"`
	Coordinates [][]Position `json:"coordinates"`
}

func CollateTerritories(rows []TerritoryEntry) (result []ScannedTerritory, count int) {
	result = make([]ScannedTerritory, 0)
	index := maps.NewDict[*ScannedTerritory]()
	for _, row := range rows {
		recordID := strings.ToLower(row.TerritoryID)

		node := index.LoadOrCreate(recordID, func() *ScannedTerritory {
			return &ScannedTerritory{
				TerritoryID: recordID,
				Geometry:    make([]Polygon, 0),
			}
		})

		if len(row.Shape) > 0 {
			position := row.Position
			shape := make([]Position, len(row.Shape))
			for i, p := range row.Shape {
				shape[i] = Position{float32(p[0] + position[0]), float32(p[1] + position[1])}.Truncate()
			}
			bbox := BBox{
				shape[0][0], shape[0][1],
				shape[0][0], shape[0][1],
			}
			for _, p := range shape {
				if p[0] < bbox[0] {
					bbox[0] = p[0]
				}
				if p[1] < bbox[1] {
					bbox[1] = p[1]
				}
				if p[0] > bbox[2] {
					bbox[2] = p[0]
				}
				if p[1] > bbox[3] {
					bbox[3] = p[1]
				}
			}
			node.Geometry = append(node.Geometry, Polygon{
				Type:        "Polygon",
				BBox:        bbox,
				Coordinates: [][]Position{shape},
			})
		}

	}

	for _, value := range index.SortedIter() {
		result = append(result, *value)
	}
	count = len(result)
	return
}
