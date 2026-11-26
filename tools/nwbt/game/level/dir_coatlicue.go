package level

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/offlineoptions"
	"nw-buddy/tools/formats/terrain"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
	"path"
	"path/filepath"
	"slices"
	"strings"
)

type CoatlicueDirectory struct {
	Name string
}

type RegionLocList = [][2]int

func ListLevelIndex(assets *game.Assets) LevelIndex {
	return LevelIndex{
		Levels:     ListLevelEntries(assets),
		Coatlicues: ListCoatlicueEntries(assets),
	}
}

func ListCoatlicueDirectories(assets *game.Assets) []CoatlicueDirectory {

	files, _ := assets.Archive.Glob(coatlicuePath("**", "offlineoptions.json"))
	result := make([]CoatlicueDirectory, 0)
	for _, file := range files {
		// drop filename then use directory name
		// sharedassets/coatlicue/newworld_vitaeeterna/offlineoptions.json -> newworld_vitaeeterna
		name := path.Base(path.Dir(file.Path()))
		result = append(result, CoatlicueDirectory{Name: name})
	}
	return result
}

func ListCoatlicueEntries(assets *game.Assets) []CoatlicueListEntry {
	result := make([]CoatlicueListEntry, 0)
	for _, dir := range ListCoatlicueDirectories(assets) {
		level, _ := dir.FindLevelDirectory(assets)
		result = append(result, CoatlicueListEntry{
			Name:  dir.Name,
			Level: level.Name,
			Maps:  dir.LoadGameModeMaps(assets),
		})
	}
	return result
}

func coatlicuePath(paths ...string) string {
	paths = append([]string{"sharedassets", "coatlicue"}, paths...)
	return path.Join(paths...)
}
func (dir *CoatlicueDirectory) Path(paths ...string) string {
	paths = append([]string{dir.Name}, paths...)
	return coatlicuePath(paths...)
}
func (dir *CoatlicueDirectory) PathTractsJson() string {
	return dir.Path("tracts.json")
}
func (dir *CoatlicueDirectory) PathTerrainJson() string {
	return dir.Path("terrain.json")
}
func (dir *CoatlicueDirectory) PathPlayableJson() string {
	return dir.Path("playable.json")
}
func (dir *CoatlicueDirectory) PathWorldJson() string {
	return dir.Path("world.json")
}
func (dir *CoatlicueDirectory) PathOfflineOptionsJson() string {
	return dir.Path("offlineoptions.json")
}
func NewCoatlicueDirectory(name string) CoatlicueDirectory {
	return CoatlicueDirectory{Name: name}
}

func (dir *CoatlicueDirectory) FindLevelDirectory(assets *game.Assets) (LevelDirectory, bool) {
	return FindLevelDirectory(assets, dir.Name)
}

func (dir *CoatlicueDirectory) Exists(assets *game.Assets) bool {
	file, ok := assets.Archive.Lookup(dir.PathOfflineOptionsJson())
	return ok && file != nil
}

func (dir *CoatlicueDirectory) LoadTracts(assets *game.Assets) *tracts.Document {
	file, ok := assets.Archive.Lookup(dir.PathTractsJson())
	if !ok {
		return nil
	}

	doc, err := tracts.Load(file)
	if err != nil {
		slog.Error("tracts not loaded", "level", dir.Name, "error", err)
	}
	return doc
}

func (dir *CoatlicueDirectory) LoadTerrainSettings(assets *game.Assets) *terrain.Document {
	file, ok := assets.Archive.Lookup(dir.PathTerrainJson())
	if !ok {
		return nil
	}

	doc, err := terrain.Load(file)
	if err != nil {
		slog.Error("terrain.json not loaded", "level", dir.Name, "error", err)
	}
	return doc
}

func (dir *CoatlicueDirectory) LoadOfflineOptions(assets *game.Assets) *offlineoptions.Document {
	file, ok := assets.Archive.Lookup(dir.PathOfflineOptionsJson())
	if !ok {
		return nil
	}
	doc, err := offlineoptions.Load(file)
	if err != nil {
		slog.Error("offlineoptions.json not loaded", "level", dir.Name, "error", err)
	}
	return doc
}

