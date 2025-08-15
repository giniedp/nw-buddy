package level

import (
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math/mat4"
)

func (c *collectionLoader) Level(name string) Loader {
	loader, _ := c.levels.LoadOrStoreFn(name, func() Loader {
		return NewLevelLoader(c.assets, name)
	})
	return loader
}

type levelLoader struct {
	assets          *game.Assets
	name            string
	info            *Info
	regions         *maps.SafeDict[RegionLoader]
	terrain         *heightmap.Mipmaps
	terrainInfo     *TerrainInfo
	missionEntities []EntityInfo
}

func NewLevelLoader(assets *game.Assets, name string) Loader {
	info := LoadInfo(assets, name)
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

func (l *levelLoader) Info() *Info {
	return l.info
}

func (l *levelLoader) Region(name string) RegionLoader {
	region, _ := l.regions.LoadOrStoreFn(name, func() RegionLoader {
		return &regionLoader{
			assets: l.assets,
			name:   name,
			info:   LoadRegionInfo(l.assets, l.name, name),
		}
	})
	return region
}

func (l *levelLoader) Terrain() *heightmap.Mipmaps {
	if l.terrain == nil {
		terrain := LoadTerrain(l.assets.Archive, l.Info().CoatlicueName)
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

	definition := LoadDefinition(l.assets, l.name)
	if definition.MissionEntitiesFile == nil {
		return l.missionEntities
	}
	l.missionEntities = LoadEntities(l.assets, definition.MissionEntitiesFile.Path(), mat4.Identity())
	for i := range l.missionEntities {
		l.missionEntities[i].Layer = "Mission"
	}
	return l.missionEntities
}
