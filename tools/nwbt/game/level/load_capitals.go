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
	"path"
	"runtime"
	"runtime/debug"
	"strconv"
	"strings"
	"sync"
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

	roots := make([]catalog.AssetId, 0)
	variants := make([]AssetReference, 0)
	for _, layer := range result.Capitals {
		for _, item := range layer {
			if item.Slice.Variant != "" {
				// the variant slice is derived from the master slice
				variants = append(variants, item.Slice)
			}
			roots = append(roots, catalog.AssetId{
				Guid:  item.Slice.Guid,
				SubID: item.Slice.SubId,
			})
		}
	}
	for _, layer := range result.Chunks {
		for _, item := range layer {
			roots = append(roots, catalog.AssetId{
				Guid:  item.Slice.Guid,
				SubID: item.Slice.SubId,
			})
		}
	}
	// variant slices spawn the slices of their meta, which may be variants themselves
	variantMetas := make(map[string]*nwt.SliceMetaData)
	for i := 0; i < len(variants); i++ {
		ref := variants[i]
		if _, ok := variantMetas[ref.Key()]; ok {
			continue
		}
		meta := loadVariantMeta(assets, strings.TrimSuffix(ref.Hint, ".dynamicslice"), ref.Variant)
		variantMetas[ref.Key()] = meta
		if meta == nil {
			continue
		}
		roots = append(roots, catalog.AssetId{Guid: ref.Guid, SubID: ref.SubId})
		for _, spawner := range meta.Spawners.Element {
			spawned, ok := variantSpawnerRef(assets, spawner)
			if !ok {
				continue
			}
			roots = append(roots, catalog.AssetId{Guid: spawned.Guid, SubID: spawned.SubId})
			if spawned.Variant != "" {
				variants = append(variants, spawned)
			}
		}
	}
	result.Slices = LoadSliceClosure(assets, roots)

	sliceData := dir.LoadSliceDataLookup(assets)
	for key, slice := range result.Slices {
		guid, subId, ok := parseSliceKey(key)
		if !ok {
			continue
		}
		asset := assets.Catalog.Lookup(guid, uint(subId))
		if asset == nil {
			continue
		}
		if meta := sliceData[sliceDataKey{slice: sliceDataName(asset.File)}]; meta != nil {
			applyImpostorFlags(assets, &slice, meta)
			slice.Gde = sliceGde(meta)
			result.Slices[key] = slice
		}
	}
	for _, ref := range variants {
		key := ref.Key()
		if _, ok := result.Slices[key]; ok {
			continue
		}
		master, ok := result.Slices[AssetReference{Guid: ref.Guid, SubId: ref.SubId}.Key()]
		meta := variantMetas[key]
		if !ok || meta == nil {
			continue
		}
		slice := loadVariantSlice(assets, master, ref, meta)
		slice.Gde = sliceGde(meta)
		if meta := sliceData[sliceDataKey{slice: sliceDataName(ref.Hint), variant: ref.Variant}]; meta != nil {
			applyImpostorFlags(assets, &slice, meta)
			slice.Gde = sliceGde(meta)
		}
		result.Slices[key] = slice
	}
	applyActorReach(result.Slices)

	return result
}

// parseSliceKey splits a "guid_subId" key of the slice closure
func parseSliceKey(key string) (string, uint32, bool) {
	guid, sub, ok := strings.Cut(key, "_")
	if !ok {
		return "", 0, false
	}
	subId, err := strconv.ParseUint(sub, 10, 32)
	if err != nil {
		return "", 0, false
	}
	return guid, uint32(subId), true
}

// variantSpawnerRef resolves a spawner entry of a slice meta. The spawned slice is a variant if the entry has a
// variation with a baked meta.
func variantSpawnerRef(assets *game.Assets, spawner nwt.SliceMetaDataSpawnerEntry) (AssetReference, bool) {
	asset := assets.Catalog.Lookup(string(spawner.SliceAssetId.Guid), uint(spawner.SliceAssetId.SubId))
	if asset == nil {
		return AssetReference{}, false
	}
	ref := AssetReference{
		Guid:  asset.Guid,
		SubId: asset.SubID,
		Hint:  asset.File,
	}
	if variant := string(spawner.VariationName); variant != "" && hasVariantMeta(assets, strings.TrimSuffix(asset.File, ".dynamicslice"), variant) {
		ref.Variant = strings.ToLower(variant)
	}
	return ref, true
}

