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
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/progress"
	"os"
	"os/exec"
	"path"
	"path/filepath"

	"github.com/spf13/cobra"
	"golang.org/x/sync/singleflight"
)

type Flags struct {
	GameDir        string
	OutputDir      string
	CacheDir       string
	TextureSize    uint
	Simplify       bool
	Optimize       bool
	Binary         bool
	Embed          bool
	Webp           bool
	Ktx2           bool
	Dds            bool
	RelativeUri    bool
	WorkerCount    uint
	SkipExisting   bool
	Animations     bool
	CrcFile        string
	UuidFile       string
	Lights         bool
	LightIntensity float32
	IOR            float32 // specular workflow ior: 0 = F0 is the specular color, > 1 = scaled specular color (Blender)
	EmissiveRef    float32
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
	Cmd.Flags().StringVarP(&flg.CacheDir, "cache", "c", env.CacheDir(), "image cache directory")
	Cmd.Flags().StringVarP(&flg.OutputDir, "output", "o", env.ModelsDir(), "output directory")
	Cmd.Flags().BoolVar(&flg.Binary, "binary", false, "whether to output binary glb instead of gltf")
	Cmd.Flags().BoolVar(&flg.Simplify, "simplify", false, "whether minimal geometry and material footprint should be used. Uses only diffuse texture and skips tangents")
	Cmd.Flags().BoolVar(&flg.Optimize, "optimize", false, "runs gltf-transform optimize for each model")

	Cmd.Flags().UintVar(&flg.TextureSize, "texture-size", 0, "Maximum texture size")

	Cmd.Flags().BoolVar(&flg.Webp, "webp", false, "Textures are converted to webp")
	Cmd.Flags().BoolVar(&flg.Ktx2, "ktx", false, "Textures are converted to ktx2")
	Cmd.Flags().BoolVar(&flg.Dds, "dds", false, "Textures are the original DDS (BC5_SNORM normal maps as RGBA8 with z), for Blender")
	Cmd.MarkFlagsMutuallyExclusive("webp", "ktx", "dds")

	Cmd.Flags().Float32Var(&flg.IOR, "ior", 0.0, "specular workflow ior: 0 makes F0 the specular color (glTF spec), > 1 (e.g. 1.5) scales the specular color to the same F0, for Blender")
	Cmd.Flags().Float32Var(&flg.EmissiveRef, "emissive-ref", gltf.DefaultEmissiveRef, "luminance in cd/m² that maps to emissive 1.0, lower is brighter (night ≈ 154)")
	Cmd.Flags().BoolVar(&flg.Lights, "lights", false, "Whether lights should be exported")
	Cmd.Flags().Float32Var(&flg.LightIntensity, "light-intensity", 500.0, "Light intensity scale")
	Cmd.Flags().BoolVar(&flg.Animations, "animations", false, "Whether animations should be processed")
	Cmd.Flags().BoolVar(&flg.Embed, "embed", false, "Whether to embed textures in the gltf file")
	Cmd.Flags().BoolVar(&flg.RelativeUri, "relative", false, "When linking resources (embed is false), relative uris are written in the gltf file")
	Cmd.Flags().BoolVar(&flg.SkipExisting, "skip", false, "Whether to skip existing files")
	Cmd.Flags().UintVarP(&flg.WorkerCount, "workers", "w", uint(env.PreferredWorkerCount()), "number of workers to use for processing")

	Cmd.Flags().StringVar(&flg.CrcFile, "crc-file", "nwt-crc.json", "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flg.UuidFile, "uuid-file", "nwt-types.json", "file with uuid hashes. Only used for object-stream conversion")
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
	if flg.Ktx2 {
		if _, ok := utils.Ktx.Check(); !ok {
			return nil, fmt.Errorf("--ktx needs the %s tool on the PATH:\n%s", utils.Ktx.Name(), utils.Ktx.Info())
		}
	}
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
	c.ProcessOptimize()
}

func (c *Collector) ProcessModels() {
	assets := c.models.Values()
	if len(assets) == 0 {
		return
	}
	models := make([]importer.AssetGroup, 0)
	animations := make([]importer.AssetGroup, 0)
	for _, group := range assets {
		if len(group.Animations) > 0 && len(group.Geometries) == 0 {
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
	// Group: the models convert their textures in parallel (AsyncImages), a shared texture converts once
	pngLoader := image.LoaderWithConverter{
		Archive: c.Archive,
		Catalog: c.Catalog,
		Group:   new(singleflight.Group),
		Cache:   image.NewCache(c.flags.CacheDir, ".png"),
		Converter: image.BasicConverter{
			Format:  ".png",
			MaxSize: c.flags.TextureSize,
		},
	}
	imageLoader := pngLoader
	if c.flags.Ktx2 {
		// each texture converts once from its DDS, the KTX2 format follows the DDS format (image.ktxFormatOfDDS).
		// The bakes read png and are encoded to KTX2 (gltf encodeBake).
		imageLoader = image.LoaderWithConverter{
			Archive: c.Archive,
			Catalog: c.Catalog,
			Group:   new(singleflight.Group),
			Cache:   image.NewCache(c.flags.CacheDir, string(image.FormatKTX2)),
			Converter: image.BasicConverter{
				Format:  image.FormatKTX2,
				MaxSize: c.flags.TextureSize,
			},
		}
	}
	if c.flags.Webp {
		// each texture converts once from its DDS, the bakes read png and are encoded to WebP (gltf encodeBake)
		imageLoader = image.LoaderWithConverter{
			Archive: c.Archive,
			Catalog: c.Catalog,
			Group:   new(singleflight.Group),
			Cache:   image.NewCache(c.flags.CacheDir, string(image.FormatWEBP)),
			Converter: image.BasicConverter{
				Format:  image.FormatWEBP,
				MaxSize: c.flags.TextureSize,
			},
		}
	}
	if c.flags.Dds {
		// the original DDS (as the server's textures=dds export, for Blender), BC5_SNORM normal maps as RGBA8 with z.
		// The bakes read png and are encoded to DDS (gltf encodeBake).
		imageLoader = image.LoaderWithConverter{
			Archive: c.Archive,
			Catalog: c.Catalog,
			Group:   new(singleflight.Group),
			Converter: image.BasicConverter{
				Format:       image.FormatDDS,
				MaxSize:      c.flags.TextureSize,
				NormalFormat: image.NormalFormatRGBA8,
			},
		}
	}
	linker := gltf.NewResourceLinker(c.flags.OutputDir)
	linker.SetRelativeMode(c.flags.RelativeUri)
	if c.flags.Embed {
		linker = nil
	}
	// the models share textures and bakes: each one is converted and written once
	linkedImages := gltf.NewLinkedImages()

	progress.RunTasks(progress.TasksConfig[importer.AssetGroup, string]{
		Description:   description,
		Tasks:         models,
		ProducerCount: int(c.flags.WorkerCount),
		Producer: func(group importer.AssetGroup) (string, error) {
			document := gltf.NewDocument()
			document.Extras = group.Extra
			document.Asset.Generator = "New World Buddy Tools"
			document.ImageLoader = imageLoader
			if c.flags.Ktx2 || c.flags.Dds || c.flags.Webp {
				// the bakes read png, then encode to the target format (gltf encodeBake)
				document.BakeImageLoader = pngLoader
			}
			document.ImageLinker = linker
			document.LinkedImages = linkedImages
			// a model's textures convert in parallel
			document.AsyncImages = true
			document.TargetFile = group.TargetFile
			name := c.modelName(group.TargetFile)
			if c.flags.SkipExisting && utils.FileExists(document.TargetFile) {
				return name, nil
			}

			// model export targets gltf spec, so y-up by default
			// also skipping all helper/shadow/lod nodes
			document.Options = gltf.ImportOptions{
				Base:            math.GetBase(true),
				LoadGeometry:    c.LoadAsset,
				LoadAnimation:   c.LoadAnimation,
				LoadMaterials:   c.LoadMaterial,
				Simplify:        c.flags.Simplify,
				SkipLod:         true,
				SkipHelper:      true,
				SkipShadowProxy: true,
				SkipUnlinkedMtl: true,
			}

			for _, geom := range group.Geometries {
				document.ImportAssetGeometry(geom)
			}
			if len(group.Animations) > 0 {
				document.MergeSkins()
			}
			for _, anim := range group.Animations {
				document.ImportAssetAnimations(anim)
			}
			for _, mats := range group.Materials {
				document.ImportMaterials(mats)
			}
			if flg.Lights && len(group.Lights) > 0 {
				document.ImportAssetLights(group.Lights, flg.LightIntensity)
			}
			if len(group.Entities) > 0 {
				document.ImportAssetEntities(group.Entities)
			}
			for key, value := range group.Extra {
				if sockets, ok := value.([]CharacterSocket); ok {
					// the joints are converted to the export's axes (C·M·C⁻¹), the relative transforms likewise
					value = convertSockets(sockets, document.Options.Base)
				}
				scene := document.DefaultScene()
				scene.Extras = gltf.ExtrasStore(scene.Extras, key, value)
			}

			document.ProcessMaterials(
				gltf.WithTextureBaking(true),
				gltf.WithDiffuseOnly(flg.Simplify),
				gltf.WithEmissiveRef(flg.EmissiveRef),
				gltf.WithSpecularIOR(flg.IOR),
			)
			document.CleanExtras()
			document.ApplyTextureBasisu()
			document.ApplyTextureWebp()

			if err := document.Save(); err != nil {
				return name, fmt.Errorf("model not saved: %w", err)
			}
			return name, nil
		},
		ConsumerCount: int(c.flags.WorkerCount),
	})
}

// modelName is the model's path in the output directory, for the progress detail
func (c *Collector) modelName(targetFile string) string {
	if rel, err := filepath.Rel(c.flags.OutputDir, targetFile); err == nil {
		return filepath.ToSlash(rel)
	}
	return targetFile
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
	crcFile, err := exec.LookPath(flg.CrcFile)
	if err != nil {
		slog.Warn("failed to load crc table", "file", flg.CrcFile, "err", err)
		return
	}
	crcTable, err := rtti.LoadCrcTable(crcFile)
	if err != nil {
		slog.Warn("failed to load crc table", "file", crcFile, "err", err)
		return
	}

	uuidFile, err := exec.LookPath(flg.UuidFile)
	if err != nil {
		slog.Warn("failed to load uuid table", "file", flg.UuidFile, "err", err)
		return
	}
	uuidTable, err := rtti.LoadUuIdTable(uuidFile)
	if err != nil {
		slog.Warn("failed to load uuid table", "file", uuidFile, "err", err)
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
	bar.Close()
}

func (c *Collector) ProcessOptimize() {
	if !c.flags.Optimize {
		return
	}
	if _, ok := utils.GltfTransform.Check(); !ok {
		slog.Warn("gltf-transform not available, skipping optimize step")
		return
	}

	assets := c.models.Values()
	if len(assets) == 0 {
		return
	}
	models := make([]importer.AssetGroup, 0)
	for _, group := range assets {
		if len(group.Animations) > 0 && len(group.Geometries) == 0 {
			//
		} else {
			models = append(models, group)
		}
	}

	progress.RunTasks(progress.TasksConfig[importer.AssetGroup, string]{
		Description:   "Optimize models",
		Tasks:         models,
		ProducerCount: int(c.flags.WorkerCount),
		Producer: func(group importer.AssetGroup) (string, error) {
			if _, err := os.Stat(group.TargetFile); err != nil {
				return "", err
			}

			format := "auto"
			if c.flags.Webp {
				format = "webp"
			}
			if c.flags.Ktx2 {
				format = "ktx2"
			}

			size := "4096"
			if c.flags.TextureSize > 0 {
				size = fmt.Sprintf("%d", c.flags.TextureSize)
			}

			err := utils.GltfTransform.Run("optimize", group.TargetFile, group.TargetFile, "--texture-compress", format, "--texture-size", size)
			return c.modelName(group.TargetFile), err
		},
		ConsumerCount: int(c.flags.WorkerCount),
	})
}
