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
	"nw-buddy/tools/utils"
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
	Chunks        nwfs.File
	Distribution  nwfs.File
	Heightmap     nwfs.File
	Metadata      nwfs.File
	Slicedata     nwfs.File
	Tractmap      nwfs.File
}

type CapitalLayerDefinition struct {
	Name     string
	Capitals []capitals.Capital
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

	if caps, err := archive.Glob(path.Join(regionDir, "capitals", "**.capitals.json")); err == nil {
		for _, cap := range caps {
			if doc, err := capitals.Load(cap); err == nil {
				region.Capitals = append(region.Capitals, CapitalLayerDefinition{
					Name:     strings.TrimPrefix(cap.Path(), path.Join(regionDir, "capitals")+"/"),
					Capitals: doc.Capitals,
				})
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
}

type CapitalInfo struct {
	ID        string       `json:"id"`
	Transform mat4.Data    `json:"transform"`
	Radius    float32      `json:"radius"`
	Slice     string       `json:"slice"`
	Entities  []EntityInfo `json:"entities"`
}

type EntityInfo struct {
	ID        uint        `json:"id"`
	Name      string      `json:"name"`
	File      string      `json:"file"`
	Transform mat4.Data   `json:"transform"`
	Model     string      `json:"model,omitempty"`
	Material  string      `json:"material,omitempty"`
	Instances []mat4.Data `json:"instances,omitempty"`
	Light     *LightInfo  `json:"light,omitempty"`
	Options   any         `json:"options"`
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
		uuid := utils.ExtractUUID(imp.MeshAssetID)
		file, err := assets.LookupFileByUuid(uuid)
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
		uuid := utils.ExtractUUID(imp.MeshAssetID)
		file, err := assets.LookupFileByUuid(uuid)
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

type CapitalLoader interface {
	Info() *CapitalInfo
	Entities() []EntityInfo
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
			assets:   l.assets,
			name:     name,
			info:     LoadLevelRegionInfo(l.assets, l.name, name),
			capitals: maps.NewSafeDict[CapitalLoader](),
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
	capitals     *maps.SafeDict[CapitalLoader]
	distribution *DistributionInfo
}

func (r *regionLoader) Info() *RegionInfo {
	return r.info
}

func (r *regionLoader) Entities() map[string]map[string][]EntityInfo {
	if r.info == nil {
		return nil
	}
	entities := maps.NewSafeDict[map[string][]EntityInfo]()
	for _, layer := range r.info.Capitals {
		layerEntities := maps.NewSafeDict[[]EntityInfo]()
		progress.Concurrent(10, layer.Capitals, func(cap CapitalInfo, i int) error {
			capitalLoader := r.Capital(layer.Name, cap.ID)
			if capitalLoader != nil {
				layerEntities.Store(cap.ID, capitalLoader.Entities())
			}
			return nil
		})
		entities.Store(layer.Name, layerEntities.ToMap())
	}
	return entities.ToMap()
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

func (r *regionLoader) Capital(layerName, id string) CapitalLoader {
	key := layerName + ":" + id
	capital, _ := r.capitals.LoadOrStoreFn(key, func() CapitalLoader {
		if r.info == nil {
			return nil
		}
		for _, layer := range r.info.Capitals {
			if layer.Name != layerName {
				continue
			}
			for _, capital := range layer.Capitals {
				if capital.ID != id {
					continue
				}
				return &capitalLoader{
					assets: r.assets,
					name:   id,
					info:   &capital,
				}
			}
		}
		return nil
	})
	return capital
}

type capitalLoader struct {
	assets   *Assets
	name     string
	info     *CapitalInfo
	entities []EntityInfo
}

func (c *capitalLoader) Info() *CapitalInfo {
	return c.info
}

func (c *capitalLoader) Entities() []EntityInfo {
	if c.entities != nil {
		return c.entities
	}
	c.entities = make([]EntityInfo, 0)
	info := c.Info()
	if info == nil {
		return c.entities
	}
	c.entities = LoadEntities(c.assets, info.Slice, info.Transform)
	return c.entities
}

func LoadEntities(assets *Assets, sliceFile string, rootTransform mat4.Data) []EntityInfo {
	file, ok := assets.Archive.Lookup(sliceFile)
	if !ok {
		return nil
	}

	result := make([]EntityInfo, 0)

	// if path.Ext(sliceFile) == ".dynamicslice" {
	// 	assets.WalkSliceMeta(file, func(node *MetaDataNode) {
	// 		meta := node.MetaData
	// 		if meta == nil {
	// 			return
	// 		}
	// 		for _, mesh := range meta.Meshes.Element {
	// 			transform := node.Transform
	// 			if mesh.Rootrelativetransform.Data != nil {
	// 				transform = mat4.Multiply(transform, mat4.DataFromData(mesh.Rootrelativetransform.Data))
	// 			}
	// 			transform = mat4.Multiply(rootTransform, transform)

	// 			modelFile, err := assets.LookupFileByAssetId(mesh.Meshassetid)
	// 			if err != nil {
	// 				slog.Error("model file not found", "asset", mesh.Meshassetid, "err", err)
	// 				continue
	// 			}
	// 			materialFile, _ := assets.LookupFileByAssetId(mesh.Materialoverrideassetid)

	// 			model := modelFile.Path()
	// 			material := ""
	// 			if materialFile != nil {
	// 				material = materialFile.Path()
	// 			}
	// 			model, material = assets.ResolveModelMaterialPair(model, material)

	// 			instances := make([]gltf.Mat4x4, 0)
	// 			for _, instance := range mesh.Rootrelativeinstancetransforms.Element {
	// 				instances = append(instances, math.TransformFromAzTransform(instance).ToMat4())
	// 			}
	// 			result = append(result, EntityInfo{
	// 				File:      node.File.Path(),
	// 				Transform: transform,
	// 				Model:     model,
	// 				Material:  material,
	// 				Instances: instances,
	// 			})
	// 		}
	// 	})
	// 	return result
	// }

	assets.WalkSlice(file, func(node *EntityNode) {
		transform := mat4.Multiply(rootTransform, node.Transform)
		for _, component := range node.Components {
			switch v := component.(type) {
			case nwt.LightComponent:
				config := v.LightConfiguration
				if !config.Visible {
					break
				}
				switch config.LightType {
				case 0:
					// Point light
					result = append(result, EntityInfo{
						ID:        uint(node.Entity.Id.Id),
						Name:      string(node.Entity.Name),
						File:      node.File.Path(),
						Transform: transform,
						Light: &LightInfo{
							Type:              0,
							Color:             config.Color,
							DiffuseIntensity:  float32(config.DiffuseMultiplier),
							SpecularIntensity: float32(config.SpecMultiplier),
							PointDistance:     float32(config.PointMaxDistance),
							PointAttenuation:  float32(config.PointAttenuationBulbSize),
						},
					})

				case 1: // area
				case 2: // projector
				case 3: // probe
				}
			case nwt.InstancedMeshComponent:
				meshNode := v.Instanced_mesh_render_node.BaseClass1
				if !meshNode.Visible {
					continue
				}
				modelAsset := meshNode.Static_Mesh
				modelFile, err := assets.LookupFileByAsset2(modelAsset, node.File)
				if err != nil {
					slog.Error("model file not found", "asset", modelAsset, "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := meshNode.Material_Override_Asset
				materialFile, err := assets.LookupFileByAsset2(materialAsset, node.File)
				if err != nil {
					slog.Error("material not found", "asset", materialAsset, "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}

				// TODO: instances don't show up correctly. use individual meshes as workaround
				model, material = assets.ResolveCgfAndMtl(model, material)
				for _, instance := range v.Instanced_mesh_render_node.Instance_transforms.Element {
					result = append(result, EntityInfo{
						ID:        uint(node.Entity.Id.Id),
						Name:      string(node.Entity.Name),
						File:      node.File.Path(),
						Transform: mat4.Multiply(transform, mat4.FromAzTransform(instance)),
						Model:     model,
						Material:  material,
						Options:   meshNode.Render_Options,
					})
				}

				// instances := make([]gltf.Mat4x4, 0)
				// for _, instance := range v.Instanced_mesh_render_node.Instance_transforms.Element {
				// 	transform := math.TransformFromAzTransform(instance).ToMat4()
				// 	instances = append(instances, transform)
				// }
				// result = append(result, EntityInfo{
				// 	ID:        uint(node.Entity.Id.Id),
				// 	Name:      string(node.Entity.Name),
				// 	File:      node.File.Path(),
				// 	Transform: transform,
				// 	Model:     model,
				// 	Material:  material,
				// 	Instances: instances,
				// 	Options:   meshNode.Render_Options,
				// })
			case nwt.MeshComponent:
				meshNode := v.Static_Mesh_Render_Node
				if !meshNode.Visible {
					continue
				}
				modelAsset := meshNode.Static_Mesh
				modelFile, err := assets.LookupFileByAsset2(modelAsset, node.File)
				if err != nil {
					slog.Error("model file not found", "asset", modelAsset, "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := meshNode.Material_Override_Asset
				materialFile, err := assets.LookupFileByAsset2(materialAsset, node.File)
				if err != nil {
					slog.Error("material not found", "asset", materialAsset, "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}
				model, material = assets.ResolveCgfAndMtl(model, material)
				result = append(result, EntityInfo{
					ID:   uint(node.Entity.Id.Id),
					Name: string(node.Entity.Name),
					File: node.File.Path(),
					// TODO: this is weird, but it moves some "wrong" nodes out of the way, but keeps others correctly in place
					//Transform: mat4.Multiply(FindTransformMat4(FindAncestorWithPositionInTheWorld(node.Slice, node.Entity)), transform),
					Transform: transform,
					Model:     model,
					Material:  material,
					Options:   meshNode.Render_Options,
				})
			case nwt.SpawnerComponent:
				facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.SpawnerComponentServerFacet)
				if !ok {
					break
				}
				if !node.WalkAsset(facet.M_aliasAsset) {
					node.WalkAsset(facet.M_sliceAsset)
				}
			case nwt.PrefabSpawnerComponent:
				if !node.WalkAsset(v.M_aliasAsset) {
					node.WalkAsset(v.M_sliceAsset)
				}
			case nwt.PointSpawnerComponent:
				if !node.WalkAsset(v.BaseClass1.M_aliasAsset) {
					node.WalkAsset(v.BaseClass1.M_sliceAsset)
				}
			case nwt.EncounterComponent:
				tmpTm := node.Transform
				for _, tl := range v.M_spawntimeline.Element {
					for _, loc := range tl.M_spawnlocations.Element {
						locEnt := FindEntityById(node.Slice, loc.EntityId.Id)
						if locEnt == nil {
							continue
						}
						node.Transform = mat4.Multiply(tmpTm, FindTransformMat4(locEnt))
						if !node.WalkAsset(tl.M_aliasAsset) {
							node.WalkAsset(tl.M_sliceAsset)
						}
					}
				}
				node.Transform = tmpTm
			case nwt.AreaSpawnerComponent:
				facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
				if !ok {
					break
				}
				tmpTm := node.Transform
				for _, loc := range facet.M_locations.Element {
					entity := FindEntityById(node.Slice, loc.EntityId.Id)
					if entity == nil {
						continue
					}
					node.Transform = mat4.Multiply(tmpTm, FindTransformMat4(entity))
					if !node.WalkAsset(facet.M_aliasAsset) {
						node.WalkAsset(facet.M_sliceAsset)
					}
				}
				node.Transform = tmpTm
			default:
				break
			}
		}
	})
	return result
}
