package models

import (
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"

	"github.com/spf13/cobra"
)

var flgGameDir string

// var flgRegex bool
var flgOutput string
var flgTmpDir string
var flgCacheDir string
var flgTexSize uint
var flgBinary bool
var flgLevel string
var flgRegion string
var flgName string

var Cmd = &cobra.Command{
	Use:           "models",
	Short:         "converts modelts to gltf format",
	Long:          ``,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flgTmpDir, "temp", "t", env.TempDir(), "temp directory")
	Cmd.Flags().StringVarP(&flgCacheDir, "cache", "c", path.Join(env.TempDir(), "cache"), "image cache directory")
	Cmd.Flags().StringVarP(&flgOutput, "output", "o", path.Join(env.TempDir(), "models"), "output directory")
	Cmd.Flags().BoolVar(&flgBinary, "binary", false, "whether to output binary glb instead of gltf")
	Cmd.Flags().UintVar(&flgTexSize, "tex-size", 0, "Maximum texture size")
	Cmd.AddCommand(
		cmdCollectArmor,
		cmdCollectCapitals,
		cmdCollectCostumes,
		cmdCollectMounts,
		cmdCollectWeapons,
		cmdCollectImpostors,
	)
}

func initCollector() (*Collector, error) {
	assets, err := game.InitPackedAssets(flgGameDir)
	if err != nil {
		return nil, err
	}
	if err := assets.LoadDatasheets(); err != nil {
		return nil, err
	}
	return NewCollector(assets), nil
}

func (c *Collector) Convert(outDir string) {
	models := c.models.Values()
	if len(models) == 0 {
		return
	}
	progress.RunTasks(progress.TasksConfig[importer.AssetGroup, string]{
		Description:   "Converting models",
		Tasks:         models,
		ProducerCount: 10,
		Producer: func(group importer.AssetGroup) (string, error) {
			document := gltf.NewDocument()
			document.ImageLoader = image.LoaderWithConverter{
				Archive:  c.Archive,
				Catalog:  c.Catalog,
				CacheDir: flgCacheDir,
				Converter: image.BasicConverter{
					Format:  ".png",
					TempDir: flgTmpDir,
					Silent:  true,
					MaxSize: 1024,
				},
			}

			for _, mesh := range group.Meshes {
				document.ImportGeometry(mesh, c.LoadAsset)
			}
			document.ImportCgfMaterials()

			outFile := path.Join(outDir, group.TargetFile)
			outDir := path.Dir(outFile)
			os.MkdirAll(outDir, os.ModePerm)

			if flgBinary {
				outFile = outFile + ".glb"
			} else {
				outFile = outFile + ".gltf"
			}
			if err := document.Save(outFile); err != nil {
				slog.Warn("Model not saved", "file", outFile, "err", err)
			}
			return "", nil
		},
		ConsumerCount: 10,
	})

}

func (c *Collector) LoadAsset(mesh importer.GeometryAsset) (*cgf.File, []mtl.Material) {
	modelFile, ok := c.Archive.Lookup(mesh.GeometryFile)
	if !ok {
		slog.Warn("Model file not found", "file", mesh.GeometryFile)
		return nil, nil
	}
	model, err := cgf.Load(modelFile)
	if err != nil {
		slog.Warn("Model not loaded", "file", mesh.GeometryFile, "err", err)
		return nil, nil
	}
	mtlFile, ok := c.Archive.Lookup(mesh.MaterialFile)
	if !ok {
		slog.Warn("Material not found", "file", mesh.MaterialFile)
		return nil, nil
	}
	material, err := mtl.Load(mtlFile)
	if err != nil {
		slog.Warn("Material not loaded", "file", mesh.MaterialFile, "err", err)
		return nil, nil
	}
	materials := material.Collection()
	return model, materials
}
