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
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"

	"github.com/spf13/cobra"
)

const TILE_SIZE = 256

var cmdPullHeightmaps = &cobra.Command{
	Use:   TASK_HEIGHTMAP,
	Short: "Pulls heightmap files and generates tiles",
	Long:  "",
	Run:   runPullHeightmaps,
}

func runPullHeightmaps(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullHeightmaps()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullHeightmaps(fs nwfs.Archive, outDir string) {
	if _, ok := utils.Magick.Check(); !ok {
		slog.Error("Image Magick not found. Skipped heightmap generation.")
		return
	}

	files, _ := fs.Glob(
		"**/coatlicue/newworld_vitaeeterna/regions/**/region.heightmap",
		"**/coatlicue/nw_opr_004_trench/regions/**/region.heightmap",
	)

	levels := maps.NewSyncDict[*maps.SafeSet[*heightmap.Region]]()
	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "Heightmaps (read)",
		Tasks:         files,
		ProducerCount: int(flgWorkerCount),
		Producer: func(file nwfs.File) (string, error) {
			region, err := heightmap.LoadRegion(file)
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
		mipLevels := compileMipmaps(terrain)

		progress.RunTasks(progress.TasksConfig[Tile, string]{
			Description:   level,
			Tasks:         compileTiles(mipLevels),
			ProducerCount: int(flgWorkerCount),
			Producer: func(tile Tile) (string, error) {
				return workTile(tile, level, outDir), nil
			},
		})
	}
}

func compileMipmaps(terrain *heightmap.Terrain) []*heightmap.Terrain {
	mips := []*heightmap.Terrain{terrain}
	for terrain.Width > TILE_SIZE {
		terrain = terrain.Downsize()
		mips = append(mips, terrain)
	}
	return mips
}

func compileTiles(mipLevels []*heightmap.Terrain) []Tile {
	tiles := []Tile{}
	for i, mip := range mipLevels {
		for tileX, tileY := range iterArea(0, 0, mip.Width/TILE_SIZE, mip.Height/TILE_SIZE) {
			tiles = append(tiles, Tile{
				Terrain: mip,
				Mip:     i + 1,
				X:       tileX * int(math.Pow(2, float64(i))),
				Y:       tileY * int(math.Pow(2, float64(i))),
				Area: Area{
					X: tileX * TILE_SIZE,
					Y: tileY * TILE_SIZE,
					W: TILE_SIZE,
					H: TILE_SIZE,
				},
			})
		}
	}
	return tiles
}

type Tile struct {
	Terrain *heightmap.Terrain
	Area    Area
	Mip     int
	X       int
	Y       int
}

type Area struct {
	X int
	Y int
	W int
	H int
}

func workTile(tile Tile, level string, outDir string) string {
	img := image.NewRGBA(image.Rect(0, 0, tile.Area.W, tile.Area.H))
	for x, y := range iterArea(0, 0, tile.Area.W, tile.Area.H) {
		tx := tile.Area.X + x
		ty := tile.Area.Y + y
		h := tile.Terrain.SmoothHeightAt(tx, ty)
		img.Set(x, TILE_SIZE-y-1, heightmap.EncodeHeightToR8G8B8(h))
	}

	name := fmt.Sprintf("%d/heightmap_l%d_y%03d_x%03d", tile.Mip, tile.Mip, tile.Y, tile.X)
	file := path.Join(outDir, level, "heightmap", name+".png")
	if err := writeTile(file, img); err != nil {
		slog.Error("tile not written", "file", file, "error", err)
	}
	return file
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
