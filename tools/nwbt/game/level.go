package game

import (
	"fmt"
	"log/slog"

	m "math"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/formats/localmappings"
	"nw-buddy/tools/formats/mapsettings"
	"nw-buddy/tools/formats/terrain"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
)

const (
	SegmentSize = 128
)

type LevelDefinition struct {
	Name                string
	CoatlicueName       string
	MissionEntitiesFile nwfs.File

	Tracts          tracts.Document
	PlayableArea    [][2]int
	WorldArea       [][2]int
	Regions         []RegionReference
	TerrainSettings *terrain.Document
}

type RegionDefinition struct {
	Name          string
	LocalMappings localmappings.Document
	MapSettings   mapsettings.Document
	Impostors     []impostors.Impostor
	PoiImpostors  []impostors.Impostor
	Capitals      []CapitalLayerDefinition

	Chunks       nwfs.File
	Distribution nwfs.File
	Heightmap    nwfs.File
	Metadata     nwfs.File
	Slicedata    nwfs.File
	Tractmap     nwfs.File
}

type CapitalLayerDefinition struct {
	Name     string
	Capitals []capitals.Capital
	Chunks   []nwt.ChunkEntry
}

func levelsPath(name string, paths ...string) string {
	parts := append([]string{"levels", name}, paths...)
	return path.Join(parts...)
}

func coatlicuePath(name string, paths ...string) string {
	parts := append([]string{"sharedassets", "coatlicue", name}, paths...)
	return path.Join(parts...)
}

func ListLevelNames(archive nwfs.Archive) []string {
	pattern := levelsPath("**", "levelinfo.xml")
	files, _ := archive.Glob(pattern)
	result := make([]string, 0)
	for _, file := range files {
		result = append(result, filepath.Base(filepath.Dir(file.Path())))
	}
	return result
}

func LoadLevelDefinition(archive nwfs.Archive, name string) LevelDefinition {
	level := LevelDefinition{Name: name}

	levelDir := levelsPath(name)
	coatlicueName := name

	if file, ok := archive.Lookup(path.Join(levelDir, "resourcelist.txt")); ok {
		if content, err := file.Read(); err != nil {
			slog.Error("resourcelist not loaded", "level", name, "error", err)
		} else if match := regexp.MustCompile(`/sharedassets/coatlicue/([0-9a-zA-Z_\-]+)/`).FindStringSubmatch(string(content)); len(match) > 1 {
			coatlicueName = match[1]
		}
	}

	level.CoatlicueName = coatlicueName
	coatlicueDir := coatlicuePath(coatlicueName)
	templateDir := coatlicuePath("templateworld")

	tractsFile, _ := archive.Lookup(path.Join(coatlicueDir, "tracts.json"))
	if tractsFile == nil {
		tractsFile, _ = archive.Lookup(path.Join(templateDir, "tracts.json"))
	}
	if tractsFile != nil {
		if doc, err := tracts.Load(tractsFile); err != nil {
			slog.Error("tracts not loaded", "level", name, "error", err)
		} else {
			level.Tracts = *doc
		}
	}

	terrainFile, _ := archive.Lookup(path.Join(coatlicueDir, "terrain.json"))
	if terrainFile == nil {
		terrainFile, _ = archive.Lookup(path.Join(templateDir, "terrain.json"))
	}
	if terrainFile != nil {
		if doc, err := terrain.Load(terrainFile); err != nil {
			slog.Error("terrain settings not loaded", "level", name, "error", err)
		} else {
			level.TerrainSettings = doc
		}
	}

	playableFile, _ := archive.Lookup(path.Join(coatlicueDir, "playable.json"))
	if playableFile == nil {
		playableFile, _ = archive.Lookup(path.Join(templateDir, "playable.json"))
	}
	if playableFile != nil {
		if data, err := playableFile.Read(); err != nil {
			slog.Error("playable not loaded", "level", name, "error", err)
		} else if err := json.UnmarshalJSON(data, &level.PlayableArea); err != nil {
			slog.Error("playable not parsed", "level", name, "error", err)
		}
	}

	if file, ok := archive.Lookup(path.Join(coatlicueDir, "world.json")); ok {
		if data, err := file.Read(); err != nil {
			slog.Error("world not loaded", "level", name, "error", err)
		} else if err := json.UnmarshalJSON(data, &level.WorldArea); err != nil {
			slog.Error("world not parsed", "level", name, "error", err)
		}
	}
	if level.WorldArea == nil {
		// world.json has no fallback in template world
		// use playable.json as fallback
		level.WorldArea = level.PlayableArea
	}

	regionFiles, _ := archive.Glob(path.Join(coatlicueDir, "regions", "*", "mapsettings.json"))
	if len(regionFiles) == 0 {
		regionFiles, _ = archive.Glob(path.Join(templateDir, "regions", "*", "mapsettings.json"))
	}
	for _, file := range regionFiles {
		name := filepath.Base(filepath.Dir(file.Path()))
		level.Regions = append(level.Regions, RegionReference{
			ID:       name,
			Location: ParseRegionLocation(name),
		})
	}

	if file, ok := archive.Lookup(path.Join(levelDir, "mission0.entities_xml")); ok {
		level.MissionEntitiesFile = file
	}

	return level
}

