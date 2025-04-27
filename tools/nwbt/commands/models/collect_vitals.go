package models

import (
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game/scanner"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"slices"

	"github.com/spf13/cobra"
)

var flgVitalsFile string
var cmdCollectVitals = &cobra.Command{
	Use:   "vitals",
	Short: "converts vitals",
	Long:  "",
	Run:   runCollectVitals,
}

func init() {
	cmdCollectVitals.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectVitals.Flags().StringVar(&flgIds, "ids", "", "comma separated list of ids to process")
	cmdCollectVitals.Flags().StringVar(&flgVitalsFile, "meta", path.Join(env.PullDataDir(), "generated", "vitals_models_metadata.json"), "The vitals models meta file to process")
}

func runCollectVitals(ccmd *cobra.Command, args []string) {
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectVitals(flgVitalsFile, getCommaSeparatedList(flgIds)...)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectVitals(indexFile string, ids ...string) {
	data, err := os.ReadFile(indexFile)
	if err != nil {
		slog.Error("failed to read vitals file", "err", err)
		return
	}
	list := make([]scanner.ScannedVitalModel, 0)
	err = json.UnmarshalJSON(data, &list)
	if err != nil {
		slog.Error("failed to unmarshal vitals file", "err", err)
		return
	}

	bar := progress.Bar(len(list), "Vitals")
	for _, entry := range list {
		bar.Add(1)
		bar.Detail(entry.Id)

		index := slices.IndexFunc(entry.VitalIds, func(id string) bool {
			return matchFilter(ids, id)
		})
		if index == -1 {
			continue
		}

		targetFile := c.outputPath(path.Join("vitals", entry.Id))
		if !c.shouldProcess(targetFile) {
			continue
		}

		model := entry.Cdf
		material := entry.Mtl

		if path.Ext(model) == ".cdf" {
			cdf, err := c.LoadCdf(model)
			if err != nil {
				slog.Warn("failed to resolve cdf asset", "file", model, "err", err)
				continue
			}
			c.CollectCdf(cdf, material, targetFile)
		} else {
			group := importer.AssetGroup{}
			if model, material = c.ResolveCgfAndMtl(model, material); model != "" {
				group.Meshes = append(group.Meshes, importer.GeometryAsset{
					GeometryFile: model,
					MaterialFile: material,
				})
			}
			if len(group.Meshes) > 0 {
				group.TargetFile = targetFile
				c.models.Store(group.TargetFile, group)
			}
		}

	}
	bar.Close()
}
