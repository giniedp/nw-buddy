package pull

import (
	"bytes"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/game/scanner"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"strings"

	"github.com/dustin/go-humanize"
	"github.com/spf13/cobra"
)

var cmdPullSpawns = &cobra.Command{
	Use:   TASK_SLICES,
	Short: "Pulls spawn data from the game files",
	Long:  "",
	Run:   runPullSpawns,
}

func runPullSpawns(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullSlices()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullSpawns(ctx *PullContext, outDir string) {
	files, err := ctx.Archive.Glob(
		"**/region.distribution",                     // 91
		"**/coatlicue/**/regions/**/*.capitals.json", // 1362
		"**.dynamicslice",                            // 196350
		"!lyshineui/**",
	)

	if err != nil {
		slog.Error("glob failed", "err", err)
		return
	}

	scn, err := scanner.NewScanner(ctx.Assets)
	if err != nil {
		slog.Error("failed to create scanner", "err", err)
		return
	}

	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "Scan slices",
		Tasks:         files,
		ProducerCount: int(flgWorkerCount),
		Producer: func(file nwfs.File) (output string, err error) {
			scn.Scan(file)
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
	res := scn.Results()

	os.MkdirAll(outDir, 0755)
	gatherables, count := scanner.CollateGatherables(res.Gatherables)
	size := writeJson(gatherables, path.Join(outDir, "gatherables_metadata.json"))

	stats.Add("Gatherables", "rows", len(gatherables), "positions", count, "size", humanize.Bytes(size))

	zoneConfigs, count := scanner.CollateZoneConfigs(res.ZoneConfigs)
	size = writeJson(zoneConfigs, path.Join(outDir, "zone_configs_metadata.json"))
	stats.Add("ZoneConfigs", "rows", len(zoneConfigs), "positions", count, "size", humanize.Bytes(size))

	houses, count := scanner.CollateHouses(res.Houses)
	size = writeJson(houses, path.Join(outDir, "houses_metadata.json"))
	stats.Add("Houses", "rows", len(houses), "positions", count, "size", humanize.Bytes(size))

	loreEntries, count := scanner.CollateLoreNotes(res.Lorenotes)
	size = writeJson(loreEntries, path.Join(outDir, "lore_metadata.json"))
	stats.Add("LoreEntries", "rows", len(loreEntries), "positions", count, "size", humanize.Bytes(size))

	npcs, count := scanner.CollateNpcs(res.Npcs)
	size = writeJson(npcs, path.Join(outDir, "npcs_metadata.json"))
	stats.Add("Npcs", "rows", len(npcs), "positions", count, "size", humanize.Bytes(size))

	stations, count := scanner.CollateStations(res.Stations)
	size = writeJson(stations, path.Join(outDir, "stations_metadata.json"))
	stats.Add("Stations", "rows", len(stations), "positions", count, "size", humanize.Bytes(size))

	structures, count := scanner.CollateStructures(res.Structures)
	size = writeJson(structures, path.Join(outDir, "structures_metadata.json"))
	stats.Add("Structures", "rows", len(structures), "positions", count, "size", humanize.Bytes(size))

	territories, count := scanner.CollateTerritories(res.Territories)
	size = writeJson(territories, path.Join(outDir, "territories_metadata.json"))
	stats.Add("Territories", "rows", len(territories), "positions", count, "size", humanize.Bytes(size))

	encounter, count := scanner.CollateEncounter(res.Encounter)
	size = writeJson(encounter, path.Join(outDir, "encounter_metadata.json"))
	stats.Add("Encounter", "rows", len(encounter), "positions", count, "size", humanize.Bytes(size))

	variants, count := scanner.CollateVariants(res.Variants)
	size = writeJson(variants.Variants, path.Join(outDir, "variations_metadata.json"))
	stats.Add("Variants", "rows", len(variants.Variants), "positions", count, "size", humanize.Bytes(size))
	for i, chunk := range variants.Chunks {
		os.WriteFile(path.Join(outDir, fmt.Sprintf("variations_metadata.%d.chunk", i)), chunk, 0644)
		stats.Add("Variants", "chunk", i, "size", humanize.Bytes(uint64(len(chunk))))
	}

	baseLevels := getVitalLevels(ctx.tables)
	zoneLevels := getZoneLevelOverrides(ctx.tables)
	baseIds := getVitalBaseIds(ctx.tables)
	models, vitals, count := scanner.CollateVitals(res.Vitals, territories, zoneLevels, baseLevels, baseIds)

	size = writeJson(models, path.Join(outDir, "vitals_models_metadata.json"))
	stats.Add("VitalsModels", "rows", len(models), "size", humanize.Bytes(size))

	size = writeJsonLines(vitals, path.Join(outDir, "vitals_metadata.json"))
	stats.Add("Vitals", "rows", len(vitals), "positions", count, "size", humanize.Bytes(size))
	for _, file := range []string{"vitals_metadata1.json", "vitals_metadata2.json"} {
		os.Remove(path.Join(outDir, file))
	}
}

// writeJsonLines writes an array with a row per line
func writeJsonLines[T any](rows []T, path string) uint64 {
	buf := bytes.NewBufferString("[")
	for i, row := range rows {
		data, err := json.MarshalJSON(row)
		if err != nil {
			slog.Error("failed to marshal json", "err", err)
			return 0
		}
		if i > 0 {
			buf.WriteString(",")
		}
		buf.WriteString("\n")
		buf.Write(data)
	}
	buf.WriteString("\n]\n")
	if err := os.WriteFile(path, buf.Bytes(), 0644); err != nil {
		slog.Error("failed to write json", "err", err)
		return 0
	}
	return uint64(buf.Len())
}

func writeJson(value any, path string) uint64 {
	bytes, err := json.MarshalJSON(value, "", "\t")
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

// getVitalBaseIds returns the BaseVitalsId of the level variants (lower case)
func getVitalBaseIds(tables []*datasheet.Document) map[string]string {
	result := make(map[string]string)
	for _, table := range tables {
		if table.Schema != "VitalsLevelVariantData" {
			continue
		}
		for _, row := range table.RowsAsJSON() {
			id := strings.ToLower(row.GetString("VitalsID"))
			base := strings.ToLower(row.GetString("BaseVitalsId"))
			if id != "" && base != "" {
				result[id] = base
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
