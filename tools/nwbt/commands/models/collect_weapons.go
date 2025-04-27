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

var cmdCollectWeapons = &cobra.Command{
	Use:   "weapons",
	Short: "scans datasheets for WeaponItemDefinitions and collects weapon models",
	Long:  "",
	Run:   runCollectWeapons,
}

func init() {
	cmdCollectWeapons.Flags().AddFlagSet(Cmd.Flags())
}

func runCollectWeapons(ccmd *cobra.Command, args []string) {
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectWeapons()
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectWeapons() {
	for table := range c.EachDatasheet() {
		if table.Schema != "WeaponItemDefinitions" {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("WeaponID")
			bar.Add(1)
			bar.Detail(id)

			file := c.outputPath(path.Join("weapons", fmt.Sprintf("%s-%s", id, "SkinOverride1")))
			if c.shouldProcess(file) {
				model := row.GetString("SkinOverride1")
				material := row.GetString("MaterialOverride1")
				model, material = c.ResolveCgfAndMtl(model, material)
				if model != "" {
					group := importer.AssetGroup{}
					group.TargetFile = file
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
					c.models.Store(group.TargetFile, group)
				}
			}

			file = c.outputPath(path.Join("weapons", fmt.Sprintf("%s-%s", id, "SkinOverride2")))
			if c.shouldProcess(file) {
				model := row.GetString("SkinOverride2")
				material := row.GetString("MaterialOverride2")
				model, material = c.ResolveCgfAndMtl(model, material)
				if model != "" {
					group := importer.AssetGroup{}
					group.TargetFile = file
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
					c.models.Store(group.TargetFile, group)
				}
			}
		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}
