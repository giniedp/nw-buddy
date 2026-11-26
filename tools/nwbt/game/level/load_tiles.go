package level

import (
	"image"
	"image/color"
	"log/slog"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/formats/tiff"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/img"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/progress"
)

func (dir *CoatlicueDirectory) LoadHeightmapTiles(archive nwfs.Archive) *img.TiledImage {
	tilesX := 0
	tilesY := 0
	files := maps.NewSyncMap[string, image.Image]()
	size := 0
	var model color.Model

	regions := dir.LoadRegionList(archive)
	progress.Concurrent(4, regions, func(r RegionLocation, index int) error {
		regDir := NewRegionDirectory(dir.Name, r.ID)

		tilesX = max(tilesX, r.Location[0]+1)
		tilesY = max(tilesY, r.Location[1]+1)
		file, ok := archive.Lookup(regDir.PathHeightmapFile())
		if !ok {
			// some regions just don't have it (frontend level)
			// slog.Warn("heightmap not found", "file", filePath)
			return nil
		}
		data, err := file.Read()
		if err != nil {
			slog.Error("failed to read heightmap", "file", file.Path(), "err", err)
			return nil
		}
		hm, err := heightmap.ParseTIFF(data)
		if err != nil {
			slog.Error("failed to decode heightmap", "file", file.Path(), "err", err)
			return nil
		}
		img := hm.Image()
		files.Store(r.ID, img)
		width := img.Bounds().Max.X
		// height := img.Bounds().Max.Y
		if size == 0 {
			size = width
		}
		if size != width {
			slog.Warn("inconsistent heightmap tile size", "expected", size, "was", width)
			// never happens, but if, we might resize the image here
		}
		if model == nil {
			model = img.ColorModel()
		}
		return nil
	})

	tilesX = math.NextPowerOf2(tilesX)
	tilesY = math.NextPowerOf2(tilesY)
	result := img.New(size, tilesX, tilesY, model)
	for _, r := range regions {
		x := r.Location[0]
		y := tilesY - r.Location[1] - 1
		result.Rows[y][x] = files.Get(r.ID)
	}

	return result
}

func (dir *CoatlicueDirectory) LoadTractmapTiles(archive nwfs.Archive) *img.TiledImage {
	regionsX := 0
	regionsY := 0
	files := maps.NewSyncMap[string, image.Image]()
	size := 0
	var model color.Model

	regions := dir.LoadRegionList(archive)
	progress.Concurrent(4, regions, func(r RegionLocation, index int) error {
		regDir := NewRegionDirectory(dir.Name, r.ID)

		regionsX = max(regionsX, r.Location[0]+1)
		regionsY = max(regionsY, r.Location[1]+1)
		file, ok := archive.Lookup(regDir.PathTractmapFile())
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
	for _, r := range regions {
		x := r.Location[0]
		y := regionsY - r.Location[1] - 1
		result.Rows[y][x] = files.Get(r.ID)
	}

	return result
}
