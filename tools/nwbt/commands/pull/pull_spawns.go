package pull

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/commands/pull/scan"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"strings"

	"github.com/dustin/go-humanize"
)

func pullSpawns(tables []*datasheet.Document, fs nwfs.Archive, outDir string) {
	files, err := fs.Glob(
		"**/region.distribution",                     // 91
		"**/coatlicue/**/regions/**/*.capitals.json", // 1362
		"**.dynamicslice",                            // 196350
		"!lyshineui/**",
	)

	if err != nil {
		slog.Error("glob failed", "err", err)
		return
	}

	scanner, err := scan.NewScanner(fs)
	if err != nil {
		slog.Error("failed to create scanner", "err", err)
		return
	}

	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "Scan slices",
		Tasks:         files,
		ProducerCount: int(flgWorkerCount),
		Producer: func(file nwfs.File) (output string, err error) {
			scanner.Scan(file)
			output = file.Path()
			return
		},
		ConsumerCount: int(flgWorkerCount),
		Consumer: func(value string, e error) (msg string, err error) {
			msg = value
			err = e
			return
		},
	})
	res := scanner.Results()

	os.MkdirAll(outDir, 0755)
	gatherables, count := scan.CollateGatherables(res.Gatherables)
	size := writeJson(gatherables, path.Join(outDir, "gatherables_metadata.json"))

	stats.Add("Gatherables", "rows", len(gatherables), "positions", count, "size", humanize.Bytes(size))

	houses, count := scan.CollateHouses(res.Houses)
	size = writeJson(houses, path.Join(outDir, "houses_metadata.json"))
	stats.Add("Houses", "rows", len(houses), "positions", count, "size", humanize.Bytes(size))

	loreEntries, count := scan.CollateLoreNotes(res.Lorenotes)
	size = writeJson(loreEntries, path.Join(outDir, "lore_metadata.json"))
	stats.Add("LoreEntries", "rows", len(loreEntries), "positions", count, "size", humanize.Bytes(size))

	npcs, count := scan.CollateNpcs(res.Npcs)
	size = writeJson(npcs, path.Join(outDir, "npcs_metadata.json"))
	stats.Add("Npcs", "rows", len(npcs), "positions", count, "size", humanize.Bytes(size))

	stations, count := scan.CollateStations(res.Stations)
	size = writeJson(stations, path.Join(outDir, "stations_metadata.json"))
	stats.Add("Stations", "rows", len(stations), "positions", count, "size", humanize.Bytes(size))

	structures, count := scan.CollateStructures(res.Structures)
	size = writeJson(structures, path.Join(outDir, "structures_metadata.json"))
	stats.Add("Structures", "rows", len(structures), "positions", count, "size", humanize.Bytes(size))

	territories, count := scan.CollateTerritories(res.Territories)
	size = writeJson(territories, path.Join(outDir, "territories_metadata.json"))
	stats.Add("Territories", "rows", len(territories), "positions", count, "size", humanize.Bytes(size))

	variants, count := scan.CollateVariants(res.Variants)
	size = writeJson(variants.Variants, path.Join(outDir, "variations_metadata.json"))
	stats.Add("Variants", "rows", len(variants.Variants), "positions", count, "size", humanize.Bytes(size))
	for i, chunk := range variants.Chunks {
		os.WriteFile(path.Join(outDir, fmt.Sprintf("variations_metadata.%d.chunk", i)), chunk, 0644)
		stats.Add("Variants", "chunk", i, "size", humanize.Bytes(uint64(len(chunk))))
	}

	baseLevels := getVitalLevels(tables)
	zoneLevels := getZoneLevelOverrides(tables)
	models, vitals, count := scan.CollateVitals(res.Vitals, territories, zoneLevels, baseLevels)

	size = writeJson(models, path.Join(outDir, "vitals_models_metadata.json"))
	stats.Add("VitalsModels", "rows", len(models), "size", humanize.Bytes(size))

	stats.Add("Vitals", "rows", len(vitals), "positions", count)
	split := len(vitals) / 2

	vitals1 := vitals[:split]
	vitals2 := vitals[split:]
	size = writeJson(vitals1, path.Join(outDir, "vitals_metadata1.json"))
	stats.Add("Vitals", "split", 1, "rows", len(vitals1), "size", humanize.Bytes(size))
	size = writeJson(vitals2, path.Join(outDir, "vitals_metadata2.json"))
	stats.Add("Vitals", "split", 2, "rows", len(vitals2), "size", humanize.Bytes(size))

}

func writeJson(value any, path string) uint64 {
	bytes, err := utils.MarshalJSON(value, "", "\t")
	if err != nil {
		slog.Error("failed to marshal json", "err", err)
		return 0
	}
	err = os.WriteFile(path, bytes, 0644)
	if err != nil {
		slog.Error("failed to write json", "err", err)
		return 0
	}
	return uint64(len(bytes))
}

func getVitalLevels(tables []*datasheet.Document) map[string]float32 {
	result := make(map[string]float32)
	for _, table := range tables {
		if table.Schema != "VitalsLevelVariantData" {
			continue
		}
		for index := range table.Rows {
			id, err := table.GetValue(index, "VitalsID")
			if err != nil {
				slog.Error("failed to get VitalsID", "err", err)
				continue
			}

			lvl, err := table.GetValue(index, "Level")
			if err != nil {
				slog.Error("failed to get Level", "err", err)
				continue
			}
			if l, ok := lvl.(float32); ok && l > 0 {
				key := strings.ToLower(fmt.Sprintf("%v", id))
				result[key] = l
			}
		}
	}
	return result
}

func getZoneLevelOverrides(tables []*datasheet.Document) map[string]float32 {
	result := make(map[string]float32)
	for _, table := range tables {
		if table.Schema != "TerritoryDefinition" {
			continue
		}
		for i, _ := range table.Rows {
			id, err := table.GetValue(i, "TerritoryID")
			if err != nil {
				slog.Error("failed to get TerritoryID", "err", err)
				continue
			}
			lvl, err := table.GetValue(i, "AIVariantLevelOverride")
			if err != nil {
				// not all territories have an AIVariantLevelOverride
				continue
			}
			if l, ok := lvl.(float32); ok && l > 0 {
				result[fmt.Sprintf("%02v", id)] = l
			}
		}
	}
	return result
}