func (dir *CoatlicueDirectory) LoadPlayableList(archive nwfs.Archive) RegionLocList {
	file, ok := archive.Lookup(dir.PathPlayableJson())
	if !ok {
		return nil
	}

	result := make(RegionLocList, 0)
	if data, err := file.Read(); err != nil {
		slog.Error("playable not loaded", "level", dir.Name, "error", err)
	} else if err := json.UnmarshalJSON(data, &result); err != nil {
		slog.Error("playable not parsed", "level", dir.Name, "error", err)
	}

	return result
}

func (dir *CoatlicueDirectory) LoadWorldList(archive nwfs.Archive) RegionLocList {
	file, ok := archive.Lookup(dir.PathWorldJson())
	if !ok {
		return nil
	}

	result := make(RegionLocList, 0)
	if data, err := file.Read(); err != nil {
		slog.Error("world not loaded", "level", dir.Name, "error", err)
	} else if err := json.UnmarshalJSON(data, &result); err != nil {
		slog.Error("world not parsed", "level", dir.Name, "error", err)
	}

	return result
}

func (dir *CoatlicueDirectory) LoadRegionList(archive nwfs.Archive) []RegionLocation {
	playable := dir.LoadPlayableList(archive)
	world := dir.LoadWorldList(archive)

	if len(world) == 0 {
		world = playable
	}
	if len(playable) == 0 {
		playable = make([][2]int, 0)
		playable = append(playable, [2]int{0, 0})
		world = append(world, [2]int{0, 0})
	}

	result := make([]RegionLocation, 0)
	for _, w := range world {
		found := slices.Contains(playable, w)
		id := formatRegionName(location{X: w[0], Y: w[1]})
		region := RegionDirectory{Coatlicue: *dir, RegionName: id}
		_, hasVegetation := archive.Lookup(region.PathVegetationmapFile())
		_, hasDistribution := archive.Lookup(region.PathDistributionFile())
		result = append(result, RegionLocation{
			ID:              id,
			Location:        w,
			Playable:        found,
			HasVegetation:   hasVegetation,
			HasDistribution: hasDistribution,
		})
	}

	return result
}

func (dir *CoatlicueDirectory) LoadGameModeMaps(assets *game.Assets) []GameModeMap {
	result := make([]GameModeMap, 0)
	file, ok := assets.Archive.Lookup("sharedassets/springboardentitites/datatables/javelindata_gamemodemaps.datasheet")

	if !ok {
		return result
	}

	sheet, err := datasheet.Load(file)
	if err != nil {
		slog.Error("javelindata_gamemodemaps.datasheet not loaded", "level", dir.Name, "error", err)
		return result
	}

	for _, row := range sheet.RowsAsJSON() {
		// e.g. coatlicue\\NW_CTF_002_Wide -> NW_CTF_002_Wide
		nameInSheet := filepath.Base(row.GetString("CoatlicueName"))
		if !strings.EqualFold(nameInSheet, dir.Name) {
			continue
		}

		result = append(result, GameModeMap{
			GameModeMapId: row.GetString("GameModeMapId"),
			GameModeId:    row.GetString("GameModeId"),
			SlicePath:     row.GetString("SlicePath"),
			CoatlicueName: row.GetString("CoatlicueName"),
			WorldBounds: strings.FieldsFunc(row.GetString("WorldBounds"), func(r rune) bool {
				return r == ','
			}),
			TeamTeleportData: row.GetString("TeamTeleportData"),
			UIMapId:          row.GetString("UIMapId"),
			SliceExclusionList: strings.FieldsFunc(row.GetString("SliceExclusionList"), func(r rune) bool {
				return r == ','
			}),
		})
	}

	return result
}

