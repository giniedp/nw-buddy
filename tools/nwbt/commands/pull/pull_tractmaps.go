package pull

import (
	"fmt"
	"image"
	"image/color"
	"log/slog"
	"math"
	"nw-buddy/tools/formats/tracts"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/img"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"path"

	"github.com/spf13/cobra"
	"golang.org/x/image/draw"
)

var cmdPullTractmaps = &cobra.Command{
	Use:   TASK_TRACTMAP,
	Short: "Pulls heightmap files and generates tiles",
	Long:  "",
	Run:   runPullTractmaps,
}

func runPullTractmaps(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullTractmaps()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullTractmaps(assets *game.Assets, outDir string) {
	if _, ok := utils.Magick.Check(); !ok {
		slog.Error("Image Magick not found. Skipped heightmap generation.")
		return
	}

	lvls := level.ListLevels(assets)
	bar := progress.Bar(len(lvls), "Tractmaps")
	for _, info := range lvls {
		bar.Add(1)

		hasTracts := false
		for _, tract := range info.Tracts {
			if tract.MapCategory != "" {
				hasTracts = true
				break
			}
		}
		if !hasTracts {
			continue
		}
		pullTracmap(assets, outDir, info, bar)
	}
	bar.Close()
}

func pullTracmap(assets *game.Assets, outDir string, info *level.Info, bar progress.ProgressBar) {
	levelName := info.Name
	levelOutDir := path.Join(outDir, levelName, "tractmap")

	colors := level.TractColorToCategoryMap(info)

	bar.Detail(fmt.Sprintf("%s load heightmap", levelName))
	heightmap := level.LoadHeightmap(assets.Archive, info)

	bar.Detail(fmt.Sprintf("%s load tractmap", levelName))
	tractmap := level.LoadTractmap(assets.Archive, info)
	if err := img.WriteFile(tractmap, path.Join(levelOutDir, "tractmap.webp")); err != nil {
		slog.Error("error writing file", "err", err)
	}

	scale := (float32(heightmap.SizeX) / float32(tractmap.SizeX))

	bar.Detail(fmt.Sprintf("%s recolor", levelName))

	loggedUnknownKeys := maps.NewSyncMap[tracts.Color, tracts.Color]()
	recolored := img.Apply(tractmap, func(c color.RGBA, x, y int) color.RGBA {
		occlusion := heightmapOcclusionAt(heightmap, int(float32(x)*scale), int(float32(y)*scale), info.MountainHeight)
		key := tracts.Color{R: c.R, G: c.G, B: c.B}
		layer := colors[key]
		res, ok := GroundColors[layer]

		if !ok {
			if _, ok := loggedUnknownKeys.LoadOrStore(key, key); !ok {
				slog.Warn("unknown tractmap color", "key", key, "layer", layer)
			}
		}
		if layer != "OCEANBED" && layer != "WATERBED" {
			res.R = uint8(float32(res.R) * occlusion)
			res.G = uint8(float32(res.G) * occlusion)
			res.B = uint8(float32(res.B) * occlusion)
		}
		return res
	})
	if err := img.WriteFile(recolored, path.Join(levelOutDir, "tractmapc.webp")); err != nil {
		slog.Error("error writing file", "err", err)
	}

	// number of tiles per region at max zoom in level
	tilesPerRegion := 8
	// number of levels we want to generate
	maxLevelCount := 8
	// level that covers a full region in each dimension
	levelCoveringRegion := int(math.Log2(float64(tilesPerRegion)))
	// try keep high resolution tiles for 1x1
	targetTileSize := 1024

	numRegionsX := tractmap.TilesX
	numRegionsY := tractmap.TilesY
	numTilesX := numRegionsX * tilesPerRegion
	numTilesY := numRegionsY * tilesPerRegion
	mapHeight := tractmap.SizeY

	var source image.Image = recolored

	for level := range maxLevelCount {
		regionCoverage := math.Pow(2, float64(level-levelCoveringRegion))
		if tractmap.TilesX < int(regionCoverage) {
			break
		}

		bounds := source.Bounds()
		tiles := img.Tiles(bounds, numTilesX, numTilesY)
		for i, t := range tiles {
			bar.Detail(fmt.Sprintf("%s tiles lvl:%d %d/%d", levelName, level, i+1, len(tiles)))

			tileW := t.Size().X
			tileH := t.Size().Y
			if tileW == 0 || tileH == 0 {
				continue
			}
			tile := image.NewRGBA(image.Rect(0, 0, tileW, tileH))
			draw.Copy(tile, image.Pt(0, 0), source, t, draw.Over, nil)

			x := int(math.Pow(2, float64(level)) * float64(t.Min.X/tileW))
			y := int(math.Pow(2, float64(level)) * float64((mapHeight-t.Min.Y-1)/tileH))
			z := level + 1
			file := fmt.Sprintf("tractmap_l%d_y%03d_x%03d.webp", z, y, x)
			filePath := path.Join(levelOutDir, fmt.Sprintf("%d", level+1), file)
			img.WriteFile(tile, filePath)
		}

		// downsize for next level
		numTilesX = max(numTilesX/2, 1)
		numTilesY = max(numTilesY/2, 1)
		size := source.Bounds().Size()
		if size.X/numTilesX > targetTileSize {
			mapHeight = mapHeight / 2
			dst := image.NewRGBA(image.Rect(0, 0, size.X/2, size.Y/2))
			draw.BiLinear.Scale(dst, dst.Bounds(), source, source.Bounds(), draw.Over, nil)
			source = dst
		}
	}
}

var GroundColors = map[string]color.RGBA{
	"CLIFFS":        {84, 74, 64, 255},    // rgb(84, 74, 64)
	"COAST":         {195, 171, 126, 255}, // rgb(195, 171, 126)
	"COASTALHILLS":  {184, 162, 118, 255}, // rgb(184, 162, 118)
	"CURSED_FOREST": {90, 40, 90, 255},
	"DAMNED":        {99, 59, 38, 255},    // rgb(99, 59, 38)
	"DESERT_FOREST": {151, 138, 96, 255},  // rgb(151, 138, 96)
	"DESERT_OASIS":  {132, 142, 99, 255},  // rgb(132, 142, 99)
	"DESERT_PLAINS": {165, 136, 112, 255}, // rgb(165, 136, 112)
	"DESERT_SANDS":  {206, 190, 173, 255}, // rgb(206, 190, 173)
	"DESERT_SULFUR": {179, 141, 89, 255},  // rgb(179, 141, 89)
	"FOREST_ASPEN":  {110, 105, 77, 255},  // rgb(110, 105, 77)
	"FOREST":        {121, 119, 88, 255},  // rgb(121, 119, 88)
	"GRASSLAND":     {144, 137, 90, 255},  // rgb(144, 137, 90)
	"HIGHLAND":      {131, 111, 79, 255},  //rgb(131, 111, 79)
	"MARSH":         {99, 85, 49, 255},    // rgb(99, 85, 49)
	"MOUNTAIN":      {154, 132, 93, 255},  // rgb(154, 132, 93)
	"MYSTIC_FOREST": {137, 94, 88, 255},   // rgb(137, 94, 88)
	"OCEANBED":      {30, 50, 100, 0},
	"RIVERSLAKES":   {128, 144, 144, 255}, // rgb(128, 144, 144) *
	"ROADS":         {200, 182, 143, 255}, // rgb(200, 182, 143)
	"SHRUBLAND":     {141, 141, 89, 255},  // rgb(141, 141, 89)
	"WATERBED":      {128, 144, 144, 255}, // rgb(128, 144, 144)
}

func heightmapOcclusionAt(heightmap *img.TiledImage, x int, y int, mountainHeight float32) float32 {

	// Skip edges (fallback to 0.5 neutral)
	if x <= 0 || x >= heightmap.SizeX-1 || y <= 0 || y >= heightmap.SizeY-1 {
		return 0.5
	}

	scale := mountainHeight * float32(65535)

	hL1, _, _, _ := heightmap.At(x-1, y-1).RGBA()
	hL2, _, _, _ := heightmap.At(x-1, y).RGBA()
	hL3, _, _, _ := heightmap.At(x-1, y+1).RGBA()
	hL := scale * float32(hL1+hL2+hL3) / 3

	hR1, _, _, _ := heightmap.At(x+1, y-1).RGBA()
	hR2, _, _, _ := heightmap.At(x+1, y).RGBA()
	hR3, _, _, _ := heightmap.At(x+1, y+1).RGBA()
	hR := scale * float32(hR1+hR2+hR3) / 3

	hT1, _, _, _ := heightmap.At(x-1, y-1).RGBA()
	hT2, _, _, _ := heightmap.At(x, y-1).RGBA()
	hT3, _, _, _ := heightmap.At(x+1, y-1).RGBA()
	hT := scale * float32(hT1+hT2+hT3) / 3

	hB1, _, _, _ := heightmap.At(x-1, y+1).RGBA()
	hB2, _, _, _ := heightmap.At(x, y+1).RGBA()
	hB3, _, _, _ := heightmap.At(x+1, y+1).RGBA()
	hB := scale * float32(hB1+hB2+hB3) / 3

	// Sobel-like gradient (simple central differences)
	dx := float64(hR - hL)
	dy := float64(hB - hT)

	// Construct normal vector
	nx := -dx
	ny := -dy
	nz := float64(mountainHeight)

	// Normalize
	lenN := math.Sqrt(nx*nx + ny*ny + nz*nz)
	if lenN == 0 {
		return 0.5
	}
	nx /= lenN
	ny /= lenN
	nz /= lenN

	azimuth := 225.0 * math.Pi / 180.0
	elevation := 70.0 * math.Pi / 180.0
	// --- Light direction from spherical coords ---
	// azimuth φ (radians), elevation θ (radians)
	lx := math.Cos(elevation) * math.Cos(azimuth)
	ly := math.Cos(elevation) * math.Sin(azimuth)
	lz := math.Sin(elevation)
	// ---------------------------------------------

	lenL := math.Sqrt(lx*lx + ly*ly + lz*lz)
	lx /= lenL
	ly /= lenL
	lz /= lenL

	// Lambertian shading (dot product)
	illum := nx*lx + ny*ly + nz*lz

	// Clamp [-1,1] to [0,1]
	if illum < -1 {
		illum = -1
	}
	if illum > 1 {
		illum = 1
	}
	illum = (illum + 1.0) * 0.5
	// brighten up -> [0.5,1]
	return 0.5 + float32(illum)*0.5
}
