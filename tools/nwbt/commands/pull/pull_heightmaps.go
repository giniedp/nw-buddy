package pull

import (
	"fmt"
	"image"
	"image/color"
	"log/slog"
	"math"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/utils/img"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"
	"sync/atomic"

	"github.com/spf13/cobra"
	"golang.org/x/image/draw"
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

func pullHeightmaps(assets *game.Assets, outDir string) {
	directories := level.ListCoatlicueDirectories(assets)
	bar := progress.Bar(len(directories), "Heightmaps")
	for _, dir := range directories {
		bar.Add(1)

		hasTracts := false
		tracts := dir.LoadTracts(assets)
		if tracts == nil {
			continue
		}

		for _, tract := range tracts.Tracts {
			if tract.MapCategory != "" {
				hasTracts = true
				break
			}
		}
		if !hasTracts {
			continue
		}
		pullHeightmap(assets, outDir, dir, bar)
	}
	bar.Close()
}

func pullHeightmap(assets *game.Assets, outDir string, dir level.CoatlicueDirectory, bar progress.ProgressBar) {
	levelName := dir.Name
	// heightmapR16OutDir := path.Join(outDir, levelName, "heightmap16")
	heightmapRGB8OutDir := path.Join(outDir, levelName, "heightmap")

	bar.Detail(fmt.Sprintf("%s load heightmap", levelName))

	heightMap := dir.LoadHeightmapTiles(assets.Archive)
	// img.WriteFile(heightMap, path.Join(heightmapR16OutDir, "heightmap.png"))
	// heightMapRGB8 := img.CloneToRGBA(heightMap, func(x, y int) color.Color {
	// 	r, _, _, _ := heightMap.At(x, y).RGBA()
	// 	return heightmap.EncodeHeightToRGBA(float32(r))
	// })
	// img.WriteFile(heightMapRGB8, path.Join(heightmapRGB8OutDir, "heightmap.png"))

	// number of tiles per region at max zoom in level
	tilesPerRegion := 8
	// number of levels we want to generate
	maxLevelCount := 8
	// level that covers a full region in each dimension
	levelCoveringRegion := int(math.Log2(float64(tilesPerRegion)))
	targetTileSize := 256

	numRegionsX := heightMap.TilesX
	numRegionsY := heightMap.TilesY
	numTilesX := numRegionsX * tilesPerRegion
	numTilesY := numRegionsY * tilesPerRegion
	mapHeight := heightMap.SizeY

	var source image.Image = heightMap

	for level := range maxLevelCount {
		regionCoverage := math.Pow(2, float64(level-levelCoveringRegion))
		if heightMap.TilesX < int(regionCoverage) {
			break
		}

		bounds := source.Bounds()
		tiles := img.Tiles(bounds, numTilesX, numTilesY)
		done := int32(0)
		markDone := func() {
			atomic.AddInt32(&done, 1)
			bar.Detail(fmt.Sprintf("%s tiles lvl:%d %d/%d", levelName, level, done, len(tiles)))
		}

		progress.Concurrent(4, tiles, func(rect image.Rectangle, index int) error {
			defer markDone()

			tileW := rect.Size().X
			tileH := rect.Size().Y
			if tileW == 0 || tileH == 0 {
				return nil
			}

			x := int(math.Pow(2, float64(level)) * float64(rect.Min.X/tileW))
			y := int(math.Pow(2, float64(level)) * float64((mapHeight-rect.Min.Y-1)/tileH))
			z := level + 1
			file := fmt.Sprintf("heightmap_l%d_y%03d_x%03d.png", z, y, x)

			tile := image.NewRGBA64(image.Rect(0, 0, tileW, tileH))
			draw.Copy(tile, image.Pt(0, 0), source, rect, draw.Over, nil)
			// img.WriteFile(tileR16, path.Join(heightmapR16OutDir, fmt.Sprintf("%d", level+1), file))
			tileRGB8 := img.CloneToRGBA(tile, func(x, y int) color.Color {
				r, _, _, _ := tile.At(x, y).RGBA()
				return heightmap.EncodeHeightToRGBA(float32(r))
			})
			img.WriteFile(tileRGB8, path.Join(heightmapRGB8OutDir, fmt.Sprintf("%d", level+1), file))
			return nil
		})

		// downsize for next level
		numTilesX = max(numTilesX/2, 1)
		numTilesY = max(numTilesY/2, 1)
		size := source.Bounds().Size()
		if size.X/numTilesX > targetTileSize {
			mapHeight = mapHeight / 2
			dst := image.NewRGBA64(image.Rect(0, 0, size.X/2, size.Y/2))

			draw.BiLinear.Scale(dst, dst.Bounds(), source, source.Bounds(), draw.Over, nil)
			source = dst
		}
	}
}
