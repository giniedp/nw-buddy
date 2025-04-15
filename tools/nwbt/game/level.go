package game

import (
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/formats/localmappings"
	"nw-buddy/tools/formats/mapsettings"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/maps"
	"path"
	"path/filepath"
	"sync"
)

type LevelMetadata struct {
	Name                string     `json:"name"`
	MissionEntitiesFile *nwfs.File `json:"missionEntitiesFile"`

	Tracts       tracts.Document   `json:"tracts"`
	PlayableArea [][2]int          `json:"playableArea"`
	WorldArea    [][2]int          `json:"worldArea"`
	Regions      []RegionReference `json:"regions"`
}

type RegionReference struct {
	Name     string  `json:"name"`
	Location *[2]int `json:"location"`
}

type RegionMetadata struct {
	Name          string                 `json:"name"`
	LocalMappings localmappings.Document `json:"localMappings"`
	MapSettings   mapsettings.Document   `json:"mapSettings"`
	Impostors     []impostors.Impostor   `json:"impostors"`
	PoiImpostors  []impostors.Impostor   `json:"poiImpostors"`
	Capitals      []capitals.Capital     `json:"capitals"`
	Chunks        nwfs.File              `json:"chunks"`
	Distribution  nwfs.File              `json:"distribution"`
	Heightmap     nwfs.File              `json:"heightmap"`
	Metadata      nwfs.File              `json:"metadata"`
	Slicedata     nwfs.File              `json:"slicedata"`
	Tractmap      nwfs.File              `json:"tractmap"`
}

func levelPath(name string, paths ...string) string {
	parts := append([]string{"sharedassets", "coatlicue", name}, paths...)
	return path.Join(parts...)
}

func ListLevelNames(archive nwfs.Archive) []string {
	pattern := levelPath("*", "playable.json")
	files, _ := archive.Glob(pattern)
	result := make([]string, 0)
	for _, file := range files {
		result = append(result, filepath.Base(filepath.Dir(file.Path())))
	}
	return result
}

func LoadLevelMetadata(archive nwfs.Archive, name string) LevelMetadata {
	level := LevelMetadata{Name: name}

	levelDir := levelPath(name)
	if file, ok := archive.Lookup(path.Join(levelDir, "tracts.json")); ok {
		if doc, err := tracts.Load(file); err != nil {
			slog.Error("tracts not loaded", "level", name, "error", err)
		} else {
			level.Tracts = *doc
		}
	}

	if file, ok := archive.Lookup(path.Join(levelDir, "playable.json")); ok {
		if data, err := file.Read(); err != nil {
			slog.Error("playable not loaded", "level", name, "error", err)
		} else if err := json.UnmarshalJSON(data, &level.PlayableArea); err != nil {
			slog.Error("playable not parsed", "level", name, "error", err)
		}
	}

	if file, ok := archive.Lookup(path.Join(levelDir, "world.json")); ok {
		if data, err := file.Read(); err != nil {
			slog.Error("world not loaded", "level", name, "error", err)
		} else if err := json.UnmarshalJSON(data, &level.WorldArea); err != nil {
			slog.Error("world not parsed", "level", name, "error", err)
		}
	}

	if file, ok := archive.Lookup(path.Join("levels", name, "mission0.entities_xml")); ok {
		level.MissionEntitiesFile = &file
	}

	regionsPattern := path.Join(levelDir, "regions", "*", "mapsettings.json")
	if files, err := archive.Glob(regionsPattern); err == nil {
		for _, file := range files {
			name := filepath.Base(filepath.Dir(file.Path()))
			level.Regions = append(level.Regions, RegionReference{
				Name:     name,
				Location: ParseRegionLocation(name),
			})
		}
	}
	return level
}

func LoadLevelRegion(archive nwfs.Archive, levelName, regionName string) RegionMetadata {
	regionDir := levelPath(levelName, "regions", regionName)

	region := RegionMetadata{Name: regionName}
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
				region.Capitals = append(region.Capitals, doc.Capitals...)
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
	files, _ := archive.Glob(levelPath(levelName, "regions", "**", "region.heightmap"))
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
