package level

import (
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/formats/localmappings"
	"nw-buddy/tools/formats/mapsettings"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"path"
	"strings"
)

func LoadRegionDefinition(archive nwfs.Archive, levelName, regionName string) RegionDefinition {
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
				obj, _ := game.LoadObjectStream(chunkFile)
				if chunks, ok := obj.(nwt.GridGenericAsset_AssetData__); ok {
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
