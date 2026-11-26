package heightmap

import (
	"math"
	"sync"

	"github.com/ojrac/opensimplex-go"
)

const (
	noiseSide = 1024
	// the seed of the game's terrain noise generator
	noiseSeed = 0x12e3e
	// world to image scale of a lookup
	noiseSampleScale = float32(0.15)
	// octaves an fbm adds after its first sample, and their frequency step
	fbmOctaves    = 9
	fbmLacunarity = float32(2.07)
)

// the frequencies of the image's three octaves and their weights
var (
	noiseOctaves       = [3]float64{6, 12, 24}
	noiseOctaveWeights = [3]float64{1, 0.3, 0.1}
)

// cookieNoise is the game's tileable terrain noise image: three octaves of 4D OpenSimplex on a torus, normalized to
// [-1, 1]
type cookieNoise struct {
	pixels []float32
}

var sharedCookieNoise = sync.OnceValue(newCookieNoise)

func newCookieNoise() *cookieNoise {
	gen := opensimplex.New(noiseSeed)
	// the game's angle constant is tau rounded to float32
	tau := float64(float32(2 * math.Pi))
	inverseTau := 1 / (2 * math.Pi)
	sin := make([]float64, noiseSide)
	cos := make([]float64, noiseSide)
	for i := range noiseSide {
		sin[i], cos[i] = math.Sincos(float64(i) * (1.0 / noiseSide) * tau)
	}

	values := make([]float64, noiseSide*noiseSide)
	minimum, maximum := 0.0, 0.0
	for y := range noiseSide {
		for x := range noiseSide {
			value := 0.0
			for i, f := range noiseOctaves {
				value += noiseOctaveWeights[i] * gen.Eval4(
					cos[x]*f*inverseTau,
					cos[y]*f*inverseTau,
					sin[x]*f*inverseTau,
					sin[y]*f*inverseTau,
				)
			}
			minimum = min(minimum, value)
			maximum = max(maximum, value)
			values[y*noiseSide+x] = value
		}
	}
	scale := 1/(maximum-minimum) + 1/(maximum-minimum)
	pixels := make([]float32, len(values))
	for i, v := range values {
		pixels[i] = float32((v-minimum)*scale - 1)
	}
	return &cookieNoise{pixels: pixels}
}

// sample is a bilinear lookup that wraps around the image
func (n *cookieNoise) sample(x, y float32) float32 {
	offset := float32(-0.5) / noiseSide
	x = (x*noiseSampleScale + offset) * noiseSide
	y = (y*noiseSampleScale + offset) * noiseSide
	ix := floorInt32(x)
	iy := floorInt32(y)
	fx := x - float32(ix)
	fy := y - float32(iy)
	a := n.pixel(ix, iy)
	b := n.pixel(ix+1, iy)
	c := n.pixel(ix, iy+1)
	d := n.pixel(ix+1, iy+1)
	lower := (b-a)*fx + a
	upper := (d-c)*fx + c
	return (upper-lower)*fy + lower
}

// fbm sums fbmOctaves more samples at growing frequency, each weighted by jaggedness times the one before
func (n *cookieNoise) fbm(x, y float32, jaggedness float32) float32 {
	value := n.sample(x, y)
	amplitude := float32(1)
	total := float32(1)
	for range fbmOctaves {
		x *= fbmLacunarity
		y *= fbmLacunarity
		amplitude *= jaggedness
		total += amplitude
		value += n.sample(x, y) * amplitude
	}
	return value / total
}

// pixel clamps negative indices to zero and wraps the others
func (n *cookieNoise) pixel(x, y int32) float32 {
	return n.pixels[(max(y, 0)&(noiseSide-1))*noiseSide+(max(x, 0)&(noiseSide-1))]
}

func floorInt32(v float32) int32 {
	t := truncInt32(v)
	if t != math.MinInt32 && float32(t) != v && v < 0 {
		return t - 1
	}
	return t
}

// truncInt32 converts as the game's SSE truncation: out of range and NaN give math.MinInt32
func truncInt32(v float32) int32 {
	f := float64(v)
	if f >= -2147483648 && f < 2147483648 {
		return int32(f)
	}
	return math.MinInt32
}
