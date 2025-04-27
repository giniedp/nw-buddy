package models

import (
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var flgMaterial string
var cmdCollectFiles = &cobra.Command{
	Use:   "files",
	Short: "converts a specific file with an optional material override",
	Long:  "",
	Run:   runCollectFiles,
}

func init() {
	cmdCollectFiles.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectFiles.Flags().StringVar(&flgMaterial, "material", "", "The material override")
}

func runCollectFiles(ccmd *cobra.Command, args []string) {
	if len(args) == 0 {
		panic("no files provided")
	}
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectFiles(args, flgMaterial)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectFiles(patterns []string, mtl string) {
	for i := range patterns {
		patterns[i] = strings.ToLower(patterns[i])
	}

	files, err := c.Archive.Glob(patterns...)
	if err != nil {
		slog.Error("failed to glob files", "err", err)
		return
	}
	if len(files) == 0 {
		slog.Warn("no files found")
		return
	}

	for _, file := range files {
		model := file.Path()
		material := mtl
		targetFile := c.outputPath(model)
		if !c.shouldProcess(targetFile) {
			continue
		}

		switch path.Ext(model) {
		case ".cdf":
			cdf, err := c.LoadCdf(model)
			if err != nil {
				slog.Warn("failed to resolve cdf asset", "file", model, "err", err)
				continue
			}
			c.CollectCdf(cdf, material, targetFile)
		case ".cgf", ".skin":
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
		default:
			slog.Warn("unsupported file type", "file", model)
			continue
		}
	}

}
