package level

import (
	"image"
	"image/color"
	"log/slog"
	"nw-buddy/tools/formats/tiff"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/img"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/progress"
)

func TractColorToCategoryMap(info *Info) map[tracts.Color]string {
	result := make(map[tracts.Color]string)
	for _, tract := range info.Tracts {
		result[tract.DisplayColor] = tract.MapCategory
	}
	return result
}

// LoadTractmap loads all region.tractmap.tif files into a virtual image
// Ensures that the resulting img.TiledImage has power of 2 number of
// tiles for each dimension
func LoadTractmap(archive nwfs.Archive, info *Info) *img.TiledImage {
	regionsX := 0
	regionsY := 0
	files := maps.NewSyncMap[string, image.Image]()
	size := 0
	var model color.Model

	progress.Concurrent(4, info.Regions, func(r RegionReference, index int) error {
		if r.Location == nil {
			return nil
		}
		regionsX = max(regionsX, r.Location[0]+1)
		regionsY = max(regionsY, r.Location[1]+1)
		filePath := coatlicuePath(info.Name, "regions", r.ID, "region.tractmap.tif")
		file, ok := archive.Lookup(filePath)
		if !ok {
			// some regions just don't have it (frontend level)
			// slog.Warn("tractmap not found", "file", filePath)
			return nil
		}
		data, err := file.Read()
		if err != nil {
			slog.Error("failed to read tractmap", "file", file.Path(), "err", err)
			return nil
		}
		img, err := tiff.Decode(data)
		if err != nil {
			slog.Error("failed to decode tractmap", "file", file.Path(), "err", err)
			return nil
		}
		files.Store(r.ID, img)

		width := img.Bounds().Max.X
		// height := img.Bounds().Max.Y
		if size == 0 {
			size = width
		}
		if size != width {
			slog.Warn("inconsistent tractmap tile size", "expected", size, "was", width)
			// never happens, but if, we might resize the image here
		}
		if model == nil {
			model = img.ColorModel()
		}
		return nil
	})

	regionsX = math.NextPowerOf2(regionsX)
	regionsY = math.NextPowerOf2(regionsY)
	result := img.New(size, regionsX, regionsY, model)
	for _, r := range info.Regions {
		x := r.Location[0]
		y := regionsY - r.Location[1] - 1
		result.Rows[y][x] = files.Get(r.ID)
	}

	return result
}
