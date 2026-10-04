package level

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
	"runtime/debug"
)

const (
	WORKER_COUNT = 10
)

func (dir *RegionDirectory) LoadRuntimeCapitals(assets *game.Assets) *RegionCapitalsData {
	defer func() {
		if r := recover(); r != nil {
			debug.PrintStack()
		}
	}()
	result := &RegionCapitalsData{
		Capitals: make(map[string][]CapitalRuntimeData),
		Chunks:   make(map[string][]ChunkRuntimeData),
		Slices:   make(map[string]ViewerSlice),
	}

	for layer, list := range dir.LoadCapitalsLayers(assets) {
		result.Capitals[layer] = loadCapitalLayer(assets, list)
	}
	for layer, list := range dir.LoadChunksLayers(assets) {
		result.Chunks[layer] = loadChunkLayer(assets, list)
	}

	visitedAssetIds := maps.NewSafeSet[catalog.AssetId]()
	remainingAssetIds := maps.NewSafeSet[catalog.AssetId]()

	for _, layer := range result.Capitals {
		for _, item := range layer {
			remainingAssetIds.Store(catalog.AssetId{
				Guid:  item.Slice.Guid,
				SubID: item.Slice.SubId,
			})
			visitedAssetIds.Store(catalog.AssetId{
				Guid:  item.Slice.Guid,
				SubID: item.Slice.SubId,
			})
		}
	}
	for _, layer := range result.Chunks {
		for _, item := range layer {
			remainingAssetIds.Store(catalog.AssetId{
				Guid:  item.Slice.Guid,
				SubID: item.Slice.SubId,
			})
			visitedAssetIds.Store(catalog.AssetId{
				Guid:  item.Slice.Guid,
				SubID: item.Slice.SubId,
			})
		}
	}

	res := maps.NewSafeDict[ViewerSlice]()

	for {
		if remainingAssetIds.Len() == 0 {
			break
		}
		assetId, ok := remainingAssetIds.Shift()
		if !ok {
			break
		}

		asset := assets.Catalog.Lookup(assetId.Guid, uint(assetId.SubID))
		if asset == nil {
			continue
		}

		file, ok := assets.Archive.Lookup(asset.File)
		if !ok {
			slog.Warn("asset file not found in archive", "assetId", assetId, "file", asset.File)
			continue
		}

		slice, err := LoadViewerSlice(assets, file, func(it catalog.AssetId) {
			if !visitedAssetIds.Has(it) {
				visitedAssetIds.Store(it)
				remainingAssetIds.Store(it)
			}
		})
		if err != nil {
			slog.Warn("failed to load slice for capital", "assetId", assetId, "file", asset.File, "err", err)
			continue
		}
		res.Store(fmt.Sprintf("%s_%d", assetId.Guid, assetId.SubID), slice)
	}
	result.Slices = res.ToMap()

	return result
}

func loadCapitalLayer(assets *game.Assets, list []capitals.Capital) []CapitalRuntimeData {
	out := maps.NewSafeSet[CapitalRuntimeData]()

	progress.Concurrent(WORKER_COUNT, list, func(cap capitals.Capital, i int) error {
		asset := assets.ResolveCapitalAsset(cap)
		if asset == nil {
			return nil
		}

		if asset.Guid == "" {
			slog.Debug("capital asset has empty guid", "capitalId", cap.ID, "sliceName", cap.SliceName)
			return nil
		}

		result := CapitalRuntimeData{
			ID:        cap.ID,
			Transform: cap.Transform().ToMat4(),
		}
		if cap.Footprint != nil {
			result.Radius = cap.Footprint.Radius
		} else {
			result.Radius = 1.0
		}

		result.Slice = AssetReference{
			Guid:  asset.Guid,
			SubId: asset.SubID,
			Hint:  asset.File,
		}

		out.Store(result)
		return nil
	})
	return out.Values()
}

func loadChunkLayer(assets *game.Assets, list []nwt.ChunkEntry) []ChunkRuntimeData {
	out := maps.NewSafeSet[ChunkRuntimeData]()

	progress.Concurrent(WORKER_COUNT, list, func(chunk nwt.ChunkEntry, i int) error {
		asset := assets.Catalog.LookupById(catalog.AssetId{
			Guid:  string(chunk.AssetId.Guid),
			SubID: uint32(chunk.AssetId.SubId),
		})
		result := ChunkRuntimeData{
			ID:          fmt.Sprintf("%d_%d_%d", chunk.CellIndex.X, chunk.CellIndex.Y, chunk.CellIndex.Z),
			Size:        float32(chunk.Size),
			SpawnRadius: float32(chunk.SpawnRadius),
			ChunkType:   int32(chunk.ChunkType),
			Transform: mat4.FromAzTransformData([]nwt.AzFloat32{
				// rotation
				0, 0, 0, 1,
				// scale
				1, 1, 1,
				// translation
				chunk.WorldPosition[0],
				chunk.WorldPosition[1],
				chunk.WorldPosition[2],
			}),
		}
		if asset != nil {
			result.Slice = AssetReference{
				Guid:  asset.Guid,
				SubId: asset.SubID,
				Hint:  asset.File,
			}
		}
		out.Store(result)
		return nil
	})
	return out.Values()
}
