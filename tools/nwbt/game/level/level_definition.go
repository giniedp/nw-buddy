package level

import (
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/terrain"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

func levelsPath(name string, paths ...string) string {
	parts := append([]string{"levels", name}, paths...)
	return path.Join(parts...)
}

func coatlicuePath(name string, paths ...string) string {
	parts := append([]string{"sharedassets", "coatlicue", name}, paths...)
	return path.Join(parts...)
}

func LoadDefinition(archive nwfs.Archive, name string) Definition {
	level := Definition{Name: name}

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
			Location: game.ParseRegionLocation(name),
		})
	}

	if file, ok := archive.Lookup(path.Join(levelDir, "mission0.entities_xml")); ok {
		level.MissionEntitiesFile = file
	}
	if file, ok := archive.Lookup(path.Join(levelDir, "mission_mission0.xml")); ok {
		level.MissionFile = file
	}
	if file, ok := archive.Lookup("sharedassets/springboardentitites/datatables/javelindata_gamemodemaps.datasheet"); ok {
		if sheet, err := datasheet.Load(file); err != nil {
			slog.Error("javelindata_gamemodemaps.datasheet not loaded", "level", name, "error", err)
		} else {
			for _, row := range sheet.RowsAsJSON() {
				name := strings.ToLower(row.GetString("CoatlicueName"))
				doesMatch := strings.HasSuffix(name, level.Name)
				if !doesMatch {
					continue
				}
				level.Maps = append(level.Maps, MapDefinition{
					GameModeMapId:    row.GetString("GameModeMapId"),
					GameModeId:       row.GetString("GameModeId"),
					SlicePath:        row.GetString("SlicePath"),
					CoatlicueName:    row.GetString("CoatlicueName"),
					WorldBounds:      row.GetString("WorldBounds"),
					TeamTeleportData: row.GetString("TeamTeleportData"),
				})
			}
		}
	}
	return level
}
