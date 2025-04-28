package game

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/cloth"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"strings"
)

const (
	DEFAULT_MATERIAL = "materials/references/base_colors/purple_trans_glowing.mtl"
	CDF_MODEL_MALE   = "objects/characters/player/male/player_male.cdf"
	CDF_MODEL_FEMALE = "objects/characters/player/female/player_female.cdf"
	CHR_MODEL_MALE   = "objects/characters/player/male/player_male.chr"
	CHR_MODEL_FEMALE = "objects/characters/player/female/player_female.chr"
)

func (c *Assets) ResolveCgf(file string) string {
	if file == "" {
		return ""
	}
	f, exists := c.Archive.Lookup(file)
	if !exists {
		return ""
	}

	switch path.Ext(file) {
	case ".cgf", ".skin":
		return file
	case ".rnr":
		cgfPath := utils.ReplaceExt(file, ".cgf")
		if _, exists := c.Archive.Lookup(cgfPath); exists {
			return cgfPath
		}
		slog.Debug("No .cgf found for .rnr", "file", file)
	case ".cloth":
		if ref, _ := cloth.TryResolveGeometryReference(f); ref != "" {
			return ref
		}
		slog.Debug("No skin found in cloth", "file", file)
		return ""
	default:
		slog.Warn("Unsupported file type", "file", file, "type", path.Ext(file))
	}

	return file
}

func (c *Assets) ResolveMtl(file string, fallback ...string) string {
	if file == "" {
		return ""
	}
	files := []string{file}
	files = append(files, fallback...)
	for _, file := range files {
		if file == "" {
			continue
		}
		if _, exists := c.Archive.Lookup(file); exists {
			return file
		}
		if path.Ext(file) == "" {
			if _, exists := c.Archive.Lookup(file + ".mtl"); exists {
				return file + ".mtl"
			}
		}
		// materials are sometimes referenced wrongly
		// - objects\weapons\melee\spears\2h\spearisabella\textures\wep_mel_spr_2h_spearisabella_matgroup.mtl
		// should be
		// - objects\weapons\melee\spears\2h\spearisabella\wep_mel_spr_2h_spearisabella_matgroup.mtl
		candidates, _ := c.Archive.Glob(path.Dir(file) + "/**/" + path.Base(file))
		if len(candidates) > 0 {
			return candidates[0].Path()
		}
	}
	return ""
}

func (c *Assets) ResolveMtlFromCgf(model string) string {
	if model == "" {
		return ""
	}
	f, exists := c.Archive.Lookup(model)
	if !exists {
		return ""
	}
	doc, err := cgf.Load(f)
	if err != nil {
		slog.Warn("cgf file not loaded", "file", model, "error", err)
		return ""
	}

	for _, chunk := range doc.Chunks {
		namer, ok := chunk.(cgf.ChunkMtlNamer)
		if !ok {
			continue
		}
		name := namer.GetName()
		if name == "" {
			continue
		}

		if assetId, isAssetId := catalog.ParseAssetId(name); isAssetId {
			if assetId.IsZeroOrEmpty() {
				return ""
			}
			if asset := c.Catalog.LookupById(assetId); asset != nil {
				return asset.File
			}
			slog.Debug("material not found", "name", name)
			return ""
		}

		candidates := []string{
			name,
			utils.ReplaceExt(name, ".mtl"),
			path.Join(path.Dir(model), name),
			path.Join(path.Dir(model), utils.ReplaceExt(name, ".mtl")),
		}
		for _, material := range candidates {
			if _, exists := c.Archive.Lookup(material); exists {
				return material
			}
		}
		slog.Debug("material not found", "tried", candidates)
	}

	return ""
}

func (c *Assets) ResolveCgfAndMtl(model, material string, materialFallback ...string) (string, string) {
	if model == "" {
		return "", ""
	}
	modelOut := c.ResolveCgf(model)
	if modelOut == "" {
		slog.Warn("model not resolved", "file", model)
		return "", ""
	}
	materialOut := c.ResolveMtl(material, materialFallback...)
	if materialOut == "" {
		materialOut = c.ResolveMtlFromCgf(modelOut)
	}
	if materialOut == "" {
		slog.Warn("material not resolved, use fallback material", "file", material, "model", model)
		materialOut = DEFAULT_MATERIAL
	}
	return modelOut, materialOut
}

func (ctx *Assets) ResolveDynamicSliceByName(sliceName string) nwfs.File {
	if sliceName == "" || sliceName == "<PLOT>" {
		return nil
	}
	sliceName = strings.ToLower(sliceName)
	sliceName = strings.ReplaceAll(sliceName, "\\", "/")
	sliceName = strings.ReplaceAll(sliceName, "//", "/")

	fileName := sliceName
	if path.Ext(fileName) == "" {
		fileName += ".dynamicslice"
	}

	file, ok := ctx.Archive.LookupBySuffix(fileName)
	if !ok {
		slog.Debug("slice not resolved", "name", sliceName, "file", fileName)
	}
	return file
}
