package level

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/vegetation"
	"nw-buddy/tools/game"
)

// RegionVegetationData describes the `region.vegetation` file of a region.
// The instances are not converted, clients read them from the original file.
type RegionVegetationData struct {
	TileSize            int               `json:"tileSize"`
	RegionSize          int               `json:"regionSize"`
	MaxInstancesPerCell int               `json:"maxInstancesPerCell"`
	Count               int               `json:"count"`  // total number of instances
	Assets              []VegetationAsset `json:"assets"` // indexed by the asset index of the instance groups
}

type VegetationAsset struct {
	Model    string `json:"model"`              // resolved mesh file, empty if not found
	Material string `json:"material,omitempty"` // material override
	Kind     uint8  `json:"kind"`
	Flags    uint8  `json:"flags"`
	Count    int    `json:"count"` // number of instances in the region
}

// LoadVegetation reads the header and the asset table of the region.vegetation file
// and resolves the asset ids to model files.
func (dir *RegionDirectory) LoadVegetation(assets *game.Assets) *RegionVegetationData {
	file, ok := assets.Archive.Lookup(dir.PathVegetationmapFile())
	if !ok {
		return nil
	}
	doc, err := vegetation.Load(file)
	if err != nil {
		slog.Error("vegetation not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		return nil
	}

	result := &RegionVegetationData{
		TileSize:            doc.Header.TileSize,
		RegionSize:          doc.Header.RegionSize,
		MaxInstancesPerCell: doc.Header.MaxInstancesPerCell,
		Assets:              make([]VegetationAsset, len(doc.Assets)),
	}
	for i, entry := range doc.Assets {
		asset := VegetationAsset{
			Material: entry.Material,
			Kind:     entry.Kind,
			Flags:    entry.Flags,
			Count:    doc.InstanceCounts[i],
		}
		if found := assets.Catalog.LookupById(catalog.AssetId{Guid: entry.Guid, SubID: entry.SubId}); found != nil {
			asset.Model = found.File
		} else {
			slog.Warn("vegetation asset not found", "level", dir.Coatlicue.Name, "region", dir.RegionName, "guid", entry.Guid)
		}
		result.Assets[i] = asset
		result.Count += asset.Count
	}
	return result
}
