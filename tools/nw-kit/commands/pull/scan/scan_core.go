package scan

import (
	"fmt"
	"iter"
	"log/slog"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/rtti/nwt"
	"nw-buddy/tools/nw-kit/utils"
	"nw-buddy/tools/nw-kit/utils/crymath"
	"path"
	"slices"
)

func (ctx *Scanner) ScanSliceComponentForData(slice *nwt.SliceComponent, source string) []SliceData {
	result := make([]SliceData, 0)

	for entity, components := range EntitiesOf(slice) {
		data := SliceData{
			Entity:    entity,
			Trace:     []any{source},
			Transform: FindTransform(entity),
		}

		for _, component := range components {
			switch v := component.(type) {
			case nwt.NameComponent:
				data.Name = string(v.M_name)
			case nwt.NpcComponent:
				if data.NpcID == "" {
					data.NpcID = string(v.M_npckey)
				}
			case nwt.VitalsComponent:
				if data.VitalsID == "" {
					data.VitalsID = string(v.M_rowreference)
				}
			case nwt.ActionListComponent:
				if data.DamageTable == "" {
					data.DamageTable = string(v.M_damagetable.Asset.BaseClass1.AssetPath)
				}
				if data.AdbFile == "" {
					data.AdbFile = string(v.M_animationdatabase.BaseClass1.AssetPath)
				}
				for _, tag := range v.M_defaulttags.Element {
					data.Tags = utils.AppendUniqNoZero(data.Tags, string(tag))
				}
			case nwt.AIVariantProviderComponent:
				facet := v.BaseClass1.M_serverFacetPtr
				switch f := facet.(type) {
				case nwt.AIVariantProviderComponentServerFacet:
					if data.VitalsID == "" {
						data.VitalsID = string(f.M_vitalstablerowid)
					}
					if data.CategoryID == "" {
						data.CategoryID = string(f.M_vitalscategorytablerowid)
					}
					if data.Level == 0 {
						data.Level = int(f.M_vitalslevel)
					}
					if !data.TerritoryLevel {
						data.TerritoryLevel = bool(f.M_useterritoryleveloverride)
						// TODO: what is M_useterritorypostfixoverride ?
					}
				}
			case nwt.VariationDataComponent:
				if data.VariantID == "" {
					data.VariantID = string(v.M_selectedvariant)
				}
			case nwt.GatherableControllerComponent:
				if data.GatherableID == "" {
					data.GatherableID = string(v.M_gatherableentryid)
				}
			case nwt.ReadingInteractionComponent:
				data.LoreIDs = utils.AppendUniqNoZero(data.LoreIDs, string(v.M_loreid))
			case nwt.SkinnedMeshComponent:
				if data.ModelFile != "" || !v.Skinned_Mesh_Render_Node.Visible {
					break
				}
				if file, err := ctx.LookupFileByAsset(v.Skinned_Mesh_Render_Node.Skinned_Mesh); err == nil && file != nil {
					data.ModelFile = file.Path()
				}
				if file, err := ctx.LookupFileByAsset(v.Skinned_Mesh_Render_Node.Material_Override_Asset); err == nil && file != nil {
					data.MtlFile = file.Path()
				}
			case nwt.MeshComponent:
				if data.ModelFile != "" || !v.Static_Mesh_Render_Node.Visible {
					break
				}
				if file, err := ctx.LookupFileByAsset(v.Static_Mesh_Render_Node.Static_Mesh); err == nil && file != nil {
					data.ModelFile = file.Path()
				}
				if file, err := ctx.LookupFileByAsset(v.Static_Mesh_Render_Node.Material_Override_Asset); err == nil && file != nil {
					data.MtlFile = file.Path()
				}
			case nwt.HousingPlotComponent:
				if data.HouseType == "" {
					data.HouseType = string(v.M_housetypestring)
				}
			case nwt.AssemblyComponent:
				if data.StationID == "" {
					data.StationID = string(v.M_craftingstationreference.M_craftingstationentry)
				}
			case nwt.TradingPostComponent:
				if data.StructureType == "" {
					data.StructureType = "TradingPost"
				}
			case nwt.StorageComponent:
				if !v.M_isplayeruniquestorage {
					break
				}
				facet := v.BaseClass1.M_clientFacetPtr
				switch f := facet.(type) {
				case nwt.StorageComponentClientFacet:
					if f.M_showpreview {
						data.StructureType = "Storage"
					}
				}
			}
		}
		result = append(result, data)
	}
	return result
}

