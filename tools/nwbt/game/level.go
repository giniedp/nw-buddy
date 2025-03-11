package game

import (
	"log/slog"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/formats/localmappings"
	"nw-buddy/tools/formats/mapsettings"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
	"path"
)

type Level struct {
	Name                string
	MissionEntitiesFile *nwfs.File

	Tracts       tracts.Document
	PlayableArea [][2]int
	WorldArea    [][2]int
}

type Region struct {
	Name          string
	LocalMappings localmappings.Document
	MapSettings   mapsettings.Document
	Impostors     *impostors.Document
	PoiImpostors  *impostors.Document
	Heightmap     nwfs.File
	Tractmap      nwfs.File
	Distribution  nwfs.File
}

func (l *Level) LoadRegions(archive nwfs.Archive) []Region {
	regions := make([]Region, len(l.Tracts.Regions))
	for i, region := range l.Tracts.Regions {
		regions[i] = l.LoadRegion(archive, region.Name)
	}
	return regions
}

func LoadLevel(archive nwfs.Archive, name string) Level {
	level := Level{Name: name}

	levelDir := path.Join("sharedassets", "coatlicue", name)
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
	return level
}

func (l *Level) LoadRegion(archive nwfs.Archive, name string) Region {
	regionDir := path.Join("sharedassets", "coatlicue", l.Name, "regions", name)

	region := Region{Name: name}
	if file, ok := archive.Lookup(path.Join(regionDir, "localmappings.json")); ok {
		if doc, err := localmappings.Load(file); err != nil {
			slog.Error("localmappings not loaded", "level", l.Name, "region", name, "error", err)
		} else {
			region.LocalMappings = *doc
		}
	}

	if file, ok := archive.Lookup(path.Join(regionDir, "mapsettings.json")); ok {
		if doc, err := mapsettings.Load(file); err != nil {
			slog.Error("mapsettings not loaded", "level", l.Name, "region", name, "error", err)
		} else {
			region.MapSettings = *doc
		}
	}

	if file, ok := archive.Lookup(path.Join(regionDir, "poi_impostors.json")); ok {
		if doc, err := impostors.Load(file); err != nil {
			slog.Error("poi_impostors not loaded", "level", l.Name, "region", name, "error", err)
		} else if doc != nil {
			region.PoiImpostors = doc
		}
	}

	if file, ok := archive.Lookup(path.Join(regionDir, "impostors.json")); ok {
		if doc, err := impostors.Load(file); err != nil {
			slog.Error("impostors not loaded", "level", l.Name, "region", name, "error", err)
		} else if doc != nil {
			region.Impostors = doc
		}
	}

	region.Heightmap, _ = archive.Lookup(path.Join(regionDir, "region.heightmap"))
	region.Tractmap, _ = archive.Lookup(path.Join(regionDir, "region.tractmap.tif"))
	region.Distribution, _ = archive.Lookup(path.Join(regionDir, "region.distribution"))
	return region
}
