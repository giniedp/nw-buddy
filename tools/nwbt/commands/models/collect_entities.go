package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/game/slicemodel"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
	"path"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

// lightTypeProbe is the LightType of environment probes (LightConfiguration)
const lightTypeProbe = 3

// isGlobalProbe tells a probe whose area covers the whole level (viewer EnvProbeComponent GLOBAL_PROBE_MIN_AREA)
func isGlobalProbe(probe level.ViewerLight) bool {
	if probe.ProbeArea == nil {
		return false
	}
	return min(probe.ProbeArea[0], probe.ProbeArea[1], probe.ProbeArea[2]) >= 10000
}

var cmdEntities = &cobra.Command{
	Use:   "entities",
	Short: "Converts levels entities_xml files to gltf",
	Long: strings.Trim(`
  Walks given entities xml files to collect the geometries into a single model.
  Such files are found in a root level directory like
    - levels/LEVEL_NAME/mission0.entities_xml
  --box keeps the meshes placed inside a box and the lights that reach it (game coordinates, z up), --exclude drops entities by name
  (the entity or one of its parents) or meshes by model file name. Environment probes are empty nodes with the
  viewer's light config in extras.nwEnvProbe, the global ones stay outside the box too. --sequence applies the light
  values (diffuse multiplier, visibility) a track view sequence of the file leaves at its end, e.g. the lights a
  cutscene switches on.`, "\n"),
	Run: runEntities,
	Example: strings.Trim(`
  nwbt models entities --level frontend
  nwbt models entities --level ftue_v2_cc --box -23,-26,8,18,-12,15 --exclude "occultist_*" --exclude "*_vfx*"
  nwbt models entities --level ftue_v2_cc --sequence Character_Create_Intro_Trackview_Sequence`, "\n"),
}

var flgBox string
var flgExclude []string
var flgSequence []string

func init() {
	cmdEntities.Flags().AddFlagSet(Cmd.Flags())
	cmdEntities.Flags().StringVar(&flgLevel, "level", "frontend", "The LEVEL_NAME in the level directory. Can be a glob expression.")
	cmdEntities.Flags().StringVar(&flgBox, "box", "", "Keeps only placements inside this box: minX,minY,minZ,maxX,maxY,maxZ in game coordinates (z up)")
	cmdEntities.Flags().StringArrayVar(&flgExclude, "exclude", nil, "Drops entities (by own or parent name) and meshes (by model file name) matching this glob, case insensitive. Repeatable")
	cmdEntities.Flags().StringArrayVar(&flgSequence, "sequence", nil, "Applies the light values this track view sequence leaves at its end, by name, case insensitive. Repeatable, applied in order")
}

