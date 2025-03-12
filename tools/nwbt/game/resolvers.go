package game

import (
	"log/slog"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/cloth"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"strings"
)

const (
	DEFAULT_MATERIAL = "materials/references/base_colors/purple_trans_glowing.mtl"
	CHR_MODEL_MALE   = "objects/characters/player/male/player_male.chr"
	CHR_MODEL_FEMALE = "objects/characters/player/female/player_female.chr"
)

func (c *Assets) ResolveCgf(file string) string {
	if file == "" {
		return ""
	}
	file = nwfs.NormalizePath(file)
	f, exists := c.Archive.Lookup(file)
	if !exists {
		return ""
	}

	switch path.Ext(file) {
	case ".cloth":
		ref, _ := cloth.TryResolveGeometryReference(f)
		if ref != "" {
			return ref
		}
		slog.Debug("No skin found in cloth", "file", file)
		return ""
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
		file = nwfs.NormalizePath(file)
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
	model = nwfs.NormalizePath(model)
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

		uuid := utils.ExtractUUID(name)
		if uuid != "" {
			asset := c.Catalog[strings.ToLower(uuid)]
			if asset != nil {
				return asset.File
			}
		}

		candidates := []string{
			nwfs.NormalizePath(name),
			nwfs.NormalizePath(utils.ReplaceExt(name, ".mtl")),
			nwfs.NormalizePath(path.Join(path.Dir(model), name)),
			nwfs.NormalizePath(path.Join(path.Dir(model), utils.ReplaceExt(name, ".mtl"))),
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

func (c *Assets) ResolveModelMaterialPair(model, material string, fallback ...string) (string, string) {
	if model == "" {
		return "", ""
	}
	modelOut := c.ResolveCgf(model)
	if modelOut == "" {
		slog.Warn("model not resolved", "file", model)
		return "", ""
	}
	materialOut := c.ResolveMtl(material, fallback...)
	if materialOut == "" {
		materialOut = c.ResolveMtlFromCgf(model)
	}
	if materialOut == "" {
		slog.Warn("material not resolved", "file", material, "model", model)
		materialOut = DEFAULT_MATERIAL
	}
	return modelOut, materialOut
}

func (c *Assets) ResolveCdfAnimations(cdf cdf.Document) {
	animations, err := cdf.LoadAnimationFiles(c.Archive)
	if err != nil {
		slog.Error("animation files not loaded", "error", err)
		return
	}
	if len(animations) == 0 {
		return
	}

}
