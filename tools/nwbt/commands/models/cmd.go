package models

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgRegex bool
var flgOutput string
var flgTmpDir string
var flgCacheDir string
var Cmd = &cobra.Command{
	Use:           "models",
	Short:         "converts modelts to gltf format",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().BoolVarP(&flgRegex, "reg", "e", false, "whether argument is a regular expression")
	Cmd.Flags().StringVarP(&flgTmpDir, "temp", "t", env.TempDir(), "temp directory")
	Cmd.Flags().StringVarP(&flgCacheDir, "cache", "c", path.Join(env.TempDir(), "cache"), "image cache directory")
	Cmd.Flags().StringVarP(&flgOutput, "output", "o", path.Join(env.TempDir(), "models"), "output directory")
}

func run(ccmd *cobra.Command, args []string) {

	slog.SetDefault(logging.DefaultFileHandler())

	collector := utils.Must(initCollector())
	// collector.CollectWeapons()
	// collector.CollectAppearancesWeapons()
	// collector.CollectApperancesArmor()
	// collector.CollectMounts()
	collector.CollectCostumes()
	convertCollection(collector, flgOutput)
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func initCollector() (*Collector, error) {
	archive := utils.Must(nwfs.NewPakFS(flgGameDir))

	bar := progress.Bar(0, "Loading catalog")
	defer bar.Close()
	catalogFile, _ := archive.Lookup(catalog.CATALOG_PATH)
	catalogDoc, err := catalog.Load(catalogFile)
	if err != nil {
		return nil, err
	}
	bar.Close()

	tableFiles, err := archive.Glob("**/*.datasheet")
	if err != nil {
		return nil, err
	}

	tables := make([]datasheet.Document, len(tableFiles))
	bar = progress.Bar(len(tableFiles), "Loading datasheets")
	for i, file := range tableFiles {
		bar.Add(1)
		bar.Detail(file.Path())
		tables[i], err = datasheet.Load(file)
		if err != nil {
			return nil, err
		}
	}
	bar.Detail("")
	bar.Close()

	return NewCollector(archive, catalogDoc, tables), nil
}

func convertCollection(collector *Collector, outDir string) {
	progress.RunTasks(progress.TasksConfig[importer.AssetGroup, string]{
		Description:   "Converting models",
		Tasks:         collector.models.Values(),
		ProducerCount: 10,
		Producer: func(group importer.AssetGroup) (string, error) {
			converter := gltf.NewConverter()
			converter.ImageLoader = image.LoaderWithConverter{
				Archive:  collector.archive,
				Catalog:  collector.catalog,
				CacheDir: flgCacheDir,
				Converter: image.BasicConverter{
					Format:  ".png",
					TempDir: flgTmpDir,
					Silent:  true,
					MaxSize: 1024,
				},
			}
			for _, mesh := range group.Meshes {
				modelFile, ok := collector.archive.Lookup(mesh.ModelFile)
				if !ok {
					slog.Warn("Model file not found", "file", mesh.ModelFile)
					continue
				}
				model, err := cgf.Load(modelFile)
				if err != nil {
					slog.Warn("Model not loaded", "file", mesh.ModelFile, "err", err)
					continue
				}
				mtlFile, ok := collector.archive.Lookup(mesh.MtlFile)
				if !ok {
					slog.Warn("Material not found", "file", mesh.MtlFile)
					continue
				}
				material, err := mtl.Load(mtlFile)
				if err != nil {
					slog.Warn("Material not loaded", "file", mesh.MtlFile, "err", err)
					continue
				}
				materials := material.Collection()
				converter.ImportCgf(model, materials)
			}
			converter.ImportCgfMaterials()

			outFile := path.Join(outDir, group.TargetFile+".gltf")
			outDir := path.Dir(outFile)
			os.MkdirAll(outDir, os.ModePerm)

			if err := converter.Save(outFile); err != nil {
				slog.Warn("Model not saved", "file", outFile, "err", err)
			}
			return "", nil
		},
		ConsumerCount: 10,
	})

}
