package level

import (
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/maps"
)

type collectionLoader struct {
	assets *game.Assets
	levels *maps.SafeDict[Loader]
}

func NewCollectionLoader(assets *game.Assets) CollectionLoader {
	return &collectionLoader{
		assets: assets,
		levels: maps.NewSafeDict[Loader](),
	}
}
