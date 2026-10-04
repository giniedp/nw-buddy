package serve

import (
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game/level"
)

type ServeApi struct {
	List                                  ServeListResult              `json:"'/list/{filePattern}'"`
	Stats                                 ServeStatResult              `json:"'/stats/{filePattern}'"`
	Assets                                ServeAssetIdResult           `json:"'/assets/{assetId}'"`
	LevelsList                            level.LevelIndex             `json:"'/levels/list.json'"`
	LevelsCoatlicueInfo                   level.CoatlicueInfo          `json:"'/levels/{coatlicue}/info.json'"`
	LevelsCoatlicueRegionInfo             level.RegionInfo             `json:"'/levels/{coatlicue}/{region}/info.json'"`
	LevelsCoatlicueRegionCapitals         level.RegionCapitalsData     `json:"'/levels/{coatlicue}/{region}/capitals.json'"`
	LevelsCoatlicueRegionHeightmap        []byte                       `json:"'/levels/{coatlicue}/{region}/heightmap.r16'" ts_type:"ArrayBuffer"`
	LevelsCoatlicueRegionWatermap         []byte                       `json:"'/levels/{coatlicue}/{region}/watermap.r16'" ts_type:"ArrayBuffer"`
	LevelsCoatlicueRegionDistribution     level.RegionDistributionData `json:"'/levels/{coatlicue}/{region}/distribution.json'"`
	LevelsCoatlicueRegionDistributionData []byte                       `json:"'/levels/{coatlicue}/{region}/distribution.bin'" ts_type:"ArrayBuffer"`
}

type ServeListResult struct {
	Items []string `json:"items"`
}

type ServeAssetIdResult struct {
	Asset  *catalog.Asset   `json:"asset"`
	Assets []*catalog.Asset `json:"assets"`
	Link   catalog.AssetId  `json:"link"`
	Legacy catalog.AssetId  `json:"legacy"`
}

type ServeStatResult struct {
	Items []ServeStatResultEntry `json:"items"`
}

type ServeStatResultEntry struct {
	File  string         `json:"file,omitempty"`
	Asset *catalog.Asset `json:"asset,omitempty"`
	Dds   map[string]any `json:"dds,omitempty"`
}
