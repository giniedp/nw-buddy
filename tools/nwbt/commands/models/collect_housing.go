package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game/slicemodel"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectHousing = &cobra.Command{
	Use:   "housing",
	Short: "Converts housing items",

	Run: runCollectHousing,
}

func init() {
	cmdCollectHousing.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectHousing.Flags().StringVar(&flgIds, "ids", "", "comma separated list of ids to process")
}

func runCollectHousing(ccmd *cobra.Command, args []string) {
	ids := getCommaSeparatedList(flgIds)
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectHousing(ids...)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectHousing(ids ...string) {
	for table := range c.EachDatasheet() {
		if !strings.HasPrefix(table.Table, "HouseItems") {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("HouseItemID")
			bar.Add(1)
			bar.Detail(id)

			if !matchFilter(ids, id) {
				continue
			}

			prefabPath := row.GetString("PrefabPath")
			if prefabPath == "" {
				continue
			}
			slicePath := nwfs.NormalizePath(path.Join("slices", prefabPath))
			file := c.outputPath(slicePath)
			if !c.shouldProcess(file) {
				continue
			}

			group := c.collectPrefabPath(slicePath + ".dynamicslice")
			if len(group.Geometries) > 0 {
				group.TargetFile = file
				c.models.Store(group.TargetFile, group)
			}
		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}

func (c *Collector) collectPrefabPath(sliceFile string) importer.AssetGroup {
	group := importer.AssetGroup{}
	file, ok := c.Archive.Lookup(sliceFile)
	if !ok {
		slog.Error("file not found", "slice", sliceFile)
		return group
	}

	slicemodel.Collect(c.Assets, file, slicemodel.Options{KeepSkin: true}, &group)
	return group
}
