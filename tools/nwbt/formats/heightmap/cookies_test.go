package heightmap

import (
	"testing"
)

// a 16 m region of 100 m terrain, mountain height 65535 (one unit per metre)
const testMountainHeight = 65535

func newTestRegion() *Region {
	r := &Region{Size: 16, Data: make([]uint16, 16*16)}
	for i := range r.Data {
		r.Data[i] = 100
	}
	return r
}

func testCookie(z float32) Cookie {
	return Cookie{X: 8, Y: 8, Z: z, InnerRadius: 2, OuterRadius: 4, MaxHeightBlend: 1, EdgeNoiseFeatureSize: 4}
}

// sampleAt reads column x, row y in world order (row 0 is the region's minimum y)
func sampleAt(r *Region, x, y int) uint16 {
	return r.Data[(r.Size-1-y)*r.Size+x]
}

func TestApplyCookies(t *testing.T) {
	t.Run("samples evaluate half a cell past their corner", func(t *testing.T) {
		r := newTestRegion()
		r.ApplyCookies([]Cookie{testCookie(200)}, testMountainHeight)
		// raster sample (7, 7) evaluates world (8, 8)
		if got := sampleAt(r, 7, 7); got != 200 {
			t.Errorf("center: got %d, want 200", got)
		}
		if got := sampleAt(r, 0, 0); got != 100 {
			t.Errorf("corner: got %d, want 100", got)
		}
		if got := sampleAt(r, 11, 7); got != 100 {
			t.Errorf("outside: got %d, want 100", got)
		}
		if got := sampleAt(r, 10, 7); got <= 100 {
			t.Errorf("transition: got %d, want > 100", got)
		}
	})

	t.Run("ascending z and saturated blend", func(t *testing.T) {
		r := newTestRegion()
		high := testCookie(300)
		high.MaxHeightBlend = 50
		r.ApplyCookies([]Cookie{high, testCookie(200)}, testMountainHeight)
		if got := sampleAt(r, 7, 7); got != 300 {
			t.Errorf("got %d, want 300", got)
		}
	})

	t.Run("equal radii and zero feature size", func(t *testing.T) {
		hard := testCookie(200)
		hard.InnerRadius = 4
		hard.OuterRadius = 4
		r := newTestRegion()
		r.ApplyCookies([]Cookie{hard}, testMountainHeight)
		if got := sampleAt(r, 7, 7); got != 200 {
			t.Errorf("center: got %d, want 200", got)
		}
		if got := sampleAt(r, 12, 7); got != 100 {
			t.Errorf("outside: got %d, want 100", got)
		}
		// raster corner (4, 4) evaluates world (5, 5), outside the hard edge
		if got := sampleAt(r, 4, 4); got != 100 {
			t.Errorf("raster corner: got %d, want 100", got)
		}
		// a zero feature size makes the displacement NaN: the whole raster span takes the cookie's height
		hard.EdgeNoiseFeatureSize = 0
		r = newTestRegion()
		r.ApplyCookies([]Cookie{hard}, testMountainHeight)
		if got := sampleAt(r, 7, 7); got != 200 {
			t.Errorf("NaN center: got %d, want 200", got)
		}
		if got := sampleAt(r, 4, 4); got != 200 {
			t.Errorf("NaN raster corner: got %d, want 200", got)
		}
	})

	t.Run("no positive max height blend", func(t *testing.T) {
		r := newTestRegion()
		c := testCookie(200)
		c.MaxHeightBlend = 0
		if count := r.ApplyCookies([]Cookie{c}, testMountainHeight); count != 0 || sampleAt(r, 7, 7) != 100 {
			t.Errorf("cookie without blend changed the region")
		}
	})

	t.Run("outside the region", func(t *testing.T) {
		r := newTestRegion()
		c := testCookie(200)
		c.X, c.Y = 200, 200
		if count := r.ApplyCookies([]Cookie{c}, testMountainHeight); count != 0 || sampleAt(r, 0, 0) != 100 {
			t.Errorf("distant cookie changed the region")
		}
	})
}

func TestBlendHeight(t *testing.T) {
	if got := blendHeight(100, 201.0, 0.5, 65535); got != 150 {
		t.Errorf("got %d, want 150", got)
	}
	if got := blendHeight(100, 201.7, 1.0, 65535); got != 202 {
		t.Errorf("got %d, want 202", got)
	}
}
