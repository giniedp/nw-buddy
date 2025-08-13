package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"strings"

	"github.com/goreleaser/fileglob"
	"github.com/spf13/cobra"
)

type Flags struct {
	GameDir        string
	OutputDir      string
	TempDir        string
	CacheDir       string
	TextureSize    uint
	Binary         bool
	Embed          bool
	Webp           bool
	Ktx2           bool
	RelativeUri    bool
	WorkerCount    uint
	SkipExisting   bool
	Animations     bool
	CrcFile        string
	UuidFile       string
	Lights         bool
	LightIntensity float32
	IOR            float32
}

var flg Flags

var flgLevel string
var flgRegion string
var flgName string
var flgOutFile string
var flgIds string

var Cmd = &cobra.Command{
	Use:           "models",
	Short:         "converts game models to .gltf or .glb format",
	Long:          ``,
	SilenceErrors: false,
	Run:           run,
}

func init() {
	Cmd.Flags().StringVarP(&flg.GameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flg.TempDir, "temp", "t", env.TempDir(), "temp directory for image conversion")
	Cmd.Flags().StringVarP(&flg.CacheDir, "cache", "c", env.CacheDir(), "image cache directory")
	Cmd.Flags().StringVarP(&flg.OutputDir, "output", "o", env.ModelsDir(), "output directory")
	Cmd.Flags().BoolVar(&flg.Binary, "binary", false, "whether to output binary glb instead of gltf")

	Cmd.Flags().UintVar(&flg.TextureSize, "texture-size", 0, "Maximum texture size")

	Cmd.Flags().BoolVar(&flg.Webp, "webp", false, "Textures are converted to webp")
	Cmd.Flags().BoolVar(&flg.Ktx2, "ktx", false, "Textures are converted to ktx2")
	Cmd.MarkFlagsMutuallyExclusive("webp", "ktx")

	Cmd.Flags().Float32Var(&flg.IOR, "ior", 0.0, "Material IOR value. Use 1.5 when exporting for blender otherwise keep it at 0.0")
	Cmd.Flags().BoolVar(&flg.Lights, "lights", false, "Whether lights should be exported")
	Cmd.Flags().Float32Var(&flg.LightIntensity, "light-intensity", 500.0, "Light intensity scale")
	Cmd.Flags().BoolVar(&flg.Animations, "animations", false, "Whether animations should be processed")
	Cmd.Flags().BoolVar(&flg.Embed, "embed", false, "Whether to embed textures in the gltf file")
	Cmd.Flags().BoolVar(&flg.RelativeUri, "relative", false, "When linking resources (embed is false), relative uris are written in the gltf file")
	Cmd.Flags().BoolVar(&flg.SkipExisting, "skip", false, "Whether to skip existing files")
	Cmd.Flags().UintVarP(&flg.WorkerCount, "workers", "w", uint(env.PreferredWorkerCount()), "number of workers to use for processing")

	Cmd.Flags().StringVar(&flg.CrcFile, "crc-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-crc.json"), "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flg.UuidFile, "uuid-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-types.json"), "file with uuid hashes. Only used for object-stream conversion")
	Cmd.AddCommand(
		cmdCollectAppearances,
		cmdCollectCapitals,
		cmdCollectCostumes,
		cmdCollectHousing,
		cmdCollectImpostors,
		cmdCollectMounts,
		cmdCollectVitals,
		cmdCollectWeapons,
		cmdCollectCharacter,
		cmdCollectNpcs,
		cmdCollectFiles,
		cmdEntities,
	)
}

