package level

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
)

func LoadRegionInfo(assets *game.Assets, levelName string, regionName string) *RegionInfo {
	workerCount := uint(10)

	meta := LoadRegionDefinition(assets.Archive, levelName, regionName)

	region := RegionInfo{}
	region.Name = regionName
	region.Size = meta.MapSettings.RegionSize
	region.CellResolution = meta.MapSettings.CellResolution
	region.SegmentSize = SegmentSize
	if meta.Distribution != nil {
		region.Distribution = meta.Distribution.Path()
	}

	region.PoiImpostors = make([]ImpostorInfo, len(meta.PoiImpostors))
	progress.Concurrent(workerCount, meta.PoiImpostors, func(imp impostors.Impostor, i int) error {
		file, err := assets.LookupFileByAssetIdRef(imp.MeshAssetID)
		if err != nil {
			slog.Error("impostor not loaded", "level", levelName, "region", regionName, "error", err)
		}
		if file != nil {
			region.PoiImpostors[i] = ImpostorInfo{
				Position: [2]float64{imp.WorldPosition.X, imp.WorldPosition.Y},
				Model:    file.Path(),
			}
		}
		return nil
	})

	region.Impostors = make([]ImpostorInfo, len(meta.Impostors))
	progress.Concurrent(workerCount, meta.Impostors, func(imp impostors.Impostor, i int) error {
		file, err := assets.LookupFileByAssetIdRef(imp.MeshAssetID)
		if err != nil {
			slog.Error("impostor not loaded", "level", levelName, "region", regionName, "error", err)
		}
		if file != nil {
			region.Impostors[i] = ImpostorInfo{
				Position: [2]float64{imp.WorldPosition.X, imp.WorldPosition.Y},
				Model:    file.Path(),
			}
		}
		return nil
	})

	region.Segments = make([]SegmentReference, 0)
	segmentStride := region.Size / region.SegmentSize
	for y := range segmentStride {
		for x := range segmentStride {
			i := y*(segmentStride) + x
			region.Segments = append(region.Segments, SegmentReference{
				ID:       i,
				Location: &[2]int{x, y},
			})
		}
	}

	region.Capitals = make([]CapitalLayerInfo, 0)

	for _, layer := range meta.Capitals {
		layerInfo := CapitalLayerInfo{
			Name:     layer.Name,
			Capitals: make([]CapitalInfo, len(layer.Capitals)),
			Chunks:   make([]ChunkInfo, len(layer.Chunks)),
		}

		progress.Concurrent(workerCount, layer.Capitals, func(cap capitals.Capital, i int) error {
			file := assets.ResolveDynamicSliceByName(cap.SliceName)
			result := CapitalInfo{
				ID:        cap.ID,
				Transform: cap.Transform().ToMat4(),
			}
			if cap.Footprint != nil {
				result.Radius = cap.Footprint.Radius
			} else {
				result.Radius = 1.0
			}
			if file != nil {
				result.Slice = file.Path()
			}
			layerInfo.Capitals[i] = result
			return nil
		})

		progress.Concurrent(workerCount, layer.Chunks, func(chunk nwt.ChunkEntry, i int) error {
			file, _ := assets.LookupFileByAssetId(chunk.Assetid)
			result := ChunkInfo{
				ID:   fmt.Sprintf("%d_%d_%d", chunk.Cellindex.X, chunk.Cellindex.Y, chunk.Cellindex.Z),
				Size: float32(chunk.Size),
				Transform: mat4.FromAzTransformData([]nwt.AzFloat32{
					// rotation
					0, 0, 0, 1,
					// scale
					1, 1, 1,
					// translation
					chunk.Worldposition[0],
					chunk.Worldposition[1],
					chunk.Worldposition[2],
				}),
			}
			if file != nil {
				result.Slice = file.Path()
			}
			layerInfo.Chunks[i] = result
			return nil
		})

		region.Capitals = append(region.Capitals, layerInfo)
	}

	return &region
}