// loadVariantSlice derives a variant slice from its master slice. The mesh and prefab spawner components of the
// master are replaced by the meshes and spawners of the baked variant meta: the variation data swaps meshes and
// spawned slices (e.g. the chest of a loot container), spawners that are not listed are spawned later by gameplay
// (e.g. the cut trunk of a depleted tree). Everything else is kept.
func loadVariantSlice(assets *game.Assets, master ViewerSlice, ref AssetReference, meta *nwt.SliceMetaData) ViewerSlice {
	sliceName := strings.TrimSuffix(ref.Hint, ".dynamicslice")
	result := master
	result.Entities = make([]ViewerEntity, 0, len(master.Entities))
	for _, entity := range master.Entities {
		components := make([]any, 0, len(entity.Components))
		for _, component := range entity.Components {
			switch component.(type) {
			case ViewerMeshComponent, ViewerPrefabSpawnerComponent:
				continue
			}
			components = append(components, component)
		}
		entity.Components = components
		result.Entities = append(result.Entities, entity)
	}

	// meta transforms are root relative, entity transforms are in slice space
	root := mat4.Identity()
	if master.Transform != nil {
		root = *master.Transform
	}
	meshes, _ := resolveVariantMetaMeshes(assets, sliceName, ref.Variant, root)
	for i, mesh := range meshes {
		result.Entities = append(result.Entities, ViewerEntity{
			ID:        fmt.Sprintf("variant_%d", i),
			Name:      path.Base(mesh.model),
			Transfrom: mesh.transform,
			Components: []any{
				ViewerMeshComponent{
					Type:                   MeshComponentName,
					Model:                  mesh.model,
					Material:               mesh.material,
					MaxViewDistance:        mesh.maxViewDistance,
					ViewDistanceMultiplier: 1,
					Opacity:                1,
					CastShadow:             true,
					ShouldInstance:         true,
					FadeEnabled:            true,
				},
			},
		})
	}
	for i, spawner := range meta.Spawners.Element {
		spawned, ok := variantSpawnerRef(assets, spawner)
		if !ok {
			continue
		}
		result.Entities = append(result.Entities, ViewerEntity{
			ID:        fmt.Sprintf("variant_spawner_%d", i),
			Name:      path.Base(spawned.Hint),
			Transfrom: mat4.Multiply(root, mat4.FromAzTransform(spawner.WorldTM)),
			Components: []any{
				ViewerPrefabSpawnerComponent{
					Type:  PrefabSpawnerComponentName,
					Slice: spawned,
				},
			},
		})
	}
	return result
}

// SliceRef is a slice to load: the master (empty variant) or a lower case variant of it
type SliceRef struct {
	Id      catalog.AssetId
	Variant string
}

// Key is the key of the slice in the closure, see AssetReference.Key
func (it SliceRef) Key() string {
	return AssetReference{Guid: it.Id.Guid, SubId: it.Id.SubID, Variant: it.Variant}.Key()
}

// LoadSliceClosure loads the given master slices and all slices they reference (spawners, skyboxes), keyed by
// "guid_subId", variants of spawned slices by "guid_subId_variant"
func LoadSliceClosure(assets *game.Assets, roots []catalog.AssetId) map[string]ViewerSlice {
	refs := make([]SliceRef, 0, len(roots))
	for _, id := range roots {
		refs = append(refs, SliceRef{Id: id})
	}
	return LoadSliceRefClosure(assets, refs)
}

// LoadSliceRefClosure loads the given slices and all slices they reference.
//
// The slices are loaded breadth first, each level of the reference graph concurrently.
func LoadSliceRefClosure(assets *game.Assets, roots []SliceRef) map[string]ViewerSlice {
	var mu sync.Mutex
	visited := make(map[SliceRef]struct{}, len(roots))
	frontier := make([]SliceRef, 0, len(roots))
	for _, ref := range roots {
		if _, ok := visited[ref]; ok {
			continue
		}
		visited[ref] = struct{}{}
		frontier = append(frontier, ref)
	}

	res := make(map[string]ViewerSlice)
	workers := uint(runtime.GOMAXPROCS(0))

	for len(frontier) > 0 {
		next := make([]SliceRef, 0)
		track := func(it catalog.AssetId, variant string) {
			mu.Lock()
			defer mu.Unlock()
			ref := SliceRef{Id: it, Variant: variant}
			if _, ok := visited[ref]; ok {
				return
			}
			visited[ref] = struct{}{}
			next = append(next, ref)
		}

		progress.Concurrent(workers, frontier, func(ref SliceRef, _ int) error {
			asset := assets.Catalog.Lookup(ref.Id.Guid, uint(ref.Id.SubID))
			if asset == nil {
				return nil
			}

			file, ok := assets.Archive.Lookup(asset.File)
			if !ok {
				slog.Warn("asset file not found in archive", "assetId", ref.Id, "file", asset.File)
				return nil
			}

			slice, err := LoadViewerSlice(assets, file, ref.Variant, track)
			if err != nil {
				slog.Warn("failed to load slice", "assetId", ref.Id, "file", asset.File, "err", err)
				return nil
			}

			key := ref.Key()
			mu.Lock()
			res[key] = slice
			mu.Unlock()
			return nil
		})

		frontier = next
	}
	return res
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
		if cap.VariantName != "" && hasVariantMeta(assets, strings.TrimSuffix(asset.File, ".dynamicslice"), cap.VariantName) {
			// the variant is served as its own slice, without a meta the master slice is used
			result.Slice.Variant = strings.ToLower(cap.VariantName)
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
