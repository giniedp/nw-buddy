package tracts

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
)

func Load(file nwfs.File) (*Document, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (*Document, error) {
	var document Document
	err := json.UnmarshalJSON(data, &document)
	return &document, err
}

type Document struct {
	TractmapCellSize         int            `json:"tractmapCellSize"`
	HeightmapCellSize        int            `json:"heightmapCellSize"`
	RegionSize               int            `json:"regionSize"`
	TerritoryMasterSlicePath string         `json:"territoryMasterSlicePath"`
	World                    World          `json:"world"`
	Tracts                   []Tract        `json:"tracts"`
	Regions                  []Region       `json:"regions"`
	ForcedRegions            []ForcedRegion `json:"forcedRegions"`
}

type World struct {
	Type   string `json:"type"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
}

type Tract struct {
	Name         string `json:"name"`
	MapCategory  string `json:"mapCategory"`
	DisplayColor Color  `json:"displayColor"`
}

type Color struct {
	R uint8 `json:"r"`
	G uint8 `json:"g"`
	B uint8 `json:"b"`
}

type Region struct {
	Name           string   `json:"name"`
	SpawnManifests []string `json:"spawnManifests"`
}

type ForcedRegion struct {
	Location   Location `json:"location"`
	RegionName string   `json:"regionName"`
}

type Location struct {
	X int `json:"x"`
	Y int `json:"y"`
}
