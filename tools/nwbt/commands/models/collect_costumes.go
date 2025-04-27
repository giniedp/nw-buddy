package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"

	"github.com/spf13/cobra"
)

var cmdCollectCostumes = &cobra.Command{
	Use:   "costumes",
	Short: "scans datasheets for CostumeChangeData and collects cdf models",
	Long:  "",
	Run:   runCollectCostumes,
}

func init() {
	cmdCollectCostumes.Flags().StringVar(&flgIds, "ids", "", "comma separated list of ids to process")
}

func runCollectCostumes(ccmd *cobra.Command, args []string) {
	ids := getCommaSeparatedList(flgIds)
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectCostumes(ids...)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectCostumes(ids ...string) {
	for table := range c.EachDatasheet() {
		if table.Schema != "CostumeChangeData" {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("CostumeChangeId")
			bar.Add(1)
			bar.Detail(id)

			if !matchFilter(ids, id) {
				continue
			}
			file := c.outputPath(path.Join("costumechanges", id))
			if !c.shouldProcess(file) {
				continue
			}

			model := row.GetString("CostumeChangeMesh")
			if path.Ext(model) != ".cdf" {
				continue
			}
			cdf, err := c.LoadCdf(model)
			if err != nil {
				continue
			}
			group := importer.AssetGroup{}
			for _, mesh := range cdf.SkinAndClothAttachments() {
				model, mtl := c.ResolveCgfAndMtl(mesh.Binding, mesh.Material)
				if model != "" {
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: mtl,
					})
				}
			}
			if len(group.Meshes) > 0 {
				group.TargetFile = file
				c.models.Store(group.TargetFile, group)
			}
		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}
