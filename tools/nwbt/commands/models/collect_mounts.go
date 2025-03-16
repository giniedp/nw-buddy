package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectMounts = &cobra.Command{
	Use:   "mounts",
	Short: "converts mounts",
	Long:  "",
	Run:   runCollectMounts,
}

var mountAdbFiles = map[string]string{
	"Horse":      "animations/mannequin/adb/mounts/mount_horse_anims.adb",
	"Sabretooth": "animations/mannequin/adb/mounts/mount_cat_anims.adb",
	"DireWolf":   "animations/mannequin/adb/mounts/mount_wolf_anims.adb",
	"Bear":       "animations/mannequin/adb/mounts/mount_bear_anims.adb",
}

func init() {
	cmdCollectMounts.Flags().AddFlagSet(Cmd.Flags())
}

func runCollectMounts(ccmd *cobra.Command, args []string) {
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectMounts()
	c.Convert(flgOutDir)
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectMounts() {
	for table := range c.EachDatasheet() {
		if table.Schema != "MountData" {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("MountId")
			bar.Add(1)
			bar.Detail(id)

			model := row.GetString("Mesh")
			mountType := row.GetString("MountType")
			material := row.GetString("Material")
			file := strings.ToLower(path.Join("mounts", id))
			adbFile := mountAdbFiles[mountType]

			if path.Ext(model) != ".cdf" {
				continue
			}
			cdf, err := c.ResolveCdfAsset(model)
			if err != nil {
				continue
			}

			group := importer.AssetGroup{}
			group.TargetFile = file
			group.Animations = c.getAnimations(cdf, adbFile)
			for _, mesh := range cdf.SkinsOrCloth() {
				model, mtl := c.ResolveModelMaterialPair(mesh.Binding, mesh.Material, material)
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

func (c *Collector) getAnimations(cdf *cdf.Document, adbFile string) []importer.Animation {
	if adbFile == "" {
		return nil
	}
	adb, err := c.LoadAdbDocument(adbFile)
	if err != nil {
		slog.Warn("ADB not loaded", "file", adbFile, "err", err)
		return nil
	}
	anims, err := cdf.LoadAnimationFiles(c.Archive)
	if err != nil {
		slog.Warn("Animations not loaded", "err", err)
		return nil
	}
	return adb.SelectModelAnimations(anims)
}
