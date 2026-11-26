package serve

import (
	"nw-buddy/tools/formats/catalog"
)

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
