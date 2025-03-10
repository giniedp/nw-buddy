package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/cloth"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"path"
	"strings"
)

type Collector struct {
	archive nwfs.Archive
	catalog catalog.Document
	tables  []datasheet.Document
	models  *maps.Dict[importer.AssetGroup]
}

const (
	DEFAULT_MATERIAL = "materials/references/base_colors/purple_trans_glowing.mtl"
	CHR_MODEL_MALE   = "objects/characters/player/male/player_male.chr"
	CHR_MODEL_FEMALE = "objects/characters/player/female/player_female.chr"
)

func NewCollector(archive nwfs.Archive, catalog catalog.Document, tables []datasheet.Document) *Collector {
	return &Collector{
		archive: archive,
		catalog: catalog,
		tables:  tables,
		models:  maps.NewDict[importer.AssetGroup](),
	}
}

func (c *Collector) resolveCgf(file string) string {
	if file == "" {
		return ""
	}
	file = nwfs.NormalizePath(file)
	f, exists := c.archive.Lookup(file)
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

func (c *Collector) resolveMtl(file string, fallback ...string) string {
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
		if _, exists := c.archive.Lookup(file); exists {
			return file
		}
		if path.Ext(file) == "" {
			if _, exists := c.archive.Lookup(file + ".mtl"); exists {
				return file + ".mtl"
			}
		}
		// materials are sometimes referenced wrongly
		// - objects\weapons\melee\spears\2h\spearisabella\textures\wep_mel_spr_2h_spearisabella_matgroup.mtl
		// should be
		// - objects\weapons\melee\spears\2h\spearisabella\wep_mel_spr_2h_spearisabella_matgroup.mtl
		candidates, _ := c.archive.Glob(path.Dir(file) + "/**/" + path.Base(file))
		if len(candidates) > 0 {
			return candidates[0].Path()
		}
	}
	return ""
}

func (c *Collector) resolveMtlFromCgf(model string) string {
	if model == "" {
		return ""
	}
	model = nwfs.NormalizePath(model)
	f, exists := c.archive.Lookup(model)
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
		uuid := utils.ExtractUUID(namer.GetName())
		if uuid == "" {
			continue
		}
		asset := c.catalog[strings.ToLower(uuid)]
		if asset != nil {
			return asset.File
		}
	}

	// TODO: Implement this
	// // Just find a material near to current location and best match by path/file name
	// const mtlSearch = [path.dirname(model) + '/**/*.mtl', path.dirname(model) + '/../*.mtl']
	// const candidates = await glob(mtlSearch).then((files) => sortFilesByLevensteinDistance(model, files))

	// if (candidates.length) {
	//   // logger.debug(candidates)
	//   return path.relative(options.inputDir, candidates[0])
	// }

	return ""
}

func (c *Collector) resolveModelMaterial(model, material string, fallback ...string) (string, string) {
	if model == "" {
		return "", ""
	}
	modelOut := c.resolveCgf(model)
	if modelOut == "" {
		slog.Warn("model not resolved", "file", model)
		return "", ""
	}
	materialOut := c.resolveMtl(material, fallback...)
	if materialOut == "" {
		materialOut = c.resolveMtlFromCgf(model)
	}
	if materialOut == "" {
		slog.Warn("material not resolved", "file", material, "model", model)
		materialOut = DEFAULT_MATERIAL
	}
	return modelOut, materialOut
}

type cdfAsset struct {
	file        string
	model       string
	animations  []string
	attachments []cdf.Attachment
}

func (c *Collector) resolveCdfAsset(model string, animations bool) (*cdfAsset, error) {
	result := &cdfAsset{}
	model = nwfs.NormalizePath(model)
	file, ok := c.archive.Lookup(model)
	if !ok {
		return nil, fmt.Errorf("file not found: %s", model)
	}

	doc, err := cdf.Load(file)
	if err != nil {
		return nil, err
	}

	result.file = file.Path()
	result.model = doc.Model.File
	result.animations = make([]string, 0)
	if animations {
		// TODO: Implement this
	}
	result.attachments = doc.SkinsOrCloth()
	return result, nil
}
