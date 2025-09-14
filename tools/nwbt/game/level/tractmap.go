package level

import (
	"image"
	"image/color"
	"log/slog"
	"nw-buddy/tools/formats/tiff"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/img"
	"nw-buddy/tools/utils/math"
)

func TractColorToCategoryMap(info *Info) map[tracts.Color]string {
	result := make(map[tracts.Color]string)
	for _, tract := range info.Tracts {
		result[tract.DisplayColor] = tract.MapCategory
	}
	return result
}

func LoadTractmap(archive nwfs.Archive, info *Info) *img.TiledImage {
	tilesX := 0
	tilesY := 0
	files := make(map[string]image.Image)
	size := 0
	var model color.Model

	for _, r := range info.Regions {
		if r.Location == nil {
			continue
		}
		tilesX = max(tilesX, r.Location[0]+1)
		tilesY = max(tilesY, r.Location[1]+1)
		filePath := coatlicuePath(info.Name, "regions", r.ID, "region.tractmap.tif")
		file, ok := archive.Lookup(filePath)
		if !ok {
			slog.Warn("tractmap not found", "file", filePath)
			continue
		}
		data, err := file.Read()
		if err != nil {
			slog.Error("failed to read tractmap", "file", file.Path(), "err", err)
			continue
		}
		img, err := tiff.Decode(data)
		if err != nil {
			slog.Error("failed to decode tractmap", "file", file.Path(), "err", err)
			continue
		}
		files[r.ID] = img
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
	}

	tilesX = math.NextPowerOf2(tilesX)
	tilesY = math.NextPowerOf2(tilesY)
	result := img.New(size, tilesX, tilesY, model)
	for _, r := range info.Regions {
		x := r.Location[0]
		y := tilesY - r.Location[1] - 1
		result.Rows[y][x] = files[r.ID]
	}

	return result
}
