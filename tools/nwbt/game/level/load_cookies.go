package level

import (
	"log/slog"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/game"
	"sync"
)

type cookiesCacheEntry struct {
	once    sync.Once
	cookies []heightmap.Cookie
}

var cookiesCache sync.Map

// LoadCookies collects the terrain cookies of the region's capitals, plots and placed slices
func (dir *RegionDirectory) LoadCookies(assets *game.Assets) []heightmap.Cookie {
	value, _ := cookiesCache.LoadOrStore(dir.Coatlicue.Name+"/"+dir.RegionName, &cookiesCacheEntry{})
	entry := value.(*cookiesCacheEntry)
	entry.once.Do(func() {
		for _, layer := range dir.LoadCapitalsLayers(assets) {
			for _, capital := range layer {
				cookie := capital.Cookie
				if cookie == nil || capital.Position == nil {
					continue
				}
				entry.cookies = append(entry.cookies, heightmap.Cookie{
					X:                    capital.Position.X,
					Y:                    capital.Position.Y,
					Z:                    capital.Position.Z,
					InnerRadius:          valueOr(cookie.InnerRadius, 0),
					OuterRadius:          valueOr(cookie.OuterRadius, 0),
					MaxHeightBlend:       valueOr(cookie.MaxHeightBlend, 0),
					EdgeNoise:            valueOr(cookie.EdgeNoise, heightmap.CookieDefaultEdgeNoise),
					EdgeNoiseFeatureSize: valueOr(cookie.EdgeNoiseFeatureSize, heightmap.CookieDefaultEdgeNoiseFeatureSize),
					GroundNoiseScale:     valueOr(cookie.GroundNoiseScale, heightmap.CookieDefaultGroundNoiseScale),
				})
			}
		}
	})
	return entry.cookies
}

// LoadHeightMapWithCookies loads the region heightmap and bakes the terrain cookies of the region's capitals into it
func (dir *RegionDirectory) LoadHeightMapWithCookies(assets *game.Assets) *heightmap.Region {
	region := dir.LoadHeightMap(assets)
	if region == nil {
		return nil
	}
	settings := dir.Coatlicue.LoadTerrainSettings(assets)
	if settings == nil || settings.MountainHeight <= 0 {
		return region
	}
	if cookies := dir.LoadCookies(assets); len(cookies) > 0 {
		count := region.ApplyCookies(cookies, settings.MountainHeight)
		slog.Debug("terrain cookies applied", "level", dir.Coatlicue.Name, "region", dir.RegionName, "count", count)
	}
	return region
}

func valueOr(value *float32, fallback float32) float32 {
	if value == nil {
		return fallback
	}
	return *value
}
