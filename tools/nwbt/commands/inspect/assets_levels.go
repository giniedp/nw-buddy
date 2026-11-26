package inspect

import (
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"slices"
	"strings"

	"github.com/spf13/cobra"
)

var flgRegions []string

var cmdLevels = &cobra.Command{
	Use:   "levels <coatlicue...>",
	Short: "collects the models, materials and textures a viewer loads per region of a level",
	Long: `collects the models, materials and textures that the viewer loads per region
(capitals, chunks, slice closure, distribution, vegetation, impostors) and writes one json row per region.

Example: nwbt inspect levels newworld_vitaeeterna nw_dungeon_edengrove_00 --regions r_+03_+02 -o levels.jsonl`,
	Run: runLevels,
}

func init() {
	cmdLevels.Flags().StringSliceVar(&flgRegions, "regions", nil, "restrict to these region names (e.g. r_+03_+02)")
}

type LevelRegionRow struct {
	Level     string `json:"level"`
	Region    string `json:"region"`
	Capitals  int    `json:"capitals"`
	Chunks    int    `json:"chunks"`
	Slices    int    `json:"slices"`
	Entities  int    `json:"entities"`
	MeshComps int    `json:"meshComps"`
	Instances int    `json:"instances"` // mesh component instances (incl. instance transforms)
	DistCount int    `json:"distCount"`
	VegCount  int    `json:"vegCount"`
	Impostors int    `json:"impostors"` // impostor cell models
	// distinct files
	Models    []string `json:"models"`
	Pairs     []string `json:"pairs"` // model|material, one .glb request each
	Materials []string `json:"materials"`
	Textures  []string `json:"textures"`
	// models by source
	SliceModels []string `json:"sliceModels"`
	DistModels  []string `json:"distModels"`
	VegModels   []string `json:"vegModels"`
	ImpModels   []string `json:"impModels"`
}

func runLevels(ccmd *cobra.Command, args []string) {
	assets := utils.Must(game.InitPackedAssets(flgGameDir))
	jobs := make([]level.RegionDirectory, 0)
	for _, name := range args {
		coat := level.NewCoatlicueDirectory(name)
		for _, r := range coat.LoadRegionList(assets.Archive) {
			if len(flgRegions) > 0 && !slices.Contains(flgRegions, r.ID) {
				continue
			}
			jobs = append(jobs, level.NewRegionDirectory(name, r.ID))
		}
	}
	textureCache := maps.NewSafeMap[string, []string]()
	// regions load their content concurrently already
	flgWorkers = min(flgWorkers, 2)
	processRows("Regions", jobs, func(dir level.RegionDirectory) *LevelRegionRow {
		return inspectRegion(assets, dir, textureCache)
	})
}

type stringSet map[string]struct{}

func (s stringSet) add(v string) {
	if v != "" {
		s[v] = struct{}{}
	}
}
func (s stringSet) list() []string {
	res := make([]string, 0, len(s))
	for k := range s {
		res = append(res, k)
	}
	slices.Sort(res)
	return res
}

func inspectRegion(assets *game.Assets, dir level.RegionDirectory, textureCache *maps.SafeMap[string, []string]) *LevelRegionRow {
	row := &LevelRegionRow{
		Level:  dir.Coatlicue.Name,
		Region: dir.RegionName,
	}
	models := stringSet{}
	pairs := stringSet{}
	materials := stringSet{}
	sliceModels := stringSet{}
	distModels := stringSet{}
	vegModels := stringSet{}
	impModels := stringSet{}

	addPair := func(model, material string) {
		if model == "" {
			return
		}
		if material == "" {
			material = assets.ResolveMtlFromCgf(model)
		}
		models.add(model)
		materials.add(material)
		pairs.add(model + "|" + material)
	}

	if data := dir.LoadRuntimeCapitals(assets); data != nil {
		for _, l := range data.Capitals {
			row.Capitals += len(l)
		}
		for _, l := range data.Chunks {
			row.Chunks += len(l)
		}
		row.Slices = len(data.Slices)
		for _, slice := range data.Slices {
			row.Entities += len(slice.Entities)
			for _, e := range slice.Entities {
				for _, c := range e.Components {
					switch v := c.(type) {
					case level.ViewerMeshComponent:
						row.MeshComps++
						row.Instances += max(1, len(v.Instances))
						sliceModels.add(v.Model)
						addPair(v.Model, v.Material)
					case level.ViewerCharacterComponent:
						// character parts count as the mesh components they were before
						for _, part := range v.Parts {
							material := part.Material
							if v.MaterialOverride != "" {
								material = v.MaterialOverride
							}
							row.MeshComps++
							row.Instances++
							sliceModels.add(part.Mesh)
							addPair(part.Mesh, material)
						}
					}
				}
			}
		}
	}
	if dist, _ := dir.LoadDistribution(assets); dist != nil {
		row.DistCount = dist.Count
		for _, t := range dist.Types {
			for _, m := range t.Meshes {
				model := dist.Models[m.Model]
				material := ""
				if m.Material >= 0 && m.Material < len(dist.Materials) {
					material = dist.Materials[m.Material]
				}
				distModels.add(model)
				addPair(model, material)
			}
		}
	}
	if veg := dir.LoadVegetation(assets); veg != nil {
		row.VegCount = veg.Count
		for _, a := range veg.Assets {
			vegModels.add(a.Model)
			addPair(a.Model, a.Material)
		}
	}
	for _, sub := range []string{"impostors", "poi_impostors"} {
		files, _ := assets.Archive.Glob(dir.Path(sub, "*.cgf"))
		for _, f := range files {
			row.Impostors++
			impModels.add(f.Path())
			addPair(f.Path(), "")
		}
	}

	textures := stringSet{}
	for material := range materials {
		for _, t := range materialTextures(assets, material, textureCache) {
			textures.add(t)
		}
	}

	row.Models = models.list()
	row.Pairs = pairs.list()
	row.Materials = materials.list()
	row.Textures = textures.list()
	row.SliceModels = sliceModels.list()
	row.DistModels = distModels.list()
	row.VegModels = vegModels.list()
	row.ImpModels = impModels.list()
	return row
}

// materialTextures returns the resolved .dds files referenced by all sub materials
func materialTextures(assets *game.Assets, material string, cache *maps.SafeMap[string, []string]) []string {
	if material == "" {
		return nil
	}
	res, _ := cache.LoadOrStoreFn(material, func() []string {
		f, ok := assets.Archive.Lookup(material)
		if !ok {
			return nil
		}
		doc, err := mtl.Load(f)
		if err != nil {
			return nil
		}
		set := stringSet{}
		for _, m := range doc.Collection() {
			for t := range m.IterTextures() {
				if file := resolveTextureFile(assets, t.AssetId, t.File); file != nil {
					set.add(file.Path())
				}
			}
		}
		return set.list()
	})
	return res
}

func resolveTextureFile(assets *game.Assets, refs ...string) nwfs.File {
	for _, ref := range refs {
		if ref == "" {
			continue
		}
		file := ref
		if asset := assets.Catalog.LookupByRef(ref); asset != nil {
			file = asset.File
		}
		for _, candidate := range []string{file, utils.ReplaceExt(file, ".dds")} {
			candidate = nwfs.NormalizePath(candidate)
			if !strings.HasSuffix(candidate, ".dds") {
				continue
			}
			if res, ok := assets.Archive.Lookup(candidate); ok {
				return res
			}
		}
	}
	return nil
}
