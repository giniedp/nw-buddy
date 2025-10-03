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
	"sync"
)

func LoadTerrain(archive nwfs.Archive, levelName string) *heightmap.Terrain {
	files, _ := archive.Glob(coatlicuePath(levelName, "regions", "**", "region.heightmap"))
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

func LoadHeightmap(archive nwfs.Archive, info *Info) *img.TiledImage {
	tilesX := 0
	tilesY := 0
	files := maps.NewSyncMap[string, image.Image]()
	size := 0
	var model color.Model
	progress.Concurrent(4, info.Regions, func(r RegionReference, index int) error {
		if r.Location == nil {
			return nil
		}
		tilesX = max(tilesX, r.Location[0]+1)
		tilesY = max(tilesY, r.Location[1]+1)
		filePath := coatlicuePath(info.Name, "regions", r.ID, "region.heightmap")
		file, ok := archive.Lookup(filePath)
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
		img, err := tiff.DecodeWithImageWithMagick(data)
		if err != nil {
			slog.Error("failed to decode heightmap", "file", file.Path(), "err", err)
			return nil
		}
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
	for _, r := range info.Regions {
		x := r.Location[0]
		y := tilesY - r.Location[1] - 1
		result.Rows[y][x] = files.Get(r.ID)
	}

	return result
}