func run(ccmd *cobra.Command, args []string) {
	vitalsFile := path.Join(env.PullDataDir(), "generated", "vitals_models_metadata.json")
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectAppearancesArmor()
	c.CollectAppearancesWeapons()
	c.CollectCostumes()
	c.CollectMounts()
	c.CollectHousing()
	c.CollectVitals(vitalsFile)
	c.CollectNpcs()
	c.CollectCharacter()
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func initCollector() (*Collector, error) {
	assets, err := game.InitPackedAssets(flg.GameDir)
	if err != nil {
		return nil, err
	}
	if err := assets.LoadDatasheets(); err != nil {
		return nil, err
	}
	return NewCollector(assets, flg), nil
}

func (c *Collector) Process() {
	c.ProcessAdbFiles()
	c.ProcessTimelines()
	c.ProcessModels()
	c.ProcessTextures()
}

func (c *Collector) ProcessModels() {
	assets := c.models.Values()
	if len(assets) == 0 {
		return
	}
	models := make([]importer.AssetGroup, 0)
	animations := make([]importer.AssetGroup, 0)
	for _, group := range assets {
		if len(group.Animations) > 0 && len(group.Meshes) == 0 {
			animations = append(animations, group)
		} else {
			models = append(models, group)
		}
	}
	if len(animations) > 0 {
		c.processAassets("Converting animations", animations)
	}
	if len(models) > 0 {
		c.processAassets("Converting models", models)
	}
}

func (c *Collector) processAassets(description string, models []importer.AssetGroup) {
	if len(models) == 0 {
		return
	}
	imageLoader := image.LoaderWithConverter{
		Archive: c.Archive,
		Catalog: c.Catalog,
		Cache:   image.NewCache(c.flags.CacheDir, ".png"),
		Converter: image.BasicConverter{
			Format:  ".png",
			TempDir: c.flags.TempDir,
			Silent:  true,
			MaxSize: c.flags.TextureSize,
		},
	}
	linker := gltf.NewResourceLinker(c.flags.OutputDir)
	linker.SetRelativeMode(c.flags.RelativeUri)
	if c.flags.Embed {
		linker = nil
	}
	progress.RunTasks(progress.TasksConfig[importer.AssetGroup, string]{
		Description:   description,
		Tasks:         models,
		ProducerCount: int(c.flags.WorkerCount),
		Producer: func(group importer.AssetGroup) (string, error) {
			document := gltf.NewDocument()
			document.Extras = group.Extra
			document.Asset.Generator = "New World Buddy Tools"
			document.ImageLoader = imageLoader
			document.ImageLinker = linker
			document.TargetFile = group.TargetFile
			if c.flags.SkipExisting && utils.FileExists(document.TargetFile) {
				return "", nil
			}

			for _, mesh := range group.Meshes {
				document.ImportGeometry(mesh, c.LoadAsset)
			}
			if len(group.Animations) > 0 {
				document.MergeSkins()
			}
			for _, anim := range group.Animations {
				document.ImportCgfAnimation(anim, c.LoadAnimation)
			}
			if flg.Lights && len(group.Lights) > 0 {
				document.ImportCgfLights(group.Lights, flg.LightIntensity)
			}

			document.ImportCgfMaterials(
				gltf.WithTextureBaking(true),
				gltf.WithCustomIOR(flg.IOR),
			)
			document.Clean()

			imageFormat := ""
			if c.flags.Webp {
				imageFormat = "webp"
			}
			if c.flags.Ktx2 {
				imageFormat = "ktx2"
			}

			if imageFormat != "" {
				for _, img := range document.Images {
					if img.BufferView != nil {
						// skip embedded images
					} else {
						img.MimeType = fmt.Sprintf("image/%s", imageFormat)
						img.URI = utils.ReplaceExt(img.URI, "."+imageFormat)
					}
				}
			}

			if err := document.Save(); err != nil {
				slog.Warn("Model not saved", "err", err)
			}
			return "", nil
		},
		ConsumerCount: int(c.flags.WorkerCount),
	})
}

func (c *Collector) ProcessAdbFiles() {
	files, _ := c.Archive.Glob("**.adb")
	bar := progress.Bar(len(files), "Copying adb files")
	for _, file := range files {
		bar.Add(1)
		data, _ := file.Read()
		outPath := path.Join(c.flags.OutputDir, file.Path())
		utils.WriteFile(outPath, data)
	}
	bar.Close()
}

func (c *Collector) ProcessTimelines() {
	files := c.timelines.Values()
	if len(files) == 0 {
		return
	}
	crcTable, err := rtti.LoadCrcTable(flg.CrcFile)
	if err != nil {
		slog.Warn("failed to load crc table", "file", flg.CrcFile, "err", err)
		return
	}
	uuidTable, err := rtti.LoadUuIdTable(flg.UuidFile)
	if err != nil {
		slog.Warn("failed to load uuid table", "file", flg.UuidFile, "err", err)
		return
	}

	bar := progress.Bar(len(files), "Copying timelines")
	for _, file := range files {
		bar.Add(1)
		object, err := azcs.Load(file)
		if err != nil {
			slog.Warn("failed to load timeline", "file", file.Path(), "err", err)
			continue
		}
		data, err := rtti.ObjectStreamToJSON(object, crcTable, uuidTable)
		if err != nil {
			slog.Warn("failed to convert timeline", "file", file.Path(), "err", err)
			continue
		}

		outPath := path.Join(c.flags.OutputDir, file.Path()+".json")
		utils.WriteFile(outPath, data)
	}
}

func (c *Collector) ProcessTextures() error {
	format := ".png"
	if c.flags.Webp {
		format = ".webp"
		if _, ok := utils.Cwebp.Check(); !ok {
			return fmt.Errorf("cwebp not available")
		}
	}
	if c.flags.Ktx2 {
		format = ".ktx2"
		if _, ok := utils.Ktx.Check(); !ok {
			return fmt.Errorf("toktx not available")
		}
	}
	if format == ".png" {
		return nil
	}

	pattern := path.Join(c.flags.OutputDir, "**.png")
	files, err := fileglob.Glob(pattern, fileglob.MaybeRootFS)
	if err != nil {
		return err
	}
	progress.RunTasks(progress.TasksConfig[string, string]{
		Description:   "Converting textures",
		Tasks:         files,
		ProducerCount: int(c.flags.WorkerCount),
		Producer: func(input string) (string, error) {
			switch format {
			case ".webp":
				output := utils.ReplaceExt(input, format)
				return input, utils.Cwebp.Run(input, "-o", output)
			case ".ktx2":
				output := utils.ReplaceExt(input, format)
				toktx := utils.Ktx
				args := []string{"create", "--threads", "1"}
				if strings.Contains(input, "_ddn.") || strings.Contains(input, "_ddna.") {
					args = append(args, toktx.PresetNormalMap()...)
				} else if strings.Contains(input, "_spec.") {
					args = append(args, toktx.PresetSpecularMap()...)
				} else if strings.Contains(input, "_mask.") {
					args = append(args, toktx.PresetMaskMap()...)
				} else {
					args = append(args, toktx.PresetDiffuseMap()...)
				}
				args = append(args, input, output)
				return input, toktx.Run(args...)
			}
			return input, nil
		},
		ConsumerCount: 1,
		Consumer: func(input string, e error) (string, error) {
			if e == nil {
				return input, os.Remove(input)
			}
			return input, e
		},
	})
	return nil
}
