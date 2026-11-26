package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"path"
	"slices"
	"strings"
)

type Collector struct {
	*game.Assets
	models    *maps.Dict[importer.AssetGroup]
	timelines *maps.Dict[nwfs.File]
	// animation names of a database and its sub databases, by lower case file (adbAnimationNames)
	adbNames *maps.Dict[[]string]
	flags    Flags
}

func NewCollector(assets *game.Assets, flags Flags) *Collector {
	if flags.TextureSize > 0 {
		flags.CacheDir = path.Join(flags.CacheDir, fmt.Sprintf("%d", flags.TextureSize))
		slog.Info("Texture size is set, remap cache dir to", "cache", flags.CacheDir)
	}
	if flags.Embed && (flags.Webp || flags.Ktx2) && !flags.Optimize {
		slog.Warn("Embedded textures are png only, ignoring texture-format flag")
		flags.Webp = false
		flags.Ktx2 = false
	}
	return &Collector{
		Assets:    assets,
		models:    maps.NewDict[importer.AssetGroup](),
		timelines: maps.NewDict[nwfs.File](),
		adbNames:  maps.NewDict[[]string](),
		flags:     flags,
	}
}

func (c *Collector) outputPath(file string) string {
	return path.Join(c.flags.OutputDir, c.assetPath(file))
}

func (c *Collector) assetPath(file string) string {
	if c.flags.Binary {
		file += ".glb"
	} else {
		file += ".gltf"
	}
	return strings.ToLower(file)
}

func (c *Collector) shouldProcess(file string) bool {
	if c.flags.SkipExisting && utils.FileExists(file) {
		return false
	}
	if c.models.Has(file) {
		return false
	}
	return true
}

func (c *Collector) addTimelineFile(timelineFile string) {
	timelineFile = nwfs.NormalizePath(timelineFile)
	if timelineFile == "" {
		return
	}
	candidates := []string{timelineFile}
	candidates = utils.AppendUniqNoZero(candidates, utils.ReplaceExt(timelineFile, ".timeline"))
	for _, candidate := range candidates {
		if file, ok := c.Archive.Lookup(candidate); ok && file != nil {
			c.timelines.LoadOrStore(timelineFile, file)
			return
		}
	}
	slog.Warn("timeline not found", "tried", candidates)
}

func getCommaSeparatedList(value string) []string {
	if value == "" {
		return nil
	}
	return strings.Split(value, ",")
}

func matchFilter(substrings []string, token string) bool {
	if len(substrings) == 0 {
		return true
	}
	index := slices.IndexFunc(substrings, func(substr string) bool {
		return strings.Contains(strings.ToLower(token), strings.ToLower(substr))
	})
	return index >= 0
}

// lightAsset converts a LightComponent to a glTF light at the world transform (game coordinates). Point and area
// lights become point lights, projectors spot lights. Probes are no lights. The viewer's light config
// (level.LoadViewerLight) goes to the extras as `nwLight`, it keeps what glTF lights cannot express:
//   - bulb size
//   - specular
//   - ambient
//   - fog
//   - area size
func (c *Collector) lightAsset(name string, config nwt.LightConfiguration, world mat4.Data) (importer.LightAsset, bool) {
	light := importer.LightAsset{
		Color:     [3]float32{float32(config.Color[0]), float32(config.Color[1]), float32(config.Color[2])},
		Intensity: float32(config.DiffuseMultiplier),
		Entity: importer.Entity{
			Name:      name,
			Transform: math.CryToGltfMat4(world),
		},
		Extras: map[string]any{
			"nwLight": level.LoadViewerLight(c.Assets, config),
		},
	}
	switch config.LightType {
	case 0:
		light.Range = float32(config.PointMaxDistance)
	case 1:
		light.Range = float32(config.AreaMaxDistance)
	case 2:
		light.Type = 2
		light.Range = float32(config.ProjectorDistance)
		light.OuterConeAngle = float32(config.ProjectorFOV/2.0) * DEG_TO_RAD
	default:
		return light, false
	}
	return light, true
}
