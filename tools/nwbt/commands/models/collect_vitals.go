package models

import (
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/scanner"
	"nw-buddy/tools/game/slicemodel"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"slices"
	"strings"

	"github.com/spf13/cobra"
)

var flgVitalsFile string
var cmdCollectVitals = &cobra.Command{
	Use:   "vitals",
	Short: "converts vitals",
	Long:  "",
	Run:   runCollectVitals,
}

func init() {
	cmdCollectVitals.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectVitals.Flags().StringVar(&flgIds, "ids", "", "comma separated list of ids to process")
	cmdCollectVitals.Flags().StringVar(&flgVitalsFile, "meta", path.Join(env.PullDataDir(), "generated", "vitals_models_metadata.json"), "The vitals models meta file to process")
}

func runCollectVitals(ccmd *cobra.Command, args []string) {
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectVitals(flgVitalsFile, getCommaSeparatedList(flgIds)...)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectVitals(indexFile string, ids ...string) {
	data, err := os.ReadFile(indexFile)
	if err != nil {
		slog.Error("failed to read vitals file", "err", err)
		return
	}
	list := make([]scanner.ScannedVitalModel, 0)
	err = json.UnmarshalJSON(data, &list)
	if err != nil {
		slog.Error("failed to unmarshal vitals file", "err", err)
		return
	}

	// the rows of a model share its file, it has the clips of all their databases
	databases := make(map[string][]string)
	for _, entry := range list {
		databases[entry.Model] = utils.AppendUniqNoZero(databases[entry.Model], entry.Adb)
	}

	bar := progress.Bar(len(list), "Vitals")
	for _, entry := range list {
		bar.Add(1)
		bar.Detail(entry.Id)

		index := slices.IndexFunc(entry.VitalIds, func(id string) bool {
			return matchFilter(ids, id)
		})
		if index == -1 {
			continue
		}

		for _, weapon := range entry.Weapons {
			c.collectVitalWeapon(weapon.Mesh)
		}

		targetFile := c.outputPath(entry.Model)
		if !c.shouldProcess(targetFile) {
			continue
		}
		switch path.Ext(entry.Cdf) {
		case "":
			c.collectVitalParts(entry.Id, targetFile)
		case ".cdf":
			cdf, err := c.LoadCdf(entry.Cdf)
			if err != nil {
				slog.Warn("skip unresolved cdf file", "err", err)
				continue
			}
			c.CollectCdf(cdf, entry.Mtl, entry.Overcoat, targetFile, c.adbAnimationFilter(databases[entry.Model]...))
		default:
			if model, material := c.ResolveCgfAndMtl(entry.Cdf, entry.Mtl); model != "" {
				c.models.Store(targetFile, importer.AssetGroup{
					TargetFile: targetFile,
					Geometries: []importer.GeometryAsset{{
						GeometryFile: model,
						MaterialFile: material,
						OvercoatFile: entry.Overcoat,
					}},
				})
			}
		}
	}
	bar.Close()
}

// collectVitalWeapon collects a weapon vitals hold at its game path, without animations
func (c *Collector) collectVitalWeapon(mesh string) {
	if path.Ext(mesh) != ".cdf" {
		return
	}
	targetFile := c.outputPath(mesh)
	if !c.shouldProcess(targetFile) {
		return
	}
	cdf, err := c.LoadCdf(mesh)
	if err != nil {
		slog.Warn("skip unresolved weapon", "err", err)
		return
	}
	c.CollectCdf(cdf, "", "", targetFile, func(name string) bool { return false })
}

// collectVitalParts collects the meshes below the vitals entity of a model without cdf, in their bind pose
func (c *Collector) collectVitalParts(id string, targetFile string) {
	file, slice, vital, err := scanner.FindVitalModelEntity(c.Assets, id)
	if err != nil {
		slog.Warn("skip vital without slice", "id", id, "err", err)
		return
	}
	// the walker places the slice by its root, the model stands at the vitals entity
	world := game.FindEntityTransformMat4(vital)
	if root, ok := game.SliceRootTransform(slice); ok {
		world = mat4.Multiply(mat4.Invert(root), world)
	}
	origin := mat4.Invert(world)
	group := importer.AssetGroup{TargetFile: targetFile}
	slicemodel.Collect(c.Assets, file, slicemodel.Options{
		Root:      &origin,
		Overcoats: true,
		Exclude: func(node *game.SliceNode) bool {
			return node.Parent != nil || !scanner.IsEntityBelow(node.Slice, node.Entity, vital)
		},
	}, &group)
	if len(group.Geometries) == 0 {
		slog.Warn("vital without parts", "id", id)
		return
	}
	c.models.Store(targetFile, group)
}

// adbAnimationFilter accepts the animations the fragments of animation databases and their sub databases play: the
// vital's action list (the ADB) can only play those. Without a database (or when it fails to load) none.
func (c *Collector) adbAnimationFilter(adbFiles ...string) func(name string) bool {
	names := make(map[string]bool)
	for _, adbFile := range adbFiles {
		for _, it := range c.adbAnimationNames(adbFile) {
			names[it] = true
		}
	}
	return func(name string) bool {
		return names[strings.ToLower(name)]
	}
}

// adbAnimationNames returns the animation names of a database and its sub databases (lower case), cached per file
func (c *Collector) adbAnimationNames(adbFile string) []string {
	key := strings.ToLower(adbFile)
	if names, ok := c.adbNames.Load(key); ok {
		return names
	}
	result := make([]string, 0)
	seen := make(map[string]bool)
	done := make(map[string]bool)
	pending := []string{key}
	for len(pending) > 0 {
		file := pending[0]
		pending = pending[1:]
		if done[file] {
			continue
		}
		done[file] = true
		doc, err := c.LoadAdb(file)
		if err != nil {
			slog.Warn("ADB not loaded", "file", file, "err", err)
			continue
		}
		for _, name := range doc.AnimationNames() {
			if !seen[name] {
				seen[name] = true
				result = append(result, name)
			}
		}
		for _, sub := range doc.SubADBs.SubADB {
			if sub.File != "" {
				pending = append(pending, strings.ToLower(sub.File))
			}
		}
	}
	c.adbNames.Store(key, result)
	return result
}