func LoadLevelRegionDefinition(archive nwfs.Archive, levelName, regionName string) RegionDefinition {
	regionDir := coatlicuePath(levelName, "regions", regionName)

	region := RegionDefinition{Name: regionName}
	if file, ok := archive.Lookup(path.Join(regionDir, "localmappings.json")); ok {
		if doc, err := localmappings.Load(file); err != nil {
			slog.Error("localmappings not loaded", "level", levelName, "region", regionName, "error", err)
		} else {
			region.LocalMappings = *doc
		}
	}

	if file, ok := archive.Lookup(path.Join(regionDir, "mapsettings.json")); ok {
		if doc, err := mapsettings.Load(file); err != nil {
			slog.Error("mapsettings not loaded", "level", levelName, "region", regionName, "error", err)
		} else {
			region.MapSettings = *doc
		}
	}

	if file, ok := archive.Lookup(path.Join(regionDir, "poi_impostors.json")); ok {
		if doc, err := impostors.Load(file); err != nil {
			slog.Error("poi_impostors not loaded", "level", levelName, "region", regionName, "error", err)
		} else if doc != nil {
			region.PoiImpostors = doc.Impostors
		}
	}

	if file, ok := archive.Lookup(path.Join(regionDir, "impostors.json")); ok {
		if doc, err := impostors.Load(file); err != nil {
			slog.Error("impostors not loaded", "level", levelName, "region", regionName, "error", err)
		} else if doc != nil {
			region.Impostors = doc.Impostors
		}
	}

	if files, err := archive.Glob(path.Join(regionDir, "capitals", "**.capitals.json")); err == nil {
		prefix := path.Join(regionDir, "capitals") + "/"
		for _, file := range files {
			relative := strings.TrimPrefix(file.Path(), prefix)
			layer := CapitalLayerDefinition{
				Name: path.Dir(relative),
			}
			if doc, err := capitals.Load(file); err == nil {
				layer.Capitals = doc.Capitals
			}

			if chunkFile, ok := archive.Lookup(strings.TrimSuffix(file.Path(), ".capitals.json") + ".chunks"); ok {
				obj, _ := LoadObjectStream(chunkFile)
				if chunks, ok := obj.(nwt.UUID_AC608BE6_77F3_5AF5_A7A9_607621389D91); ok {
					layer.Chunks = chunks.Chunks.Element
				}
			}

			if len(layer.Capitals) > 0 || len(layer.Chunks) > 0 {
				region.Capitals = append(region.Capitals, layer)
			}
		}
	}

	region.Chunks, _ = archive.Lookup(path.Join(regionDir, "region.chunks"))
	region.Distribution, _ = archive.Lookup(path.Join(regionDir, "region.distribution"))
	region.Heightmap, _ = archive.Lookup(path.Join(regionDir, "region.heightmap"))
	region.Metadata, _ = archive.Lookup(path.Join(regionDir, "region.metadata"))
	region.Slicedata, _ = archive.Lookup(path.Join(regionDir, "region.slicedata"))
	region.Tractmap, _ = archive.Lookup(path.Join(regionDir, "region.tractmap.tif"))
	return region
}

