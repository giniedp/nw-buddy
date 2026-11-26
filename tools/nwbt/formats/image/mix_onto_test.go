package image

import (
	"image"
	"testing"
)

func TestScaleStraightKeepsRgbUnderLowAlpha(t *testing.T) {
	src := image.NewNRGBA(image.Rect(0, 0, 2, 2))
	for i := 0; i < len(src.Pix); i += 4 {
		// a dye mask: full R, an almost transparent gloss mask in alpha
		src.Pix[i], src.Pix[i+1], src.Pix[i+2], src.Pix[i+3] = 255, 0, 0, 1
	}
	dst := scaleStraight(src, 8, 8)
	for i := 0; i < len(dst.Pix); i += 4 {
		if dst.Pix[i] != 255 || dst.Pix[i+3] != 1 {
			t.Fatalf("pixel %d: got %v", i/4, dst.Pix[i:i+4])
		}
	}
}
