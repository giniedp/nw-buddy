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
			if item.Variant != nil {
				ctx.addSpawn(*item.Variant, mapId)
			}
			if item.Gatherable != nil {
				ctx.addSpawn(*item.Gatherable, mapId)
			}
		}
	case ".dynamicslice":
		if strings.HasPrefix(file.Path(), "slices/pois/zones") || strings.HasPrefix(file.Path(), "slices/pois/territories") {
			for item := range ctx.ScanTerritories(file) {
				ctx.addSpawn(item, mapId)
			}
			break
		}
		if strings.Contains(file.Path(), "slices/characters") || strings.Contains(file.Path(), "slices/dungeon") {
			for item := range ctx.ScanVitals(file) {
				item.Position = nwt.AzVec3{} // zero out the position
				ctx.addSpawn(item, mapId)
			}
			break
		}
	case ".json":
		if path.Ext(strings.TrimSuffix(file.Path(), ".json")) == ".capitals" {
			for item := range ctx.ScanCapitalFile(file) {
				ctx.addSpawn(item, mapId)
			}
		} else {
			slog.Debug("skipping json file", "path", file.Path())
		}
	}

}

func (ctx *Scanner) addSpawn(spawn any, mapId string) {
	ctx.mu.Lock()
	defer ctx.mu.Unlock()

	switch v := spawn.(type) {
	case GatherableEntry:
		v.MapID = mapId
		ctx.results.Gatherables = append(ctx.results.Gatherables, v)
	case VariantEntry:
		v.MapID = mapId
		ctx.results.Variants = append(ctx.results.Variants, v)
	case TerritoryEntry:
		ctx.results.Territories = append(ctx.results.Territories, v)
	case VitalsEntry:
		v.MapID = mapId
		ctx.results.Vitals = append(ctx.results.Vitals, v)
	case SpawnNode:
		if v.GatherableID != "" {
			ctx.results.Gatherables = append(ctx.results.Gatherables, GatherableEntry{
				MapID:        mapId,
				GatherableID: v.GatherableID,
				Encounter:    v.Encounter,
				Position:     v.Position,
				Trace:        v.Trace,
			})
		}
		if v.VariantID != "" {
			ctx.results.Variants = append(ctx.results.Variants, VariantEntry{
				MapID:     mapId,
				Encounter: v.Encounter,
				VariantID: v.VariantID,
				Position:  v.Position,
				Trace:     v.Trace,
			})
		}
		if v.VitalsID != "" {
			ctx.results.Vitals = append(ctx.results.Vitals, VitalsEntry{
				Encounter:    v.Encounter,
				MapID:        mapId,
				VitalsID:     v.VitalsID,
				CategoryID:   v.CategoryID,
				GatherableID: v.GatherableID,
				NpcID:        v.NpcID,
				Level:        v.Level,
				DamageTable:  v.DamageTable,
				ModelFile:    v.ModelFile,
				AdbFile:      v.AdbFile,
				MtlFile:      v.MtlFile,
				UseZoneLevel: v.TerritoryLevel,
				Position:     v.Position,
				Trace:        v.Trace,
				Tags:         v.Tags,
			})
		}
		if v.NpcID != "" {
			ctx.results.Npcs = append(ctx.results.Npcs, NpcEntry{
				MapID:    mapId,
				NpcID:    v.NpcID,
				Position: v.Position,
				Trace:    v.Trace,
			})
		}
		if len(v.LoreIDs) > 0 {
			for _, loreId := range v.LoreIDs {
				ctx.results.Lorenotes = append(ctx.results.Lorenotes, LorenoteEntry{
					MapID:    mapId,
					LoreID:   loreId,
					Position: v.Position,
					Trace:    v.Trace,
				})
			}
		}
		if v.HouseType != "" {
			ctx.results.Houses = append(ctx.results.Houses, HouseEntry{
				MapID:    mapId,
				HouseID:  v.HouseType,
				Position: v.Position,
				Trace:    v.Trace,
			})
		}
		if v.StructureType != "" {
			ctx.results.Structures = append(ctx.results.Structures, StructureEntry{
				MapID:    mapId,
				TypeID:   v.StructureType,
				Position: v.Position,
				Name:     v.Name,
				Trace:    v.Trace,
			})
		}
		if v.StationID != "" {
			ctx.results.Stations = append(ctx.results.Stations, StationEntry{
				MapID:     mapId,
				StationID: v.StationID,
				Position:  v.Position,
				Name:      v.Name,
				Trace:     v.Trace,
			})
		}
	default:
		slog.Warn("unknown spawn", "value", v)
	}
}
