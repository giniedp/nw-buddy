package img

import (
	"image"
	"image/color"
)

func UpscaleMajority(src image.Image, scale int) *image.RGBA {
	b := src.Bounds()
	w := b.Dx()
	h := b.Dy()

	dstW := w * scale
	dstH := h * scale
	dst := image.NewRGBA(image.Rect(0, 0, dstW, dstH))

	// For each destination pixel
	for y := range dstH {
		for x := range dstW {
			// Map back to source region
			srcX0 := x / scale
			srcY0 := y / scale

			// Count frequency of colors in this block
			counts := make(map[color.Color]int)
			for yy := range scale {
				for xx := range scale {
					sx := srcX0
					sy := srcY0
					c := src.At(sx+xx, sy+yy)
					counts[c]++
				}
			}

			// Pick most frequent color
			var best color.Color
			bestCount := -1
			for c, cnt := range counts {
				if cnt > bestCount {
					bestCount = cnt
					best = c
				}
			}

			dst.Set(x, y, best)
		}
	}
	return dst
}
