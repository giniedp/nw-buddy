package level

import (
	"log/slog"
	"nw-buddy/tools/formats/mission"
	"nw-buddy/tools/game"
	"path/filepath"
)

func ListLevels(assets *game.Assets) []*Info {
	pattern := levelsPath("**", "levelinfo.xml")
	files, _ := assets.Archive.Glob(pattern)
	result := make([]*Info, 0)
	for _, file := range files {
		result = append(result, LoadInfo(assets, filepath.Base(filepath.Dir(file.Path()))))
	}
	return result
}

func LoadInfo(assets *game.Assets, name string) *Info {
	data := LoadDefinition(assets, name)

	level := Info{
		Name:          name,
		CoatlicueName: data.CoatlicueName,
		Regions:       data.Regions,
		RegionSize:    data.Tracts.RegionSize,
	}
	if data.TerrainSettings != nil {
		level.OceanLevel = data.TerrainSettings.OceanLevel
		level.MountainHeight = data.TerrainSettings.MountainHeight
		level.GroundMaterial = data.TerrainSettings.WorldMaterialAssetPath
		level.RegionMaterials, _ = LoadMacroMaterials(assets, data.TerrainSettings)
	}
	if len(data.Maps) > 0 {
		level.Maps = make([]MapInfo, len(data.Maps))
		for i, m := range data.Maps {
			level.Maps[i] = MapInfo(m)
		}
	}

	if data.MissionFile != nil {
		if m, err := mission.Load(data.MissionFile); err != nil {
			slog.Error("mission not loaded", "level", name, "error", err)
		} else {
			level.TimeOfDay = &TimeOfDayInfo{
				Time:          m.TimeOfDay.Time,
				TimeStart:     m.TimeOfDay.TimeStart,
				TimeEnd:       m.TimeOfDay.TimeEnd,
				TimeAnimSpeed: m.TimeOfDay.TimeAnimSpeed,
			}
			for _, t := range m.TimeOfDay.Variable {
				level.TimeOfDay.Variables = append(level.TimeOfDay.Variables, TimeOfDayVariable{
					Name:  t.Name,
					Value: t.Value,
					Color: t.Color,
				})
			}
		}
	}

	return &level
}
