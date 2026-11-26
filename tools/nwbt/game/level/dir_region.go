package level

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/formats/localmappings"
	"nw-buddy/tools/formats/mapsettings"
	"nw-buddy/tools/formats/waterqt"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"
)

type RegionDirectory struct {
	Coatlicue  CoatlicueDirectory
	RegionName string
}

func (dir *RegionDirectory) Path(paths ...string) string {
	tokens := []string{dir.Coatlicue.Name, "regions", dir.RegionName}
	tokens = append(tokens, paths...)
	return coatlicuePath(tokens...)
}

func (dir *RegionDirectory) PathLocalMappingsFile() string {
	return dir.Path("localmappings.json")
}
func (dir *RegionDirectory) PathImpostorsFile() string {
	return dir.Path("impostors.json")
}
func (dir *RegionDirectory) PathPoiImpostorsFile() string {
	return dir.Path("poi_impostors.json")
}
func (dir *RegionDirectory) PathMapSettingsFile() string {
	return dir.Path("mapsettings.json")
}

func (dir *RegionDirectory) PathChunksFile() string {
	return dir.Path("region.chunks")
}
func (dir *RegionDirectory) PathDistributionFile() string {
	return dir.Path("region.distribution")
}
func (dir *RegionDirectory) PathHeightmapFile() string {
	return dir.Path("region.heightmap")
}
func (dir *RegionDirectory) PathMetadataFile() string {
	return dir.Path("region.metadata")
}
func (dir *RegionDirectory) PathSlicedataFile() string {
	return dir.Path("region.slicedata")
}
func (dir *RegionDirectory) PathTractmapFile() string {
	return dir.Path("region.tractmap.tif")
}
func (dir *RegionDirectory) PathWatermapFile() string {
	return dir.Path("region.waterqt")
}
func (dir *RegionDirectory) PathVegetationmapFile() string {
	return dir.Path("region.vegetation")
}

func NewRegionDirectory(name string, region string) RegionDirectory {
	return RegionDirectory{
		Coatlicue:  NewCoatlicueDirectory(name),
		RegionName: region,
	}
}