type spawnFtueIsland struct {
	entity    *nwt.AZ__Entity
	transform crymath.Transform
}

func (ctx *Scanner) ScanSliceComponentForFtueIslandSpawner(slice *nwt.SliceComponent, source nwfs.File) []spawnFtueIsland {
	result := make([]spawnFtueIsland, 0)
	for entity, components := range EntitiesOf(slice) {
		entry := spawnFtueIsland{
			entity:    entity,
			transform: FindTransform(entity),
		}
		isSpawner := false
		for _, component := range components {
			if _, ok := component.(nwt.FtueIslandComponent); ok {
				isSpawner = true
				break
			}
		}
		if isSpawner && entry.transform != nil {
			result = append(result, entry)
		}
	}
	return result
}

type spawnArea struct {
	entity    *nwt.AZ__Entity
	asset     nwt.AzAsset
	locations []crymath.Transform
}

func (ctx *Scanner) ScanSliceComponentForAreaSpawner(slice *nwt.SliceComponent, source nwfs.File) []spawnArea {
	result := make([]spawnArea, 0)
	for entity, components := range EntitiesOf(slice) {
		assets := make([]nwt.AzAsset, 0)
		locations := make([]crymath.Transform, 0)
		for _, component := range components {
			spawner, ok := component.(nwt.AreaSpawnerComponent)
			if !ok {
				continue
			}
			facet, ok := spawner.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
			if !ok {
				continue
			}
			assets = utils.AppendUniqNoZero(assets, facet.M_sliceAsset)
			assets = utils.AppendUniqNoZero(assets, facet.M_aliasAsset)
			for _, loc := range facet.M_locations.Element {
				entity := FindEntityById(slice, loc.EntityId.Id)
				if transform := FindTransform(entity); transform != nil {
					locations = append(locations, transform)
				}
			}
		}

		for _, asset := range assets {
			result = append(result, spawnArea{
				entity:    entity,
				asset:     asset,
				locations: locations,
			})
		}
	}
	return result
}

type spawnPoint struct {
	entity    *nwt.AZ__Entity
	asset     nwt.AzAsset
	transform crymath.Transform
}

func (ctx *Scanner) ScanSliceComponentForPointSpawner(slice *nwt.SliceComponent, source nwfs.File) []spawnPoint {
	result := make([]spawnPoint, 0)
	for entity, components := range EntitiesOf(slice) {
		assets := make([]nwt.AzAsset, 0)
		transform := FindTransform(entity)
		for _, component := range components {
			if spawner, ok := component.(nwt.PointSpawnerComponent); ok {
				assets = utils.AppendUniqNoZero(assets, spawner.BaseClass1.M_sliceAsset)
				assets = utils.AppendUniqNoZero(assets, spawner.BaseClass1.M_aliasAsset)
			}
		}

		for _, asset := range assets {
			result = append(result, spawnPoint{
				entity:    entity,
				asset:     asset,
				transform: transform,
			})
		}
	}
	return result
}

type spawnEncounter struct {
	entity    *nwt.AZ__Entity
	asset     nwt.AzAsset
	transform crymath.Transform
	locations []crymath.Transform
}

