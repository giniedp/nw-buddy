package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"path"
	"slices"
	"strings"
)

type Collector struct {
	*game.Assets
	models    *maps.Dict[importer.AssetGroup]
	timelines *maps.Dict[nwfs.File]
	flags     Flags
}

func NewCollector(assets *game.Assets, flags Flags) *Collector {
	if flags.TextureSize > 0 {
		flags.CacheDir = path.Join(flags.CacheDir, fmt.Sprintf("%d", flags.TextureSize))
		slog.Info("Texture size is set, remap cache dir to", "cache", flags.CacheDir)
	}
	if flags.Embed && (flags.Webp || flags.Ktx2) {
		slog.Warn("Embedded textures are png only, ignoring texture-format flag")
		flags.Webp = false
		flags.Ktx2 = false
	}
	if flags.Webp {
		if _, ok := utils.Cwebp.Check(); !ok {
			flags.Webp = false
			slog.Warn("cwebp not available, ignoring webp flag")
		}
	}
	if flags.Ktx2 {
		if _, ok := utils.Ktx.Check(); !ok {
			flags.Ktx2 = false
			slog.Warn("ktx not available, ignoring ktx flag")
		}
	}
	return &Collector{
		Assets:    assets,
		models:    maps.NewDict[importer.AssetGroup](),
		timelines: maps.NewDict[nwfs.File](),
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
