package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectCostumes = &cobra.Command{
	Use:   "costumes",
	Short: "converts costumes",
	Long:  "",
	Run:   runCollectCostumes,
}

func runCollectCostumes(ccmd *cobra.Command, args []string) {

	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectCostumes()
	c.Convert(flgOutDir)
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectCostumes() {
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

			model := row.GetString("CostumeChangeMesh")
			file := strings.ToLower(path.Join("costumechanges", id))

			if path.Ext(model) != ".cdf" {
				continue
			}
			cdf, err := c.ResolveCdfAsset(model)
			if err != nil {
				continue
			}
			group := importer.AssetGroup{}
			group.TargetFile = file
			for _, mesh := range cdf.SkinsOrCloth() {
				model, mtl := c.ResolveModelMaterialPair(mesh.Binding, mesh.Material)
				if model != "" {
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: mtl,
					})
				}
			}
			if len(group.Meshes) > 0 {
				group.TargetFile = file
				c.models.Store(file, group)
			}
		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}