func (ctx *Scanner) ScanSliceComponentForEncounterSpawner(slice *nwt.SliceComponent, source nwfs.File) []spawnEncounter {
	result := make([]spawnEncounter, 0)
	for entity, components := range EntitiesOf(slice) {
		transform := FindTransform(entity)
		for _, component := range components {
			encounter, ok := component.(nwt.EncounterComponent)
			if !ok {
				continue
			}
			for _, spawn := range encounter.M_spawntimeline.Element {
				assets := make([]nwt.AzAsset, 0)
				assets = utils.AppendUniqNoZero(assets, spawn.M_sliceAsset)
				assets = utils.AppendUniqNoZero(assets, spawn.M_aliasAsset)
				locations := make([]crymath.Transform, 0)
				for _, loc := range spawn.M_spawnlocations.Element {
					entity := FindEntityById(slice, loc.EntityId.Id)
					if transform := FindTransform(entity); transform != nil {
						locations = append(locations, transform)
					}
				}
				for _, asset := range assets {
					result = append(result, spawnEncounter{
						entity:    entity,
						asset:     asset,
						locations: locations,
						transform: transform,
					})
				}
			}
		}
	}
	return result
}

type spawnPrefab struct {
	entity    *nwt.AZ__Entity
	asset     nwt.AzAsset
	transform crymath.Transform
	variantId string
}

func (ctx *Scanner) ScanSliceComponentForPrefabSpawner(slice *nwt.SliceComponent, source nwfs.File) []spawnPrefab {
	result := make([]spawnPrefab, 0)
	for entity, components := range EntitiesOf(slice) {
		transform := FindTransform(entity)
		assets := make([]nwt.AzAsset, 0)
		variantId := ""
		for _, component := range components {
			if spawner, ok := component.(nwt.PrefabSpawnerComponent); ok {
				variantId = string(spawner.M_sliceVariant)
				assets = utils.AppendUniqNoZero(assets, spawner.M_sliceAsset)
				assets = utils.AppendUniqNoZero(assets, spawner.M_aliasAsset)
			}
		}
		for _, asset := range assets {
			result = append(result, spawnPrefab{
				entity:    entity,
				asset:     asset,
				transform: transform,
				variantId: variantId,
			})
		}
	}
	return result
}

type spawnProjectile struct {
	entity    *nwt.AZ__Entity
	asset     *nwt.AzAsset
	prefab    string
	transform crymath.Transform
	ammoId    string
}

func (ctx *Scanner) ScanSliceComponentForProjectileSpawner(slice *nwt.SliceComponent, source nwfs.File) []spawnProjectile {
	result := make([]spawnProjectile, 0)
	for entity, components := range EntitiesOf(slice) {
		transform := FindTransform(entity)
		assets := make([]nwt.AzAsset, 0)
		ammoId := ""
		for _, component := range components {
			if psc, ok := component.(nwt.ProjectileSpawnerComponent); ok {
				ammoId = string(psc.M_ammoid)
			}
			pc, ok := component.(nwt.ProjectileComponent)
			if !ok {
				continue
			}
			facet, ok := pc.BaseClass1.M_serverFacetPtr.(nwt.ProjectileComponentServerFacet)
			if !ok {
				continue
			}
			assets = utils.AppendUniqNoZero(assets, facet.M_spawnonhitasset)
		}
		if ammoId != "" {
			result = append(result, spawnProjectile{
				entity:    entity,
				prefab:    ctx.FindPrefabPathForAmmoId(ammoId),
				transform: transform,
				ammoId:    ammoId,
				asset:     nil,
			})
		}
		for _, asset := range assets {
			result = append(result, spawnProjectile{
				entity:    entity,
				asset:     &asset,
				transform: transform,
				ammoId:    "",
			})
		}
	}
	return result
}

type SpawnNode struct {
	VariantID      string
	GatherableID   string
	LoreIDs        []string
	Encounter      string
	Name           string
	VitalsID       string
	NpcID          string
	CategoryID     string
	Level          int
	TerritoryLevel bool
	DamageTable    string
	ModelFile      string
	MtlFile        string
	AdbFile        string
	Position       nwt.AzVec3
	HouseType      string
	StationID      string
	StructureType  string
	Tags           []string
	Trace          []any
}