// LoadInfo loads the coatlicue and the mission of a level folder. levelName names the level folder
// (e.g. a main menu: level "nw_frontend_nighthaven" on coatlicue "nw_frontend_base"); empty uses the
// level folder with the coatlicue's name.
func (dir *CoatlicueDirectory) LoadInfo(assets *game.Assets, levelName string) *CoatlicueInfo {
	result := &CoatlicueInfo{
		Name: dir.Name,
	}
	var level LevelDirectory
	var hasLevel bool
	if levelName != "" {
		level, hasLevel = FindLevelDirectory(assets, levelName)
	} else {
		level, hasLevel = dir.FindLevelDirectory(assets)
	}
	result.Level = level.Name
	result.GameModeMaps = dir.LoadGameModeMaps(assets)
	result.Regions = dir.LoadRegionList(assets.Archive)

	settings := dir.LoadTerrainSettings(assets)
	if settings != nil {
		result.MountainHeight = settings.MountainHeight
		result.MountainRoughness = settings.MountainRoughness
		result.OceanLevel = settings.OceanLevel
		result.ValleyIntensity = settings.ValleyIntensity
	}

	options := dir.LoadOfflineOptions(assets)
	if options != nil {
		result.RegionCellSize = options.Streaming.ImpostorCellEdgeLength
		result.EnableChunks = options.Streaming.RegionChunksEnabled
		result.EnableVegetation = options.VegetationDataEnabled
		result.EnableDistribution = options.DistributionDataEnabled
	}

	result.Tracts = dir.LoadTracts(assets)
	if result.Tracts != nil {
		result.RegionSize = result.Tracts.RegionSize
	}

	if hasLevel {
		result.Mission = level.LoadMission(assets)
		result.MissionEntities = level.LoadMissionEntities(assets)
	}

	result.SkyboxSystem, result.Slices = loadSkyboxSystem(assets)

	if result.Tracts != nil && result.Tracts.TerritoryMasterSlicePath != "" {
		var slices map[string]ViewerSlice
		result.TerritorySystem, slices = loadTerritorySystem(assets, result.Tracts.TerritoryMasterSlicePath)
		if result.Slices == nil {
			result.Slices = make(map[string]ViewerSlice)
		}
		for key, slice := range slices {
			result.Slices[key] = slice
		}
	}

	return result
}

// the game spawns the territory master slice from tracts.json `territoryMasterSlicePath`, it is not referenced by level data.
// Its PrefabReferencer lists the territory, zone and POI bounds slices.
func loadTerritorySystem(assets *game.Assets, masterPath string) (*ViewerSlice, map[string]ViewerSlice) {
	file, ok := assets.Archive.Lookup(strings.ToLower(masterPath))
	if !ok || file == nil {
		slog.Warn("territory master slice not found", "file", masterPath)
		return nil, nil
	}
	refs := make([]SliceRef, 0)
	slice, err := LoadViewerSlice(assets, file, "", func(it catalog.AssetId, variant string) {
		refs = append(refs, SliceRef{Id: it, Variant: variant})
	})
	if err != nil {
		slog.Error("territory master slice not loaded", "file", masterPath, "error", err)
		return nil, nil
	}
	return &slice, LoadSliceRefClosure(assets, refs)
}

// the game spawns the skybox system for every level, it is not referenced by level data.
// It holds the default TimeOfDay POI and its skybox slice.
const skyboxSystemFile = "slices/system/skyboxsystem/skyboxsystem.dynamicslice"

func loadSkyboxSystem(assets *game.Assets) (*ViewerSlice, map[string]ViewerSlice) {
	file, ok := assets.Archive.Lookup(skyboxSystemFile)
	if !ok || file == nil {
		slog.Warn("skybox system slice not found", "file", skyboxSystemFile)
		return nil, nil
	}
	refs := make([]SliceRef, 0)
	slice, err := LoadViewerSlice(assets, file, "", func(it catalog.AssetId, variant string) {
		refs = append(refs, SliceRef{Id: it, Variant: variant})
	})
	if err != nil {
		slog.Error("skybox system slice not loaded", "file", skyboxSystemFile, "error", err)
		return nil, nil
	}
	return &slice, LoadSliceRefClosure(assets, refs)
}
