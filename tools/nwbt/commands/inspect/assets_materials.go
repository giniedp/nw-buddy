package inspect

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"slices"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/spf13/cobra"
)

var cmdMaterials = &cobra.Command{
	Use:   "materials [glob...]",
	Short: "collects how .mtl files reference their textures (file path, asset id, engine texture) and whether they resolve",
	Run:   runMaterials,
}

var cmdCatalog = &cobra.Command{
	Use:   "catalog",
	Short: "writes filtered asset catalogs (asset id to file) of .mtl and .dds assets as json and binary, to measure their size",
	Long: `writes filtered asset catalogs to the --out directory:

  <ext>-catalog.json  {"<guid>:<subid hex>": "<file>"}
  <ext>-catalog.bin   uint32 count, count x (16 byte guid, uint32 subid, uint32 path offset), then the
                      zero terminated paths. Entries are sorted by guid and subid.`,
	Run: runCatalog,
}

type MaterialRow struct {
	File         string         `json:"file"`
	SubMaterials int            `json:"subMaterials"`
	Shaders      []string       `json:"shaders"`
	Textures     int            `json:"textures"`
	Refs         map[string]int `json:"refs"` // texture reference kinds, see textureRefKind
	Subs         []SubMaterial  `json:"subs"` // shader and gen mask of each (sub) material
	Error        string         `json:"error,omitempty"`
}

type SubMaterial struct {
	Name    string `json:"name"`
	Shader  string `json:"shader"`
	GenMask string            `json:"genMask"` // StringGenMask, e.g. %NORMAL_MAP%SPECULAR_MAP
	Maps    map[string]string `json:"maps,omitempty"` // texture map name to the DDS format name (e.g. BC3_UNORM_SRGB)
}

func runMaterials(ccmd *cobra.Command, args []string) {
	assets := utils.Must(game.InitPackedAssets(flgGameDir))
	if len(args) == 0 {
		args = []string{"**.mtl"}
	}
	files := utils.Must(listFiles(args, false, assets.Archive))
	processRows("Materials", files, func(file nwfs.File) *MaterialRow {
		return inspectMaterial(assets, file)
	})
}

func inspectMaterial(assets *game.Assets, file nwfs.File) *MaterialRow {
	row := &MaterialRow{
		File: file.Path(),
		Refs: map[string]int{},
	}
	doc, err := mtl.Load(file)
	if err != nil {
		row.Error = err.Error()
		return row
	}
	shaders := stringSet{}
	for _, m := range doc.Collection() {
		row.SubMaterials++
		shaders.add(strings.ToLower(m.Shader))
		sub := SubMaterial{Name: m.Name, Shader: strings.ToLower(m.Shader), GenMask: m.StringGenMask, Maps: map[string]string{}}
		for _, t := range m.Textures.Texture {
			row.Textures++
			row.Refs[textureRefKind(assets, t)]++
			sub.Maps[string(t.Map)] = textureFormatName(assets, t)
		}
		row.Subs = append(row.Subs, sub)
	}
	row.Shaders = shaders.list()
	return row
}

// textureRefKind classifies a texture reference of a material
//
//   - engine: engine texture name like $EnvironmentCube
//   - file: resolvable by its file path (normalized, .tif/.png replaced by .dds)
//   - file+id: resolvable by its file path, an asset id is given as well
//   - id: only resolvable by its asset id (catalog lookup)
//   - missing-file: file path does not resolve, no or no resolvable asset id
//   - empty: neither file nor asset id
func textureRefKind(assets *game.Assets, t mtl.Texture) string {
	if t.File == "" && t.AssetId == "" {
		return "empty"
	}
	if strings.HasPrefix(t.File, "$") {
		return "engine"
	}
	byFile := t.File != "" && resolveTextureFile(assets, t.File) != nil
	byId := false
	if t.AssetId != "" {
		if asset := assets.Catalog.LookupByRef(t.AssetId); asset != nil {
			_, byId = assets.Archive.Lookup(asset.File)
		}
	}
	switch {
	case byFile && t.AssetId != "":
		return "file+id"
	case byFile:
		return "file"
	case byId:
		return "id"
	}
	return "missing-file"
}

// textureFormatName is the DDS format name of a texture reference, or the reference kind if it does not resolve
func textureFormatName(assets *game.Assets, t mtl.Texture) string {
	if strings.HasPrefix(t.File, "$") {
		return t.File
	}
	file := resolveTextureFile(assets, t.AssetId, t.File)
	if file == nil {
		return "missing"
	}
	meta, err := dds.LoadMeta(file)
	if err != nil {
		return "error"
	}
	return meta.FormatName()
}

type catalogEntry struct {
	guid  uuid.UUID
	subId uint32
	file  string
}

func runCatalog(ccmd *cobra.Command, args []string) {
	assets := utils.Must(game.InitPackedAssets(flgGameDir))
	os.MkdirAll(flgOut, os.ModePerm)
	for _, ext := range []string{".mtl", ".dds"} {
		entries := make([]catalogEntry, 0)
		for asset := range assets.Catalog.All() {
			if path.Ext(asset.File) != ext {
				continue
			}
			guid, err := uuid.FromString(asset.Guid)
			if err != nil {
				continue
			}
			entries = append(entries, catalogEntry{guid: guid, subId: asset.SubID, file: strings.ToLower(asset.File)})
		}
		slices.SortFunc(entries, func(a, b catalogEntry) int {
			if c := strings.Compare(string(a.guid[:]), string(b.guid[:])); c != 0 {
				return c
			}
			return int(a.subId) - int(b.subId)
		})
		name := strings.TrimPrefix(ext, ".")
		writeCatalogJson(path.Join(flgOut, name+"-catalog.json"), entries)
		writeCatalogBin(path.Join(flgOut, name+"-catalog.bin"), entries)
	}
}

func writeCatalogJson(file string, entries []catalogEntry) {
	out := make(map[string]string, len(entries))
	for _, e := range entries {
		out[fmt.Sprintf("%s:%x", e.guid.String(), e.subId)] = e.file
	}
	data := utils.Must(json.Marshal(out))
	if err := os.WriteFile(file, data, 0644); err != nil {
		panic(err)
	}
}

func writeCatalogBin(file string, entries []catalogEntry) {
	table := make([]byte, 0, 4+len(entries)*24)
	strs := make([]byte, 0)
	table = binary.LittleEndian.AppendUint32(table, uint32(len(entries)))
	for _, e := range entries {
		table = append(table, e.guid[:]...)
		table = binary.LittleEndian.AppendUint32(table, e.subId)
		table = binary.LittleEndian.AppendUint32(table, uint32(len(strs)))
		strs = append(strs, e.file...)
		strs = append(strs, 0)
	}
	if err := os.WriteFile(file, append(table, strs...), 0644); err != nil {
		panic(err)
	}
}