// Copies the node and patches zero values with data from given SliceData.
func (base SpawnNode) CopyAndInherit(parent *SliceData) SpawnNode {
	if parent == nil {
		return base
	}
	// child prefers own values over parent's
	if base.VariantID == "" {
		base.VariantID = parent.VariantID
	}
	if base.GatherableID == "" {
		base.GatherableID = parent.GatherableID
	}
	if base.LoreIDs == nil {
		base.LoreIDs = slices.Clone(parent.LoreIDs)
	}

	// values overridden by parent
	if parent.VitalsID != "" {
		base.VitalsID = parent.VitalsID
	}
	if parent.CategoryID != "" {
		base.CategoryID = parent.CategoryID
	}
	if parent.Level != 0 {
		base.Level = parent.Level
	}
	base.TerritoryLevel = parent.TerritoryLevel || base.TerritoryLevel
	if parent.DamageTable != "" {
		base.DamageTable = parent.DamageTable
	}
	if parent.ModelFile != "" {
		base.ModelFile = parent.ModelFile
	}
	if parent.MtlFile != "" {
		base.MtlFile = parent.MtlFile
	}
	if parent.AdbFile != "" {
		base.AdbFile = parent.AdbFile
	}
	if len(parent.Tags) != 0 {
		base.Tags = slices.Clone(parent.Tags)
	}
	return base
}

var EMPTY iter.Seq[SpawnNode] = func(yield func(SpawnNode) bool) {
	// noop
}

func (ctx *Scanner) ScanFileForSpawners(file nwfs.File, stack []string) iter.Seq[SpawnNode] {
	if file == nil {
		return EMPTY
	}
	if slices.Contains(stack, file.Path()) {
		return EMPTY
	}
	return ctx.scanFileForSpawnersUntracked(file, stack)
}

func (ctx *Scanner) ScanAssetForSpawners(asset nwt.AzAsset, stack []string) iter.Seq[SpawnNode] {
	file, err := ctx.LookupFileByAsset(asset)
	if err != nil {
		slog.Debug("asset not resolved", "asset", asset, "err", err)
		return EMPTY
	}
	if file == nil {
		return EMPTY
	}
	if slices.Contains(stack, file.Path()) {
		slog.Debug("bail out of circular scan", "stack", stack, "file", file.Path())
		return EMPTY
	}

	switch path.Ext(file.Path()) {
	case ".slice":
		file, ok := ctx.Archive.Lookup(utils.ReplaceExt(file.Path(), ".dynamicslice"))
		if !ok {
			slog.Debug(".slice not resolved", "file", file.Path())
			return EMPTY
		}
		return ctx.ScanFileForSpawners(file, stack)
	case ".dynamicslice":
		return ctx.scanFileForSpawnersUntracked(file, stack)
	case ".aliasasset":
		alias, err := ctx.LoadAliasAsset(file)
		if err != nil {
			slog.Error(".aliasasset not loaded", "error", err)
			return EMPTY
		}
		if alias == nil {
			slog.Warn(".aliasasset not loaded", "file", file.Path())
			return EMPTY
		}
		return func(yield func(SpawnNode) bool) {
			for _, tag := range alias.Tags.Element {
				for _, slice := range tag.Slices.Element {
					for item := range ctx.ScanAssetForSpawners(slice.Slice, stack) {
						if !yield(item) {
							return
						}
					}
				}
			}
		}
	}
	return EMPTY
}

