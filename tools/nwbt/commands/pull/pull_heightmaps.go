package pull

import (
	"fmt"
	"image"
	"image/png"
	"iter"
	"log/slog"
	"math"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
)

const TILE_SIZE = 256

func pullHeightmaps(fs nwfs.Archive, outDir string) {
	files, _ := fs.Glob("**/coatlicue/nw_opr_004_trench/regions/**/region.heightmap")

	levels := maps.NewSyncDict[*maps.SafeSet[*heightmap.Region]]()
	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "Heightmaps (read)",
		Tasks:         files,
		ProducerCount: int(flgWorkerCount),
		Producer: func(file nwfs.File) (string, error) {
			region, err := heightmap.Load(file)
			if err != nil {
				return file.Path(), err
			}
			list, _ := levels.LoadOrStore(region.Level, maps.NewSafeSet[*heightmap.Region]())
			list.Store(&region)
			return file.Path(), nil
		},
	})

	for level, list := range levels.Iter() {
		if list.Len() == 0 {
			continue
		}
		terrain := heightmap.NewTerrain(list.Values())
		mipLevels := generateMipmaps(terrain)
		for tile := range generateTiles(mipLevels) {
			name := fmt.Sprintf("%d/heightmap_l%d_y%03d_x%03d", tile.Mip, tile.Mip, tile.X, tile.Y)
			file := path.Join(outDir, "lyshineui", "worldtiles", level, "heightmap", name+".png")
			if err := writeTile(file, tile.Image); err != nil {
				slog.Error("Failed to write tile ", "error", err)
			}
		}
	}
}

func generateMipmaps(terrain *heightmap.Terrain) []*heightmap.Terrain {
	mipLevels := []*heightmap.Terrain{terrain}
	current := terrain
	for current.Width > TILE_SIZE {
		current = current.Downsample()
		mipLevels = append(mipLevels, current)
	}
	return mipLevels
}

type Tile struct {
	Mip   int
	X     int
	Y     int
	Image image.Image
}

func generateTiles(mipLevels []*heightmap.Terrain) iter.Seq[Tile] {
	return func(yield func(Tile) bool) {
		for i, mip := range mipLevels {
			mipLevel := i + 1
			step := int(math.Pow(2, float64(i)))
			for tileX, tileY := range iterArea(0, 0, mip.Width/TILE_SIZE, mip.Height/TILE_SIZE) {
				img := image.NewRGBA(image.Rect(0, 0, TILE_SIZE, TILE_SIZE))
				for x, y := range iterArea(0, 0, TILE_SIZE, TILE_SIZE) {
					tx := tileX*TILE_SIZE + x
					ty := tileY*TILE_SIZE + y
					h, _ := mip.HeightAt(tx, ty)
					img.Set(x, TILE_SIZE-y-1, heightmap.EncodeHeightToR8G8B8(h))
				}
				tile := Tile{
					Mip:   mipLevel,
					X:     tileX * step,
					Y:     tileY * step,
					Image: img,
				}
				if !yield(tile) {
					return
				}
			}
		}
	}
}

func iterArea(x, y, w, h int) iter.Seq2[int, int] {
	return func(yield func(int, int) bool) {
		for i := y; i < y+h; i++ {
			for j := x; j < x+w; j++ {
				if !yield(j, i) {
					return
				}
			}
		}
	}
}

func writeTile(file string, img image.Image) error {
	if err := os.MkdirAll(path.Dir(file), os.ModePerm); err != nil {
		return err
	}
	f, err := os.OpenFile(file, os.O_CREATE, os.ModePerm)
	if err != nil {
		return err
	}
	defer f.Close()
	return png.Encode(f, img)
}
