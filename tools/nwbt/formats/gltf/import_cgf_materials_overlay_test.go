package gltf

import (
	"image/color"
	"math"
	"testing"
)

func near(a, b float64) bool {
	return math.Abs(a-b) < 1e-6
}

func TestOverlayAlbedo(t *testing.T) {
	o := overlayMask{
		colors:    [3][3]float64{{0.5, 0.2, 0.1}},
		overrides: [3]float64{1},
		strengths: [3]float64{1},
	}
	// the R mask fully on with override 1: the color squared
	got := o.albedo([3]float64{0.3, 0.3, 0.3}, color.NRGBA{R: 255})
	if !near(got[0], 0.25) || !near(got[1], 0.04) || !near(got[2], 0.01) {
		t.Errorf("override: got %v", got)
	}
	// no mask: the albedo stays
	got = o.albedo([3]float64{0.3, 0.3, 0.3}, color.NRGBA{})
	if !near(got[0], 0.3) {
		t.Errorf("no mask: got %v", got)
	}
	// override 0: the overlay blend of the luminance (0.3 < 0.5: multiply)
	o.overrides[0] = 0
	got = o.albedo([3]float64{0.3, 0.3, 0.3}, color.NRGBA{R: 255})
	if !near(got[0], 2*0.3*0.5) {
		t.Errorf("overlay: got %v", got)
	}
}

func TestOverlayGloss(t *testing.T) {
	o := overlayMask{gloss: 1, shift: 1}
	// shift 1 pulls to full gloss where the alpha is on
	if got := o.shiftGloss(0.4, color.NRGBA{A: 255}); !near(got, 1) {
		t.Errorf("shift 1: got %v", got)
	}
	o.shift = 0.5
	if got := o.shiftGloss(0.4, color.NRGBA{A: 255}); !near(got, 0.4) {
		t.Errorf("neutral: got %v", got)
	}
}