func LoadLevelTerrain(archive nwfs.Archive, levelName string) *heightmap.Terrain {
	files, _ := archive.Glob(coatlicuePath(levelName, "regions", "**", "region.heightmap"))
	regions := maps.NewSafeSet[*heightmap.Region]()
	wGroup := sync.WaitGroup{}
	wInput := make(chan int)

	for range len(files) {
		go func() {
			for index := range wInput {
				file := files[index]
				region, err := heightmap.LoadRegion(file)
				if err != nil {
					slog.Error("heightmap not loaded", "level", levelName, "region", file.Path(), "error", err)
					continue
				}
				regions.Store(&region)
				wGroup.Done()
			}
		}()
	}

	for i := range files {
		wGroup.Add(1)
		wInput <- i
	}
	wGroup.Wait()

	return heightmap.NewTerrain(regions.Values())
}

type LevelInfo struct {
	Name           string            `json:"name"`
	CoatlicueName  string            `json:"coatlicueName"`
	OceanLevel     float32           `json:"oceanLevel"`
	MountainHeight float32           `json:"mountainHeight"`
	GroundMaterial string            `json:"groundMaterial"`
	RegionSize     int               `json:"regionSize"`
	Regions        []RegionReference `json:"regions"`
}

type RegionReference struct {
	ID       string  `json:"name"`
	Location *[2]int `json:"location"`
}

type RegionInfo struct {
	Name           string             `json:"name"`
	Size           int                `json:"size"`
	CellResolution int                `json:"cellResolution"`
	SegmentSize    int                `json:"segmentSize"`
	Segments       []SegmentReference `json:"segments"`
	Capitals       []CapitalLayerInfo `json:"capitals"`
	PoiImpostors   []ImpostorInfo     `json:"poiImpostors"`
	Impostors      []ImpostorInfo     `json:"impostors"`
	Distribution   string             `json:"distribution"`
}
type SegmentReference struct {
	ID       int     `json:"id"`
	Location *[2]int `json:"location"`
}

type ImpostorInfo struct {
	Position [2]float64 `json:"position"`
	Model    string     `json:"model"`
}

type CapitalLayerInfo struct {
	Name     string        `json:"name"`
	Capitals []CapitalInfo `json:"capitals"`
	Chunks   []ChunkInfo   `json:"chunks"`
}

type CapitalInfo struct {
	ID        string    `json:"id"`
	Transform mat4.Data `json:"transform"`
	Radius    float32   `json:"radius"`
	Slice     string    `json:"slice"`
}

type ChunkInfo struct {
	ID        string    `json:"id"`
	Transform mat4.Data `json:"transform"`
	Size      float32   `json:"size"`
	Slice     string    `json:"slice"`
}

type EntityInfo struct {
	ID              uint            `json:"id"`
	Name            string          `json:"name"`
	File            string          `json:"file"`
	Transform       mat4.Data       `json:"transform"`
	Model           string          `json:"model,omitempty"`
	Material        string          `json:"material,omitempty"`
	Instances       []mat4.Data     `json:"instances,omitempty"`
	Light           *LightInfo      `json:"light,omitempty"`
	Vital           *VitalSpawnInfo `json:"vital,omitempty"`
	Encounter       *EncounterInfo  `json:"encounter,omitempty"`
	MaxViewDistance float32         `json:"maxViewDistance,omitempty,omitzero"`
	Options         any             `json:"options"`
}

type VitalSpawnInfo struct {
	VitalsID   string `json:"vitalsId"`
	CategoryID string `json:"categoryId"`
	Level      int    `json:"level"`
}

type EncounterInfo struct {
	Name   string   `json:"name"`
	Stages []string `json:"stages"`
}

type LightInfo struct {
	Type              uint             `json:"type"`
	Color             [4]nwt.AzFloat32 `json:"color"`
	DiffuseIntensity  float32          `json:"diffuseIntensity"`
	SpecularIntensity float32          `json:"specularIntensity"`
	PointDistance     float32          `json:"pointDistance"`
	PointAttenuation  float32          `json:"pointAttenuation"`
}

