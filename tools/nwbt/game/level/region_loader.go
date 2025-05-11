package level

import (
	"fmt"
	"log/slog"
	m "math"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
)

type regionLoader struct {
	assets       *game.Assets
	name         string
	info         *RegionInfo
	distribution *DistributionInfo
	entities     map[string]map[string][]EntityInfo
}

func (r *regionLoader) Info() *RegionInfo {
	return r.info
}

func (r *regionLoader) Entities() map[string]map[string][]EntityInfo {
	if r.info == nil {
		return nil
	}
	if r.entities != nil {
		return r.entities
	}
	result := maps.NewSafeDict[map[string][]EntityInfo]()
	for _, layer := range r.info.Capitals {
		entities := maps.NewSafeDict[[]EntityInfo]()
		progress.Concurrent(10, layer.Capitals, func(it CapitalInfo, i int) error {
			items := LoadEntities(r.assets, it.Slice, it.Transform)
			for i := range items {
				items[i].Layer = layer.Name
			}
			if len(items) > 0 {
				entities.Store(it.ID, items)
			}
			return nil
		})
		progress.Concurrent(10, layer.Chunks, func(it ChunkInfo, i int) error {
			items := LoadEntities(r.assets, it.Slice, it.Transform)
			for i := range items {
				items[i].Layer = layer.Name
			}
			if len(items) > 0 {
				entities.Store(it.ID, items)
			}
			return nil
		})
		if entities.Len() > 0 {
			result.Store(layer.Name, entities.ToMap())
		}
	}
	r.entities = result.ToMap()
	return r.entities
}

func (r *regionLoader) Distribution() *DistributionInfo {
	if r.distribution != nil {
		return r.distribution
	}
	if r.Info().Distribution == "" {
		return nil
	}
	file, ok := r.assets.Archive.Lookup(r.Info().Distribution)
	if !ok {
		return nil
	}
	doc, err := distribution.Load(file)
	if err != nil {
		slog.Error("distribution not loaded", "file", file.Path(), "error", err)
		return nil
	}

	slices := maps.NewSafeDict[[]EntityInfo]()
	segments := maps.NewSafeDict[map[string]DistributionSlice]()

	progress.Concurrent(10, doc.Positions, func(position [2]uint16, i int) error {
		index := doc.Indices[i]
		sliceName := doc.Slices[index]

		slices.LoadOrStoreFn(sliceName, func() []EntityInfo {
			sliceFile := r.assets.ResolveDynamicSliceByName(sliceName)
			if sliceFile == nil {
				return nil
			}
			return LoadEntities(r.assets, sliceFile.Path(), mat4.Identity())
		})

		worldX, worldY, localX, localY := distribution.ConvertPosition(doc.Region, position)
		segmentX := int(m.Floor(float64(localX) / 128))
		segmentY := int(m.Floor(float64(localY) / 128))

		key := fmt.Sprintf("%d_%d", segmentX, segmentY)

		segments.Write(func() {
			bucket, _ := segments.LoadOrStoreFn(key, func() map[string]DistributionSlice {
				return make(map[string]DistributionSlice)
			})
			slice, ok := bucket[sliceName]
			if !ok {
				slice = DistributionSlice{
					Slice:     sliceName,
					Positions: make([][2]float32, 0),
				}
			}
			slice.Positions = append(slice.Positions, [2]float32{float32(worldX), float32(worldY)})
			bucket[sliceName] = slice
		})

		return nil
	})

	r.distribution = &DistributionInfo{
		Slices:   slices.ToMap(),
		Segments: make(map[string][]DistributionSlice),
	}

	return r.distribution
}
