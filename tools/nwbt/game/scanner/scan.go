package scanner

import (
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"path"
	"strings"
)

func (ctx *Scanner) Scan(file nwfs.File) {
	mapId := game.ParseMapIdFromPath(file.Path())

	switch path.Ext(file.Path()) {
	case ".distribution":
		for item := range ctx.ScanDistributionFile(file) {
			ctx.addSpawn(item, mapId, "")
		}
	case ".dynamicslice":
		if strings.HasPrefix(file.Path(), "slices/pois/zones") || strings.HasPrefix(file.Path(), "slices/pois/territories") {
			for item := range ctx.ScanTerritories(file) {
				ctx.addSpawn(&item, mapId, "")
			}
			break
		}
		if strings.Contains(file.Path(), "slices/characters") || strings.Contains(file.Path(), "slices/dungeon") {
			for item := range ctx.ScanVitals(file) {
				item.Position = nwt.AzVec3{} // zero out the position
				ctx.addSpawn(&item, mapId, "")
			}
			break
		}
		if tile := game.ParseCatacombTileFromPath(file.Path()); tile != nil {
			count := 0
			for entry := range ctx.ScanSlice(file) {
				count += 1
				entry.Move(nwt.AzFloat32(tile.OffsetX), nwt.AzFloat32(tile.OffsetY))
				ctx.addSpawn(entry, "nw_catacomb_00", tile.BaseName)
			}
			slog.Debug("catacomb file", "tile", tile.BaseName, "count", count)
			break
		}
		if strings.HasPrefix(file.Path(), "slices/") {
			ctx.scanVitalTemplates(file)
		}
	case ".json":
		if path.Ext(strings.TrimSuffix(file.Path(), ".json")) == ".capitals" {
			for item := range ctx.ScanCapitalFile(file) {
				ctx.addSpawn(item, mapId, "")
			}
		} else {
			slog.Debug("skipping json file", "path", file.Path())
		}
	}
}

// scanVitalTemplates adds the vitals a slice spawns with their models, each model once and without position
func (ctx *Scanner) scanVitalTemplates(file nwfs.File) {
	type key struct {
		vital string
		model string
	}
	seen := make(map[key]bool)
	for item := range ctx.ScanVitals(file) {
		if item.Model == nil {
			continue
		}
		it := key{strings.ToLower(item.VitalsID), item.Model.Id}
		if seen[it] {
			continue
		}
		seen[it] = true
		item.Position = nwt.AzVec3{}
		item.Template = true
		ctx.addSpawn(&item, "", "")
	}
}

func (ctx *Scanner) addSpawn(spawn Spawn, mapId string, catacombTile string) {
	ctx.mu.Lock()
	defer ctx.mu.Unlock()

	switch v := spawn.(type) {
	case *GatherableEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Gatherables = append(ctx.results.Gatherables, *v)
	case *VariantEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Variants = append(ctx.results.Variants, *v)
	case *TerritoryEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Territories = append(ctx.results.Territories, *v)
	case *EncounterEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Encounter = append(ctx.results.Encounter, *v)
	case *VitalsEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Vitals = append(ctx.results.Vitals, *v)
	case *NpcEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Npcs = append(ctx.results.Npcs, *v)
	case *LorenoteEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Lorenotes = append(ctx.results.Lorenotes, *v)
	case *HouseEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Houses = append(ctx.results.Houses, *v)
	case *StructureEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Structures = append(ctx.results.Structures, *v)
	case *StationEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.Stations = append(ctx.results.Stations, *v)
	case *ZoneConfigEntry:
		v.MapID = mapId
		v.TileID = catacombTile
		ctx.results.ZoneConfigs = append(ctx.results.ZoneConfigs, *v)

	default:
		slog.Warn("unknown spawn", "value", v)
	}
}