type TerrainInfo struct {
	Level          string  `json:"level"`
	TileSize       int     `json:"tileSize"`
	MipCount       int     `json:"mipCount"`
	Width          int     `json:"width"`
	Height         int     `json:"height"`
	RegionsX       int     `json:"regionsX"`
	RegionsY       int     `json:"regionsY"`
	RegionSize     int     `json:"regionSize"`
	OceanLevel     float32 `json:"oceanLevel"`
	MountainHeight float32 `json:"mountainHeight"`
	GroundMaterial string  `json:"groundMaterial"`
}

type DistributionInfo struct {
	Slices   map[string][]EntityInfo        `json:"slices"`
	Segments map[string][]DistributionSlice `json:"segments"`
}

type DistributionSlice struct {
	Slice     string       `json:"slice"`
	Positions [][2]float32 `json:"positions"`
}

func LoadLevelInfo(assets *Assets, name string) *LevelInfo {
	meta := LoadLevelDefinition(assets.Archive, name)

	level := LevelInfo{
		Name:          name,
		CoatlicueName: meta.CoatlicueName,
		Regions:       meta.Regions,
		RegionSize:    meta.Tracts.RegionSize,
	}
	if meta.TerrainSettings != nil {
		level.OceanLevel = meta.TerrainSettings.OceanLevel
		level.MountainHeight = meta.TerrainSettings.MountainHeight
		level.GroundMaterial = meta.TerrainSettings.WorldMaterialAssetPath
	}

	return &level
}

func LoadLevelRegionInfo(assets *Assets, levelName string, regionName string) *RegionInfo {
	workerCount := uint(10)

	meta := LoadLevelRegionDefinition(assets.Archive, levelName, regionName)

	region := RegionInfo{}
	region.Name = regionName
	region.Size = meta.MapSettings.RegionSize
	region.CellResolution = meta.MapSettings.CellResolution
	region.SegmentSize = SegmentSize
	if meta.Distribution != nil {
		region.Distribution = meta.Distribution.Path()
	}

	region.PoiImpostors = make([]ImpostorInfo, len(meta.PoiImpostors))
	progress.Concurrent(workerCount, meta.PoiImpostors, func(imp impostors.Impostor, i int) error {
		file, err := assets.LookupFileByAssetIdRef(imp.MeshAssetID)
		if err != nil {
			slog.Error("impostor not loaded", "level", levelName, "region", regionName, "error", err)
		}
		if file != nil {
			region.PoiImpostors[i] = ImpostorInfo{
				Position: [2]float64{imp.WorldPosition.X, imp.WorldPosition.Y},
				Model:    file.Path(),
			}
		}
		return nil
	})

	region.Impostors = make([]ImpostorInfo, len(meta.Impostors))
	progress.Concurrent(workerCount, meta.Impostors, func(imp impostors.Impostor, i int) error {
		file, err := assets.LookupFileByAssetIdRef(imp.MeshAssetID)
		if err != nil {
			slog.Error("impostor not loaded", "level", levelName, "region", regionName, "error", err)
		}
		if file != nil {
			region.Impostors[i] = ImpostorInfo{
				Position: [2]float64{imp.WorldPosition.X, imp.WorldPosition.Y},
				Model:    file.Path(),
			}
		}
		return nil
	})

	region.Segments = make([]SegmentReference, 0)
	segmentStride := region.Size / region.SegmentSize
	for y := range segmentStride {
		for x := range segmentStride {
			i := y*(segmentStride) + x
			region.Segments = append(region.Segments, SegmentReference{
				ID:       i,
				Location: &[2]int{x, y},
			})
		}
	}

	region.Capitals = make([]CapitalLayerInfo, 0)

	for _, layer := range meta.Capitals {
		layerInfo := CapitalLayerInfo{
			Name:     layer.Name,
			Capitals: make([]CapitalInfo, len(layer.Capitals)),
			Chunks:   make([]ChunkInfo, len(layer.Chunks)),
		}

		progress.Concurrent(workerCount, layer.Capitals, func(cap capitals.Capital, i int) error {
			file := assets.ResolveDynamicSliceByName(cap.SliceName)
			result := CapitalInfo{
				ID:        cap.ID,
				Transform: cap.Transform().ToMat4(),
			}
			if cap.Footprint != nil {
				result.Radius = cap.Footprint.Radius
			} else {
				result.Radius = 1.0
			}
			if file != nil {
				result.Slice = file.Path()
			}
			layerInfo.Capitals[i] = result
			return nil
		})

		progress.Concurrent(workerCount, layer.Chunks, func(chunk nwt.ChunkEntry, i int) error {
			file, _ := assets.LookupFileByAssetId(chunk.Assetid)
			result := ChunkInfo{
				ID:   fmt.Sprintf("%d_%d_%d", chunk.Cellindex.X, chunk.Cellindex.Y, chunk.Cellindex.Z),
				Size: float32(chunk.Size),
				Transform: mat4.FromAzTransformData([]nwt.AzFloat32{
					// rotation
					0, 0, 0, 1,
					// scale
					1, 1, 1,
					// translation
					chunk.Worldposition[0],
					chunk.Worldposition[1],
					chunk.Worldposition[2],
				}),
			}
			if file != nil {
				result.Slice = file.Path()
			}
			layerInfo.Chunks[i] = result
			return nil
		})

		region.Capitals = append(region.Capitals, layerInfo)
	}

	return &region
}