func (ctx *Scanner) scanFileForSpawnersUntracked(sliceFile nwfs.File, stack []string) iter.Seq[SpawnNode] {
	return func(yield func(SpawnNode) bool) {
		if sliceFile == nil {
			return
		}
		stack = slices.Clone(stack)
		stack = append(stack, sliceFile.Path())
		comp, err := ctx.LoadSliceComponent(sliceFile)
		if err != nil {
			slog.Error("slice not loaded", "error", err, "file", sliceFile.Path())
			return
		}
		if comp == nil {
			return
		}
		encounterType := FindEncounterType(comp)
		data := ctx.ScanSliceComponentForData(comp, sliceFile.Path())
		unconsumed := slices.Clone(data)
		consume := func(entity *nwt.AZ__Entity) *SliceData {
			index := slices.IndexFunc(unconsumed, func(it SliceData) bool {
				return it.Entity == entity
			})
			if index >= 0 {
				unconsumed = append(unconsumed[:index], unconsumed[index+1:]...)
			}

			index = slices.IndexFunc(data, func(it SliceData) bool {
				return it.Entity.Id.Id == entity.Id.Id
			})
			if index >= 0 {
				return &data[index]
			}
			return nil
		}

		// #region FTUE Island Spawner
		for _, spawner := range ctx.ScanSliceComponentForFtueIslandSpawner(comp, sliceFile) {
			result := SpawnNode{
				Encounter: encounterType,
				Name:      string(spawner.entity.Name),
				VitalsID:  "Player",
				Position:  spawner.transform.Translation(),
				Trace:     []any{sliceFile.Path()},
			}.CopyAndInherit(consume(spawner.entity))

			if !yield(result) {
				return
			}
		}
		// #endregion

		// #region Point Spawner
		for _, spawner := range ctx.ScanSliceComponentForPointSpawner(comp, sliceFile) {
			if spawner.transform == nil {
				slog.Debug("PointSpawner transform is nil", "file", sliceFile.Path())
				spawner.transform = crymath.IdentityTransform()
			}
			for item := range ctx.ScanAssetForSpawners(spawner.asset, stack) {
				if encounterType != "" {
					item.Encounter = encounterType
				}
				it := consume(spawner.entity)
				result := item.CopyAndInherit(it)
				result.Position = spawner.transform.TransformPoint(item.Position)
				result.Trace = append(result.Trace, fmt.Sprintf("PointSpawner in %s", sliceFile.Path()))
				if !yield(result) {
					return
				}
			}
		}
		// #endregion

		// #region Prefab Spawner
		for _, spawner := range ctx.ScanSliceComponentForPrefabSpawner(comp, sliceFile) {
			for item := range ctx.ScanAssetForSpawners(spawner.asset, stack) {
				if encounterType != "" {
					item.Encounter = encounterType
				}
				if spawner.variantId != "" {
					item.VariantID = spawner.variantId
				}
				result := item.CopyAndInherit(consume(spawner.entity))
				result.Position = spawner.transform.TransformPoint(item.Position)
				result.Trace = append(result.Trace, fmt.Sprintf("PrefabSpawner in %s", sliceFile.Path()))
				if !yield(result) {
					return
				}
			}
		}
		// #endregion

		// #region Projectile Spawner
		for _, spawn := range ctx.ScanSliceComponentForProjectileSpawner(comp, sliceFile) {
			var list iter.Seq[SpawnNode] = nil
			if spawn.asset != nil {
				list = ctx.ScanAssetForSpawners(*spawn.asset, stack)
			} else if spawn.prefab != "" {
				file := ctx.ResolveDynamicSliceNameToFile(spawn.prefab)
				list = ctx.ScanFileForSpawners(file, stack)
			}
			if list == nil {
				continue
			}
			for item := range list {
				if encounterType != "" {
					item.Encounter = encounterType
				}
				result := item.CopyAndInherit(consume(spawn.entity))
				result.Position = spawn.transform.TransformPoint(item.Position)
				result.Trace = append(result.Trace, fmt.Sprintf("ProjectileSpawner in %s", sliceFile.Path()))
				if !yield(result) {
					return
				}
			}
		}
		// #endregion

		// #region Encounter Spawner
		for _, spawn := range ctx.ScanSliceComponentForEncounterSpawner(comp, sliceFile) {
			locations := spawn.locations
			if len(locations) == 0 {
				locations = append(locations, spawn.transform)
			}
			for item := range ctx.ScanAssetForSpawners(spawn.asset, stack) {
				if encounterType != "" {
					item.Encounter = encounterType
				}
				for _, location := range locations {
					result := item.CopyAndInherit(consume(spawn.entity))
					result.Position = location.TransformPoint(item.Position)
					result.Trace = append(result.Trace, fmt.Sprintf("EncounterSpawner in %s", sliceFile.Path()))
					if !yield(result) {
						return
					}
				}
			}
		}
		// #endregion

		// #region Area Spawner
		for _, spawn := range ctx.ScanSliceComponentForAreaSpawner(comp, sliceFile) {
			locations := spawn.locations
			if len(locations) == 0 {
				continue
			}
			for item := range ctx.ScanAssetForSpawners(spawn.asset, stack) {
				if encounterType != "" {
					item.Encounter = encounterType
				}
				for _, location := range locations {
					result := item.CopyAndInherit(consume(spawn.entity))
					result.Position = location.TransformPoint(item.Position)
					result.Trace = append(result.Trace, fmt.Sprintf("AreaSpawner in %s", sliceFile.Path()))
					if !yield(result) {
						return
					}
				}
			}
		}
		// #endregion

		identity := crymath.IdentityTransform()
		for _, item := range unconsumed {
			position := identity.Translation()
			if item.Transform != nil {
				position = item.Transform.Translation()
			}
			if item.HouseType != "" {
				res := SpawnNode{
					Name:      item.Name,
					HouseType: item.HouseType,
					Position:  identity.Translation(),
					Trace:     item.Trace,
				}
				if !yield(res) {
					return
				}
			}
			if item.VitalsID != "" {
				res := SpawnNode{
					Name:           item.Name,
					Encounter:      encounterType,
					VitalsID:       item.VitalsID,
					CategoryID:     item.CategoryID,
					Level:          item.Level,
					TerritoryLevel: item.TerritoryLevel,
					DamageTable:    item.DamageTable,
					ModelFile:      item.ModelFile,
					MtlFile:        item.MtlFile,
					AdbFile:        item.AdbFile,
					Tags:           item.Tags,
					Position:       identity.Translation(),
					Trace:          item.Trace,
				}
				if !yield(res) {
					return
				}
			}
			if item.GatherableID != "" || item.VariantID != "" {
				res := SpawnNode{
					Name:         item.Name,
					Encounter:    encounterType,
					GatherableID: item.GatherableID,
					VariantID:    item.VariantID,
					Position:     identity.Translation(),
					Trace:        item.Trace,
				}
				if !yield(res) {
					return
				}
			}
			if len(item.LoreIDs) > 0 {
				res := SpawnNode{
					Name:      item.Name,
					Encounter: encounterType,
					LoreIDs:   item.LoreIDs,
					Position:  identity.Translation(),
					Trace:     item.Trace,
				}
				if !yield(res) {
					return
				}
			}
			if item.NpcID != "" {
				res := SpawnNode{
					Name:      item.Name,
					Encounter: encounterType,
					NpcID:     item.NpcID,
					Position:  position,
					Trace:     item.Trace,
				}
				if !yield(res) {
					return
				}
			}
			if item.StationID != "" {
				res := SpawnNode{
					Name:      item.Name,
					StationID: item.StationID,
					Position:  position,
					Trace:     item.Trace,
				}
				if !yield(res) {
					return
				}
			}
			if item.StructureType != "" {
				res := SpawnNode{
					Name:          item.Name,
					StructureType: item.StructureType,
					Position:      position,
					Trace:         item.Trace,
				}
				if !yield(res) {
					return
				}
			}
		}
	}
}
