package models

import (
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/maps"
)

type Collector struct {
	*game.Assets
	models *maps.Dict[importer.AssetGroup]
}

func NewCollector(assets *game.Assets) *Collector {
	return &Collector{
		Assets: assets,
		models: maps.NewDict[importer.AssetGroup](),
	}
}
