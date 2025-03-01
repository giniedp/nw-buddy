package heightmap

import (
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

func NewTerrain(regions []*Region) (out *Terrain) {
	maxX := 0
	maxY := 0

	out = &Terrain{}
	for _, region := range regions {
		maxX = max(maxX, region.X+1)
		maxY = max(maxY, region.Y+1)
		out.RegionSize = region.Size
	}
	out.Regions = make([][]*Region, maxY)
	for i := range maxY {
		out.Regions[i] = make([]*Region, maxX)
	}
	for _, region := range regions {
		out.Regions[region.Y][region.X] = region
	}
	out.RegionsX = nextPowerOf2(maxX + 1)
	out.RegionsY = nextPowerOf2(maxY + 1)
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
		return region.HeightAt(x, y)
	}
	return 0, false
}

func (t *Terrain) SetHeightAt(x int, y int, height float32) {
	rX := x / t.RegionSize
	rY := y / t.RegionSize
	if rY < len(t.Regions) && rX < len(t.Regions[rY]) {
		region := t.Regions[rY][rX]
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
	// {1, 0},
	// {0, 1},
	// {1, 1},
}

func (t *Terrain) GetSmoothHeightAt(x int, y int) float32 {
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

func (t *Terrain) Downsample() (out *Terrain) {
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
			out.SetHeightAt(x, y, t.GetSmoothHeightAt(x*2, y*2))
		}
	}
	return
}
