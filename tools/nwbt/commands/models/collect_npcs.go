package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectNpcs = &cobra.Command{
	Use:   "npcs",
	Short: "converts npcs",
	Long:  "",
	Run:   runCollectNpcs,
}

func init() {
	cmdCollectNpcs.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectNpcs.Flags().StringVar(&flgIds, "ids", "", "comma separated list of ids to process")
}

func runCollectNpcs(ccmd *cobra.Command, args []string) {
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectNpcs(getCommaSeparatedList(flgIds)...)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectNpcs(ids ...string) {
	for table := range c.EachDatasheet() {
		if !strings.EqualFold(table.Schema, "VariationData") {
			continue
		}
		if !strings.EqualFold(table.Table, "Npc") {
			continue
		}

		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("NPCId")
			bar.Add(1)
			bar.Detail(id)
			if !matchFilter(ids, id) {
				continue
			}

			c.addTimelineFile(row.GetString("ByeTimeline"))
			c.addTimelineFile(row.GetString("GreetTimeline"))
			c.addTimelineFile(row.GetString("IdleTimeline"))
			c.addTimelineFile(row.GetString("InteractTimeline"))
			model := nwfs.NormalizePath(row.GetString("CharacterDefinition"))
			if model == "" {
				continue
			}
			targetFile := c.outputPath(model)
			if !c.shouldProcess(targetFile) {
				continue
			}
			if path.Ext(model) == ".cdf" {
				cdf, err := c.LoadCdf(model)
				if err != nil {
					slog.Warn("failed to resolve cdf asset", "file", model, "err", err)
					continue
				}
				c.CollectCdf(cdf, "", targetFile)
			} else {
				group := importer.AssetGroup{}
				if model, material := c.ResolveCgfAndMtl(model, ""); model != "" {
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
		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}

}