type LevelCollection interface {
	Level(name string) LevelLoader
}

type LevelLoader interface {
	Info() *LevelInfo
	MissionEntities() []EntityInfo
	Region(name string) RegionLoader
	Terrain() *heightmap.Mipmaps
	TerrainInfo() *TerrainInfo
}

type RegionLoader interface {
	Info() *RegionInfo
	Entities() map[string]map[string][]EntityInfo
	Distribution() *DistributionInfo
}

type levelCollection struct {
	assets *Assets
	levels *maps.SafeDict[LevelLoader]
}

func NewLevelCollection(assets *Assets) LevelCollection {
	return &levelCollection{
		assets: assets,
		levels: maps.NewSafeDict[LevelLoader](),
	}
}

func (c *levelCollection) Level(name string) LevelLoader {
	loader, _ := c.levels.LoadOrStoreFn(name, func() LevelLoader {
		return NewLevelLoader(c.assets, name)
	})
	return loader
}

type levelLoader struct {
	assets          *Assets
	name            string
	info            *LevelInfo
	regions         *maps.SafeDict[RegionLoader]
	terrain         *heightmap.Mipmaps
	terrainInfo     *TerrainInfo
	missionEntities []EntityInfo
}

func NewLevelLoader(assets *Assets, name string) LevelLoader {
	info := LoadLevelInfo(assets, name)
	if info == nil {
		return nil
	}
	return &levelLoader{
		assets:  assets,
		name:    name,
		info:    info,
		regions: maps.NewSafeDict[RegionLoader](),
		terrain: nil,
	}
}

func (l *levelLoader) Info() *LevelInfo {
	return l.info
}

func (l *levelLoader) Region(name string) RegionLoader {
	region, _ := l.regions.LoadOrStoreFn(name, func() RegionLoader {
		return &regionLoader{
			assets: l.assets,
			name:   name,
			info:   LoadLevelRegionInfo(l.assets, l.name, name),
		}
	})
	return region
}

func (l *levelLoader) Terrain() *heightmap.Mipmaps {
	if l.terrain == nil {
		terrain := LoadLevelTerrain(l.assets.Archive, l.Info().CoatlicueName)
		mipmaps := terrain.MipmapsDefaultSize()
		l.terrain = &mipmaps
	}
	return l.terrain
}

func (l *levelLoader) TerrainInfo() *TerrainInfo {
	if l.terrainInfo != nil {
		return l.terrainInfo
	}
	terrain := l.Terrain()
	l.terrainInfo = &TerrainInfo{
		Level:          l.name,
		TileSize:       terrain.TileSize,
		MipCount:       len(terrain.Levels),
		Width:          terrain.Levels[0].Width,
		Height:         terrain.Levels[0].Height,
		RegionsX:       terrain.Levels[0].RegionsX,
		RegionsY:       terrain.Levels[0].RegionsY,
		RegionSize:     terrain.Levels[0].RegionSize,
		OceanLevel:     l.info.OceanLevel,
		MountainHeight: l.info.MountainHeight,
		GroundMaterial: l.info.GroundMaterial,
	}
	return l.terrainInfo
}

