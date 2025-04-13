package heightmap

import (
	"image"
	"iter"
	"math"
)

type Terrain struct {
	Regions    [][]*Region
	RegionsX   int
	RegionsY   int
	RegionSize int
	Width      int
	Height     int
}

const (
	TILE_SIZE = 256
)

func NewTerrain(regions []*Region) (out *Terrain) {
	maxX := 0
	maxY := 0

	out = &Terrain{}
	for _, region := range regions {
		maxX = max(maxX, region.X)
		maxY = max(maxY, region.Y)
		out.RegionSize = region.Size
	}
	out.RegionsX = nextPowerOf2(maxX + 1)
	out.RegionsY = nextPowerOf2(maxY + 1)
	out.Regions = make([][]*Region, out.RegionsY)
	for i := range out.RegionsY {
		out.Regions[i] = make([]*Region, out.RegionsX)
	}
	for _, region := range regions {
		out.Regions[region.Y][region.X] = region
	}

	out.Width = out.RegionsX * out.RegionSize
	out.Height = out.RegionsY * out.RegionSize
	return
}

func nextPowerOf2(value int) int {
	return int(math.Pow(float64(2), math.Ceil(math.Log2(float64(value)))))
}

func (t *Terrain) HeightAt(x int, y int) (float32, bool) {
	rX := x / t.RegionSize
	rY := y / t.RegionSize
	if rY < len(t.Regions) && rX < len(t.Regions[rY]) {
		region := t.Regions[rY][rX]
		x = x % t.RegionSize
		y = y % t.RegionSize
		if region == nil {
			return 0, false
		}
		return region.HeightAt(x, y)
	}
	return 0, false
}

func (t *Terrain) SetHeightAt(x int, y int, height float32) {
	rX := x / t.RegionSize
	rY := y / t.RegionSize
	if rY < len(t.Regions) && rX < len(t.Regions[rY]) {
		region := t.Regions[rY][rX]
		if region == nil {
			return
		}
		x = x % t.RegionSize
		y = y % t.RegionSize
		region.SetHeightAt(x, y, height)
	}
}

func (r *Region) HeightAt(x int, y int) (float32, bool) {
	if x < 0 || x >= r.Size || y < 0 || y >= r.Size {
		return 0, false
	}
	y = r.Size - y - 1
	return r.Data[y*r.Size+x], true
}

func (r *Region) SetHeightAt(x int, y int, height float32) {
	if x < 0 || x >= r.Size || y < 0 || y >= r.Size {
		return
	}
	y = r.Size - y - 1
	r.Data[y*r.Size+x] = height
}

var samples = [][2]int{
	{0, 0},
	{1, 0},
	{0, 1},
	{1, 1},
}

func (t *Terrain) SmoothHeightAt(x int, y int) float32 {
	var sum float64
	var count float64
	for _, sample := range samples {
		if v, ok := t.HeightAt(x+sample[0], y+sample[1]); ok {
			sum += float64(v)
			count++
		}
	}
	if count == 0 {
		return float32(sum)
	}
	return float32(sum / count)
}

const maxRegionSize = 2048

func (t *Terrain) Downsize() (out *Terrain) {
	out = &Terrain{}
	out.Width = t.Width / 2
	out.Height = t.Height / 2
	if out.Width >= maxRegionSize {
		out.RegionSize = maxRegionSize
		out.RegionsX = int(math.Ceil(float64(out.Width) / float64(maxRegionSize)))
		out.RegionsY = int(math.Ceil(float64(out.Height) / float64(maxRegionSize)))
	} else {
		out.RegionSize = out.Width
		out.RegionsX = 1
		out.RegionsY = 1
	}

	out.Regions = make([][]*Region, out.RegionsY)
	for y := range out.RegionsY {
		out.Regions[y] = make([]*Region, out.RegionsX)
		for x := range out.RegionsX {
			out.Regions[y][x] = &Region{
				Meta: Meta{
					X: x,
					Y: y,
				},
				Size: out.RegionSize,
				Data: make([]float32, out.RegionSize*out.RegionSize),
			}
		}
	}

	for y := range out.Height {
		for x := range out.Width {
			out.SetHeightAt(x, y, t.SmoothHeightAt(x*2, y*2))
		}
	}
	return
}

type Mipmaps struct {
	Levels   []*Terrain
	TileSize int
}

func (t *Terrain) MipmapsDefaultSize() Mipmaps {
	return t.Mipmaps(TILE_SIZE)
}

func (t *Terrain) Mipmaps(tileSize int) Mipmaps {
	levels := []*Terrain{t}
	for t.Width > tileSize {
		t = t.Downsize()
		levels = append(levels, t)
	}
	return Mipmaps{
		Levels:   levels,
		TileSize: tileSize,
	}
}

func (mips Mipmaps) Tiles() []Tile {
	tiles := []Tile{}
	for i, mip := range mips.Levels {
		for tileX, tileY := range iterArea(0, 0, mip.Width/mips.TileSize, mip.Height/mips.TileSize) {
			x := tileX * int(math.Pow(2, float64(i)))
			y := tileY * int(math.Pow(2, float64(i)))
			tiles = append(tiles, mips.TileAt(i+1, x, y))
		}
	}
	return tiles
}

func (mips Mipmaps) TileAt(level, x, y int) Tile {
	tileX := x / int(math.Pow(2, float64(level-1)))
	tileY := y / int(math.Pow(2, float64(level-1)))
	tileSize := mips.TileSize
	return Tile{
		Level: level,
		X:     x,
		Y:     y,
		Area: Area{
			X: tileX * tileSize,
			Y: tileY * tileSize,
			W: tileSize,
			H: tileSize,
		},
	}
}

func (mips Mipmaps) TileHeightmap(tile Tile) image.Image {
	level := tile.Level - 1
	if level < 0 || level >= len(mips.Levels) {
		return nil
	}
	mip := mips.Levels[tile.Level-1]
	tileSize := mips.TileSize
	img := image.NewNRGBA(image.Rect(0, 0, tile.Area.W, tile.Area.H))
	for x, y := range iterArea(0, 0, tile.Area.W, tile.Area.H) {
		tx := tile.Area.X + x
		ty := tile.Area.Y + y
		h, _ := mip.HeightAt(tx, ty) // GetSmoothHeightAt(tx, ty)
		img.Set(x, tileSize-y-1, EncodeHeightToR8G8B8(h))
	}
	return img
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

type Tile struct {
	Area  Area
	Level int
	X     int
	Y     int
}

type Area struct {
	X int
	Y int
	W int
	H int
}