func (dir *RegionDirectory) LoadLocalMappings(assets *game.Assets) *localmappings.Document {
	if file, ok := assets.Archive.Lookup(dir.PathLocalMappingsFile()); ok {
		if doc, err := localmappings.Load(file); err != nil {
			slog.Error("localmappings not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		} else {
			return doc
		}
	}
	return nil
}

func (dir *RegionDirectory) LoadMapSettings(assets *game.Assets) *mapsettings.Document {
	if file, ok := assets.Archive.Lookup(dir.PathMapSettingsFile()); ok {
		if doc, err := mapsettings.Load(file); err != nil {
			slog.Error("mapsettings not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		} else {
			return doc
		}
	}
	return nil
}

func (dir *RegionDirectory) LoadImpostors(assets *game.Assets) *impostors.Document {
	if file, ok := assets.Archive.Lookup(dir.PathImpostorsFile()); ok {
		if doc, err := impostors.Load(file); err != nil {
			slog.Error("impostors not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		} else {
			return doc
		}
	}
	return nil
}

func (dir *RegionDirectory) LoadPoiImpostors(assets *game.Assets) *impostors.Document {
	if file, ok := assets.Archive.Lookup(dir.PathPoiImpostorsFile()); ok {
		if doc, err := impostors.Load(file); err != nil {
			slog.Error("poi_impostors not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		} else {
			return doc
		}
	}
	return nil
}

func (dir *RegionDirectory) LoadCapitalsLayers(assets *game.Assets) map[string][]capitals.Capital {
	result := make(map[string][]capitals.Capital)
	if files, err := assets.Archive.Glob(dir.Path("capitals", "**.capitals.json")); err == nil {
		prefix := dir.Path("capitals") + "/"
		for _, file := range files {
			relative := strings.TrimPrefix(file.Path(), prefix)
			layer := path.Dir(relative)

			if doc, err := capitals.Load(file); err == nil {
				result[layer] = doc.Capitals
			} else {
				slog.Error("capitals not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "layer", layer, "error", err)
			}
		}
	}

	return result
}

// LoadChunksLayers returns the chunks of the region by layer: from region.chunks, else from the layer .chunks files
// (the game's order)
func (dir *RegionDirectory) LoadChunksLayers(assets *game.Assets) map[string][]nwt.ChunkEntry {
	if result, ok := dir.loadRegionChunks(assets); ok {
		return result
	}
	return dir.loadLayerChunks(assets)
}

// loadRegionChunks reads region.chunks, which holds the chunks of all layers
func (dir *RegionDirectory) loadRegionChunks(assets *game.Assets) (map[string][]nwt.ChunkEntry, bool) {
	file, ok := assets.Archive.Lookup(dir.PathChunksFile())
	if !ok {
		return nil, false
	}
	obj, err := game.LoadObjectStream(file)
	if err != nil {
		slog.Error("failed to load chunk file", "level", dir.Coatlicue.Name, "region", dir.RegionName, "file", file.Path(), "error", err)
		return nil, false
	}
	chunks, ok := obj.(nwt.GridGenericAsset_AssetData__)
	if !ok {
		return nil, false
	}
	result := make(map[string][]nwt.ChunkEntry)
	for _, chunk := range chunks.Chunks.Element {
		// lower case, as the layer directory names of the capitals
		layer := strings.ToLower(string(chunk.Layer))
		result[layer] = append(result[layer], chunk)
	}
	return result, true
}

func (dir *RegionDirectory) loadLayerChunks(assets *game.Assets) map[string][]nwt.ChunkEntry {
	result := make(map[string][]nwt.ChunkEntry)
	files, err := assets.Archive.Glob(dir.Path("capitals", "**.chunks"))
	if err != nil {
		slog.Error("failed to glob chunk files", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		return result
	}

	prefix := dir.Path("capitals") + "/"
	for _, file := range files {
		relative := strings.TrimPrefix(file.Path(), prefix)
		layer := path.Dir(relative)

		chunkFile, ok := assets.Archive.Lookup(file.Path())
		if !ok {
			slog.Error("chunk file not found", "level", dir.Coatlicue.Name, "region", dir.RegionName, "layer", layer, "file", file.Path())
			continue
		}

		obj, err := game.LoadObjectStream(chunkFile)
		if err != nil {
			slog.Error("failed to load chunk file", "level", dir.Coatlicue.Name, "region", dir.RegionName, "layer", layer, "file", file.Path(), "error", err)
			continue
		}

		if chunks, ok := obj.(nwt.GridGenericAsset_AssetData__); ok {
			for _, chunk := range chunks.Chunks.Element {
				result[layer] = append(result[layer], chunk)
			}
		}
	}

	return result
}

func (dir *RegionDirectory) LoadHeightMap(assets *game.Assets) *heightmap.Region {
	file, ok := assets.Archive.Lookup(dir.PathHeightmapFile())
	if !ok {
		return nil
	}

	result, err := heightmap.LoadRegion(file)
	if err != nil {
		slog.Error("heightmap not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		return nil
	}

	return &result
}

func (dir *RegionDirectory) LoadWaterMap(assets *game.Assets) *waterqt.Heightmap {
	file, ok := assets.Archive.Lookup(dir.PathWatermapFile())
	if !ok {
		return nil
	}

	result, err := waterqt.Load(file)
	if err != nil {
		slog.Error("waterqt not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		return nil
	}

	hm, err := result.ToHeightmap()
	if err != nil {
		slog.Error("waterqt heightmap not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
		return nil
	}

	return hm
}

func (dir *RegionDirectory) LoadPoiImpostorsInfo(assets *game.Assets, workerCount uint) []RegionImpostor {
	doc := dir.LoadPoiImpostors(assets)
	if doc == nil {
		return nil
	}
	return dir.loadImpostors(assets, workerCount, doc)
}

func (dir *RegionDirectory) LoadImpostorsInfo(assets *game.Assets, workerCount uint) []RegionImpostor {
	doc := dir.LoadImpostors(assets)
	if doc == nil {
		return nil
	}
	return dir.loadImpostors(assets, workerCount, doc)
}

func (dir *RegionDirectory) loadImpostors(assets *game.Assets, workerCount uint, doc *impostors.Document) []RegionImpostor {

	result := maps.NewSafeSet[RegionImpostor]()
	progress.Concurrent(workerCount, doc.Impostors, func(imp impostors.Impostor, i int) error {
		file, err := assets.LookupFileByAssetIdRef(imp.MeshAssetID)
		if err != nil {
			slog.Error("impostor not loaded", "level", dir.Coatlicue.Name, "region", dir.RegionName, "error", err)
			return nil
		}

		if file == nil {
			slog.Warn("impostor mesh asset not found", "level", dir.Coatlicue.Name, "region", dir.RegionName, "assetId", imp.MeshAssetID)
			return nil
		}

		result.Store(RegionImpostor{
			Position: Vec2{
				X: float32(imp.WorldPosition.X),
				Y: float32(imp.WorldPosition.Y),
			},
			Model: file.Path(),
		})
		return nil
	})

	return result.Values()
}

func (dir *RegionDirectory) LoadRegionMaterials(assets *game.Assets) *RegionMaterial {

	doc := dir.Coatlicue.LoadTerrainSettings(assets)
	worldMatFile, ok := assets.Archive.Lookup(doc.WorldMaterialAssetPath)
	if !ok {
		return nil
	}

	worldMatAsset, err := assets.LoadWorldMaterial(worldMatFile)
	if err != nil {
		slog.Error("failed to load world material", "err", err)
		return nil
	}

	for _, tile := range worldMatAsset.Regions.Element {
		loc := location{
			X: int(tile.Tile_X),
			Y: int(tile.Tile_Y),
		}

		if !strings.EqualFold(dir.RegionName, formatRegionName(loc)) {
			continue
		}

		regionMatFile, err := assets.LookupFileByAsset(tile.Layers)
		if err != nil {
			slog.Error("failed to load world material", "err", err)
			continue
		}

		regionMatAsset, err := assets.LoadRegionMaterial(regionMatFile)
		if err != nil {
			slog.Error("failed to load region material", "err", err)
			continue
		}

		colorMap, _ := assets.LookupFileByAsset(regionMatAsset.Macro_ColorMap)
		normalMap, _ := assets.LookupFileByAsset(regionMatAsset.Macro_NormalMap)
		glossMap, _ := assets.LookupFileByAsset(regionMatAsset.Macro_GlossMap)
		defaultMaterial, _ := assets.LookupFileByAsset(regionMatAsset.Default_Material)

		material := RegionMaterial{
			TileX:           int(tile.Tile_X),
			TileY:           int(tile.Tile_Y),
			ColorMap:        colorMap,
			NormalMap:       normalMap,
			GlossMap:        glossMap,
			DefaultMaterial: defaultMaterial,

			MacroMaterialParams:   toMacroParams(regionMatAsset.MacroMaterialParams),
			WorldBackgroundParams: toMacroParams(worldMatAsset.BackgroundMacroMaterialParams),
			WorldForegroundParams: toMacroParams(worldMatAsset.ForegroundMacroMaterialParams),
			POMDisplacement:       float32(worldMatAsset.POMDisplacement),
			POMHeightBias:         float32(worldMatAsset.POMHeightBias),
			POMSelfShadowStrength: float32(worldMatAsset.POMSelfShadowStrength),
		}
		if regionMatAsset.EnableCustomBackgroundParams || regionMatAsset.EnableCustomForegroundParams {
			custom := toMacroParams(regionMatAsset.CustomMacroMaterialCompositingParams)
			if regionMatAsset.EnableCustomBackgroundParams {
				material.CustomBackgroundParams = &custom
			}
			if regionMatAsset.EnableCustomForegroundParams {
				material.CustomForegroundParams = &custom
			}
		}
		for _, layer := range regionMatAsset.Layers.Element {
			layerMatFile, _ := assets.LookupFileByAsset(layer.Material)
			splatMapFile, _ := assets.LookupFileByAsset(layer.SplatMap)
			material.Layers = append(material.Layers, RegionMaterialLayer{
				Material:      layerMatFile,
				SplatMap:      splatMapFile,
				AffectedTiles: fmt.Sprintf("%d", layer.AffectedTiles),
				Priority:      int(layer.Priority),
			})
		}
		for _, mip := range regionMatAsset.PertinentLayersMipChain.Element {
			material.PertinentLayersMipChain = append(material.PertinentLayersMipChain, fmt.Sprintf("%d", mip))
		}

		return &material
	}
	return nil
}

func (dir *RegionDirectory) LoadRegionInfo(assets *game.Assets) *RegionInfo {

	region := RegionInfo{
		ID: dir.RegionName,
	}

	region.Impostors = dir.LoadImpostorsInfo(assets, WORKER_COUNT)
	region.PoiImpostors = dir.LoadPoiImpostorsInfo(assets, WORKER_COUNT)
	region.TerrainMaterial = dir.LoadRegionMaterials(assets)
	region.Tracts = dir.LoadTractNames(assets)
	_, region.HasSliceData = assets.Archive.Lookup(dir.PathSlicedataFile())

	return &region
}

type location struct {
	X int
	Y int
}

func formatRegionName(loc location) string {
	return fmt.Sprintf("r_+%02d_+%02d", loc.X, loc.Y)
}

func toMacroParams(p nwt.SerializableMacroMaterialParams) MacroMaterialParams {
	return MacroMaterialParams{
		Color:               [4]float32{float32(p.MacroColor[0]), float32(p.MacroColor[1]), float32(p.MacroColor[2]), float32(p.MacroColor[3])},
		ColorScale:          float32(p.MacroColorScale),
		GlossScale:          float32(p.MacroGlossScale),
		NormalScale:         float32(p.MacroNormalScale),
		SpecularReflectance: float32(p.MacroSpecularReflectance),
	}
}
