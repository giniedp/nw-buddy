package heightmap

import (
	"math"
	"slices"
)

// Cookie flattens the terrain around (X, Y) towards Z (world space, metres)
type Cookie struct {
	X                    float32
	Y                    float32
	Z                    float32
	InnerRadius          float32
	OuterRadius          float32
	MaxHeightBlend       float32
	EdgeNoise            float32
	EdgeNoiseFeatureSize float32
	GroundNoiseScale     float32
}

// Defaults of the cookie fields a capital leaves out
const (
	CookieDefaultEdgeNoise            = 0.5
	CookieDefaultEdgeNoiseFeatureSize = 8
	CookieDefaultGroundNoiseScale     = 0.5
)

// ground noise: a coarse and a fine fbm, each raised to an exponent
const (
	groundCoarseScale = float32(0.015625)
	groundCoarsePower = 0.45
	groundFineScale   = float32(0.125)
	groundFinePower   = 0.1
	groundJaggedness  = float32(0.5)
)

var (
	groundOffset    = [2]float32{7.1, 19.7}
	groundFineShift = [2]float32{7.3, 73.9}
	// edge displacement sample offsets
	edgeXOffset = [2]float32{math.Float32frombits(0x42c99999), 93.600006}
	edgeYOffset = [2]float32{108.1, 167.5}
)

// ApplyCookies bakes terrain cookies into the region heightmap as the game's CPU terrain pass does: in ascending z,
// with edge displacement and ground noise, the target quantized to 16 bit and the blend truncated. Cookies without
// a positive MaxHeightBlend do nothing. Returns the number of cookies that reach the region.
func (r *Region) ApplyCookies(cookies []Cookie, mountainHeight float32) int {
	side := r.Size
	if side <= 0 || len(r.Data) != side*side || mountainHeight <= 0 {
		return 0
	}
	sorted := make([]Cookie, 0, len(cookies))
	for _, c := range cookies {
		if c.MaxHeightBlend > 0 && c.finite() {
			sorted = append(sorted, c)
		}
	}
	if len(sorted) == 0 {
		return 0
	}
	slices.SortStableFunc(sorted, func(a, b Cookie) int {
		switch {
		case a.Z < b.Z:
			return -1
		case a.Z > b.Z:
			return 1
		}
		return 0
	})

	// one sample per metre: the region extent is the sample count. Samples are evaluated half a cell past their
	// corner, the tile's lower bound is origin + cell / 2
	extent := float64(side)
	width := float32(extent)
	centerX := float32(float64(r.X*side) + extent*0.5 + 0.5)
	centerY := float32(float64(r.Y*side) + extent*0.5 + 0.5)
	lowerX := centerX - width*0.5
	lowerY := centerY - width*0.5
	cell := float32(float64(width) / float64(side))
	inverseSide := 1 / float32(side)
	noise := sharedCookieNoise()

	count := 0
	for _, c := range sorted {
		maxRadius := maxf(c.InnerRadius, c.OuterRadius)
		if abs32(c.X-centerX)-maxRadius*1.5 >= width*0.5 || abs32(c.Y-centerY)-maxRadius*1.5 >= width*0.5 {
			continue
		}
		radius := (maxRadius-c.InnerRadius)*0.5 + maxRadius
		colStart, colEnd := rasterSpan(c.X, lowerX, radius, 1/cell, side)
		rowStart, rowEnd := rasterSpan(c.Y, lowerY, radius, 1/cell, side)
		if colStart >= colEnd || rowStart >= rowEnd {
			continue
		}
		count++

		blend := c.OuterRadius - c.InnerRadius
		displacement := blend * c.EdgeNoise * 0.5
		frequency := 1 / c.EdgeNoiseFeatureSize
		strength := clampUnit(c.MaxHeightBlend)
		for row := rowStart; row < rowEnd; row++ {
			py := (float32(row)+0.5)*inverseSide*width + lowerY
			// the data keeps the file's row order: the first row is the region's maximum y
			offset := (side - 1 - int(row)) * side
			for col := colStart; col < colEnd; col++ {
				px := (float32(col)+0.5)*inverseSide*width + lowerX

				coarse := noise.fbm(px*groundCoarseScale+groundOffset[0], py*groundCoarseScale+groundOffset[1], groundJaggedness)
				coarse = float32(math.Pow(float64(abs32(coarse)), groundCoarsePower))
				fine := noise.fbm(
					px*groundFineScale+(groundOffset[0]+groundFineShift[0]),
					py*groundFineScale+(groundOffset[1]+groundFineShift[1]),
					groundJaggedness,
				)
				fine = float32(math.Pow(float64(abs32(fine)), groundFinePower))
				height := ((fine+(coarse-0.5))-0.5)*c.GroundNoiseScale + c.Z

				dx := noise.sample(frequency*px+edgeXOffset[0], py*frequency+edgeXOffset[1]) * displacement
				dy := noise.sample(frequency*px+edgeYOffset[0], py*frequency+edgeYOffset[1]) * displacement
				dx = (px + dx) - c.X
				dy = (py + dy) - c.Y
				distance := float32(math.Sqrt(float64(dy*dy + dx*dx)))
				// a zero feature size makes the displacement NaN, maxf turns the transition into 0
				transition := maxf(distance-(displacement+c.InnerRadius), 0) / maxf(blend, 0.0001)
				weight := float32(1)
				if transition >= 0 {
					weight = 1 - minf(transition, 1)
				}
				weight = clampUnit(weight)
				alpha := ((3 - (weight + weight)) * (weight * weight)) * strength

				i := offset + int(col)
				r.Data[i] = blendHeight(r.Data[i], height, alpha, mountainHeight)
			}
		}
	}
	return count
}

func (c Cookie) finite() bool {
	for _, v := range []float32{c.X, c.Y, c.Z, c.InnerRadius, c.OuterRadius, c.MaxHeightBlend, c.EdgeNoise, c.EdgeNoiseFeatureSize, c.GroundNoiseScale} {
		if math.IsNaN(float64(v)) || math.IsInf(float64(v), 0) {
			return false
		}
	}
	return true
}

// rasterSpan is the range of samples a cookie covers along one axis
func rasterSpan(center, lower, radius, inverseCell float32, side int) (int32, int32) {
	start := truncInt32(((center - radius) - lower) * inverseCell)
	end := truncInt32(((center + radius) - lower) * inverseCell)
	count := end - start
	if count < 0 {
		count = -count
	}
	if count <= 0 {
		return 0, 0
	}
	return max(start, 0), min(start+count, int32(side))
}

// blendHeight quantizes the target height to 16 bit, then blends towards it and truncates
func blendHeight(old uint16, height, alpha, maximum float32) uint16 {
	if height >= 0 {
		height = minf(maximum, height)
	} else {
		height = 0
	}
	target := uint16(truncInt32((height*65535)/maximum + 0.5))
	return uint16(truncInt32((float32(target)-float32(old))*alpha + float32(old)))
}

func clampUnit(v float32) float32 {
	if v >= 0 {
		return minf(v, 1)
	}
	return 0
}

// maxf is the larger value, the other one when either is NaN (unlike the builtin max)
func maxf(a, b float32) float32 {
	if a != a {
		return b
	}
	if b != b {
		return a
	}
	return max(a, b)
}

// minf is the smaller value, the other one when either is NaN (unlike the builtin min)
func minf(a, b float32) float32 {
	if a != a {
		return b
	}
	if b != b {
		return a
	}
	return min(a, b)
}

func abs32(v float32) float32 {
	return float32(math.Abs(float64(v)))
}