func runEntities(ccmd *cobra.Command, args []string) {
	glob := path.Join("levels", flgLevel, "**.entities_xml")
	slog.SetDefault(logging.DefaultFileHandler())
	filter := utils.Must(newEntityFilter(flgBox, flgExclude))
	c := utils.Must(initCollector())
	c.Entities(glob, filter, flgSequence)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

// entityFilter selects the placements of an entities export by box and name globs
type entityFilter struct {
	box      *[6]float64
	excludes []string
}

func newEntityFilter(box string, excludes []string) (*entityFilter, error) {
	filter := &entityFilter{}
	for _, it := range excludes {
		filter.excludes = append(filter.excludes, strings.ToLower(it))
	}
	if box == "" {
		return filter, nil
	}
	parts := strings.Split(box, ",")
	if len(parts) != 6 {
		return nil, fmt.Errorf("box needs 6 values: minX,minY,minZ,maxX,maxY,maxZ, got %q", box)
	}
	filter.box = &[6]float64{}
	for i, part := range parts {
		value, err := strconv.ParseFloat(strings.TrimSpace(part), 64)
		if err != nil {
			return nil, fmt.Errorf("box value %q: %w", part, err)
		}
		filter.box[i] = value
	}
	return filter, nil
}

func (it *entityFilter) matches(name string) bool {
	name = strings.ToLower(name)
	for _, pattern := range it.excludes {
		if ok, _ := path.Match(pattern, name); ok {
			return true
		}
	}
	return false
}

// excludesNode tells whether the entity or one of its parents matches an exclude glob
func (it *entityFilter) excludesNode(node *game.SliceNode) bool {
	for ; node != nil; node = node.Parent {
		if node.Entity != nil && it.matches(string(node.Entity.Name)) {
			return true
		}
	}
	return false
}

// reaches tells whether a light (world transform in game coordinates) shines into the box: its range sphere touches it
func (it *entityFilter) reaches(transform mat4.Data, radius float64) bool {
	if it.box == nil {
		return true
	}
	distance := 0.0
	for i := range 3 {
		value := float64(transform[12+i])
		d := max(it.box[i]-value, 0, value-it.box[3+i])
		distance += d * d
	}
	return distance <= radius*radius
}

// lightRange is the reach of a light (LightConfiguration), 0 for probes
func lightRange(config nwt.LightConfiguration) float64 {
	switch config.LightType {
	case 0:
		return float64(config.PointMaxDistance)
	case 1:
		return float64(config.AreaMaxDistance)
	case 2:
		return float64(config.ProjectorDistance)
	}
	return 0
}

// keeps tells whether a placement (world transform in game coordinates) of the model file is exported
func (it *entityFilter) keeps(transform mat4.Data, model string) bool {
	if model != "" && it.matches(path.Base(model)) {
		return false
	}
	if it.box == nil {
		return true
	}
	box := it.box
	for i := range 3 {
		value := float64(transform[12+i])
		if value < box[i] || value > box[3+i] {
			return false
		}
	}
	return true
}

// pendingLight is a light of the walk, built once the sequences of the file are known
type pendingLight struct {
	entity uint64
	name   string
	config nwt.LightConfiguration
	world  mat4.Data
}

func (c *Collector) Entities(glob string, filter *entityFilter, sequenceNames []string) {
	files, _ := c.Archive.Glob(glob)
	bar := progress.Bar(len(files), "entities_xml")
	defer func() {
		bar.Detail("")
		bar.Close()
	}()

	group := importer.AssetGroup{}

	for _, file := range files {
		bar.Detail(file.Path())
		bar.Add(1)

		group = importer.AssetGroup{}

		if !strings.HasSuffix(file.Path(), ".entities_xml") {
			continue
		}

		var lights []pendingLight
		sequences := map[string]nwt.CAnimSequence{}
		slicemodel.Collect(c.Assets, file, slicemodel.Options{
			Keep:    filter.keeps,
			Exclude: filter.excludesNode,
			Visit: func(node *game.SliceNode, component any, world mat4.Data, group *importer.AssetGroup) {
				switch v := component.(type) {
				case nwt.LightComponent:
					config := v.LightConfiguration
					// invisible lights stay with nwLight.hidden (the viewer does not render them); --sequence switches
					// on the ones a cutscene turns on, e.g. the key lights of the character creation screen
					if config.LightType == lightTypeProbe {
						// env probes are entities with the viewer's light config, the global probes (an area beyond
						// the box) stay whatever the filter
						if probe := level.LoadViewerLight(c.Assets, config); isGlobalProbe(probe) || filter.keeps(world, "") {
							group.Entities = append(group.Entities, importer.Entity{
								Name:      string(node.Entity.Name),
								Transform: math.CryToGltfMat4(world),
								Extra:     map[string]any{"nwEnvProbe": probe},
							})
						}
						break
					}
					// lights outside the box that shine into it stay
					if !filter.reaches(world, lightRange(config)) {
						break
					}
					lights = append(lights, pendingLight{
						entity: uint64(node.Entity.Id.Id),
						name:   string(node.Entity.Name),
						config: config,
						world:  world,
					})
				case nwt.SequenceComponent:
					if level.IsSequence(v, sequenceNames) {
						sequences[strings.ToLower(string(v.Sequence.Element.Name))] = v.Sequence.Element
					}
				case nwt.TimeOfDayPOIComponent:
					// all zones of the file: the viewer blends the ones the camera is inside, like the game
					if tod := level.LoadViewerTimeOfDay(c.Assets, node.Entity, v); tod != nil {
						group.Entities = append(group.Entities, importer.Entity{
							Name:      string(node.Entity.Name),
							Transform: math.CryToGltfMat4(world),
							Extra:     map[string]any{"nwTimeOfDay": tod},
						})
					}
				case nwt.FogVolumeComponent:
					if !filter.keeps(world, "") {
						break
					}
					if volume := level.LoadViewerFogVolume(node.Entity, v); volume != nil {
						group.Entities = append(group.Entities, importer.Entity{
							Name:      string(node.Entity.Name),
							Transform: math.CryToGltfMat4(world),
							Extra:     map[string]any{"nwFogVolume": volume},
						})
					}
				}
			},
		}, &group)

		values := map[uint64]level.SequenceLightValues{}
		for _, name := range sequenceNames {
			if sequence, ok := sequences[strings.ToLower(name)]; ok {
				level.ReadSequenceLightValues(sequence, values)
			} else {
				slog.Warn("sequence not found", "file", file.Path(), "sequence", name)
			}
		}
		for _, it := range lights {
			state, fromSequence := values[it.entity]
			if fromSequence {
				state.Apply(&it.config)
				slog.Info("sequence light values", "light", it.name, "diffuse", it.config.DiffuseMultiplier, "visible", it.config.Visible)
			}
			light, ok := c.lightAsset(it.name, it.config, it.world)
			if !ok {
				continue
			}
			// marks the lights a sequence switched on, e.g. the character light rig of a cutscene
			if fromSequence && state.Sequence != "" {
				light.Extras["nwSequence"] = state.Sequence
			}
			group.Lights = append(group.Lights, light)
		}

		if len(group.Geometries) > 0 {
			group.TargetFile = c.outputPath(utils.ReplaceExt(file.Path(), ""))
			c.models.Store(group.TargetFile, group)
		}
	}
}
