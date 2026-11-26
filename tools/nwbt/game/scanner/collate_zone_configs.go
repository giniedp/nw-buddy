package scanner

import (
	"cmp"
	"nw-buddy/tools/utils/maps"
	"slices"
	"strings"
)

type ScannedZoneConfig struct {
	ConfigName string    `json:"configName"`
	Geometry   []Polygon `json:"geometry"`
}

func CollateZoneConfigs(rows []ZoneConfigEntry) (result []ScannedZoneConfig, count int) {
	result = make([]ScannedZoneConfig, 0)
	index := maps.NewDict[*ScannedZoneConfig]()
	for _, row := range rows {
		recordID := strings.ToLower(row.Config)

		node := index.LoadOrCreate(recordID, func() *ScannedZoneConfig {
			return &ScannedZoneConfig{
				ConfigName: recordID,
				Geometry:   make([]Polygon, 0),
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
		slices.SortFunc(value.Geometry, comparePolygons)

		result = append(result, *value)
	}
	count = len(result)
	return
}

// comparePolygons orders by bounding box, then by vertices
func comparePolygons(a, b Polygon) int {
	for i := range a.BBox {
		if c := cmp.Compare(a.BBox[i], b.BBox[i]); c != 0 {
			return c
		}
	}
	if c := cmp.Compare(len(a.Coordinates), len(b.Coordinates)); c != 0 {
		return c
	}
	for r := range a.Coordinates {
		if c := slices.CompareFunc(a.Coordinates[r], b.Coordinates[r], comparePositions); c != 0 {
			return c
		}
	}
	return 0
}
