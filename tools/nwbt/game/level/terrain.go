package level

import (
	"log/slog"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/maps"
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