func (l *levelLoader) MissionEntities() []EntityInfo {
	if l.missionEntities != nil {
		return l.missionEntities
	}
	l.missionEntities = make([]EntityInfo, 0)

	definition := LoadLevelDefinition(l.assets.Archive, l.name)
	if definition.MissionEntitiesFile == nil {
		return l.missionEntities
	}
	l.missionEntities = LoadEntities(l.assets, definition.MissionEntitiesFile.Path(), mat4.Identity())
	return l.missionEntities
}

type regionLoader struct {
	assets       *Assets
	name         string
	info         *RegionInfo
	distribution *DistributionInfo
	entities     map[string]map[string][]EntityInfo
}

func (r *regionLoader) Info() *RegionInfo {
	return r.info
}

func (r *regionLoader) Entities() map[string]map[string][]EntityInfo {
	if r.info == nil {
		return nil
	}
	if r.entities != nil {
		return r.entities
	}
	result := maps.NewSafeDict[map[string][]EntityInfo]()
	for _, layer := range r.info.Capitals {
		entities := maps.NewSafeDict[[]EntityInfo]()
		progress.Concurrent(10, layer.Capitals, func(it CapitalInfo, i int) error {
			items := LoadEntities(r.assets, it.Slice, it.Transform)
			if len(items) > 0 {
				entities.Store(it.ID, LoadEntities(r.assets, it.Slice, it.Transform))
			}
			return nil
		})
		progress.Concurrent(10, layer.Chunks, func(it ChunkInfo, i int) error {
			items := LoadEntities(r.assets, it.Slice, it.Transform)
			if len(items) > 0 {
				entities.Store(it.ID, LoadEntities(r.assets, it.Slice, it.Transform))
			}
			return nil
		})
		if entities.Len() > 0 {
			result.Store(layer.Name, entities.ToMap())
		}
	}
	r.entities = result.ToMap()
	return r.entities
}

func (r *regionLoader) Distribution() *DistributionInfo {
	if r.distribution != nil {
		return r.distribution
	}
	if r.Info().Distribution == "" {
		return nil
	}
	file, ok := r.assets.Archive.Lookup(r.Info().Distribution)
	if !ok {
		return nil
	}
	doc, err := distribution.Load(file)
	if err != nil {
		slog.Error("distribution not loaded", "file", file.Path(), "error", err)
		return nil
	}

	slices := maps.NewSafeDict[[]EntityInfo]()
	segments := maps.NewSafeDict[map[string]DistributionSlice]()

	progress.Concurrent(10, doc.Positions, func(position [2]uint16, i int) error {
		index := doc.Indices[i]
		sliceName := doc.Slices[index]

		slices.LoadOrStoreFn(sliceName, func() []EntityInfo {
			sliceFile := r.assets.ResolveDynamicSliceByName(sliceName)
			if sliceFile == nil {
				return nil
			}
			return LoadEntities(r.assets, sliceFile.Path(), mat4.Identity())
		})

		worldX, worldY, localX, localY := distribution.ConvertPosition(doc.Region, position)
		segmentX := int(m.Floor(float64(localX) / 128))
		segmentY := int(m.Floor(float64(localY) / 128))

		key := fmt.Sprintf("%d_%d", segmentX, segmentY)

		segments.Write(func() {
			bucket, _ := segments.LoadOrStoreFn(key, func() map[string]DistributionSlice {
				return make(map[string]DistributionSlice)
			})
			slice, ok := bucket[sliceName]
			if !ok {
				slice = DistributionSlice{
					Slice:     sliceName,
					Positions: make([][2]float32, 0),
				}
			}
			slice.Positions = append(slice.Positions, [2]float32{float32(worldX), float32(worldY)})
			bucket[sliceName] = slice
		})

		return nil
	})

	r.distribution = &DistributionInfo{
		Slices:   slices.ToMap(),
		Segments: make(map[string][]DistributionSlice),
	}

	return r.distribution
}
