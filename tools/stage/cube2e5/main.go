// Decodes a BC6H cube DDS (DX10 header, DXGI 95) into raw RGB9E5 faces for `ktx create --raw`: one file per mip and
// face, `<out>/<level>_<face>.raw`. Prints the base size and the level count.
//
//	GOWORK=off go -C tmp/transmog-editor/stage/cube2e5 run . <in.dds> <out dir>   (see ../cube-ktx2.mjs)
package main

import (
	"encoding/binary"
	"fmt"
	"math"
	"os"
	"path/filepath"

	"github.com/woozymasta/bcn"
)

const headerLen = 4 + 124 + 20
const dxgiBC6HUF16 = 95

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintln(os.Stderr, "usage: cube2e5 <in.dds> <out dir>")
		os.Exit(2)
	}
	if err := convert(os.Args[1], os.Args[2]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func convert(in, out string) error {
	data, err := os.ReadFile(in)
	if err != nil {
		return err
	}
	if len(data) < headerLen || string(data[84:88]) != "DX10" {
		return fmt.Errorf("%s: no DX10 header", in)
	}
	height := int(binary.LittleEndian.Uint32(data[12:]))
	width := int(binary.LittleEndian.Uint32(data[16:]))
	levels := max(int(binary.LittleEndian.Uint32(data[28:])), 1)
	if dxgi := binary.LittleEndian.Uint32(data[128:]); dxgi != dxgiBC6HUF16 {
		return fmt.Errorf("%s: DXGI format %d, want BC6H_UF16", in, dxgi)
	}
	if err := os.MkdirAll(out, 0o755); err != nil {
		return err
	}
	// DDS cubes store face after face, each with all its mips
	offset := headerLen
	for face := range 6 {
		w, h := width, height
		for level := range levels {
			size := max((w+3)/4, 1) * max((h+3)/4, 1) * 16
			if offset+size > len(data) {
				return fmt.Errorf("%s: too short for face %d mip %d", in, face, level)
			}
			rgb, err := bcn.DecodeBC6HFloat32(data[offset:offset+size], w, h, false)
			if err != nil {
				return err
			}
			offset += size
			raw := make([]byte, w*h*4)
			for p := range w * h {
				binary.LittleEndian.PutUint32(raw[p*4:], packRGB9E5(rgb[p*3], rgb[p*3+1], rgb[p*3+2]))
			}
			name := filepath.Join(out, fmt.Sprintf("%d_%d.raw", level, face))
			if err := os.WriteFile(name, raw, 0o644); err != nil {
				return err
			}
			w = max(w/2, 1)
			h = max(h/2, 1)
		}
	}
	if offset != len(data) {
		return fmt.Errorf("%s: %d bytes left after the faces", in, len(data)-offset)
	}
	fmt.Println(width, height, levels)
	return nil
}

// packRGB9E5 packs as EXT_texture_shared_exponent: 9 bit mantissas (r low bits), 5 bit shared exponent (bias 15)
func packRGB9E5(r, g, b float32) uint32 {
	const mantissaBits = 9
	const bias = 15
	const maxValue = float64(511) / 512 * (1 << 16)
	rc := clampE5(float64(r), maxValue)
	gc := clampE5(float64(g), maxValue)
	bc := clampE5(float64(b), maxValue)
	maxRGB := max(rc, gc, bc)
	exp := 0
	if maxRGB > 0 {
		exp = max(-bias-1, int(math.Floor(math.Log2(maxRGB)))) + 1 + bias
	}
	scale := math.Exp2(float64(exp - bias - mantissaBits))
	if math.Floor(maxRGB/scale+0.5) == 1<<mantissaBits {
		exp++
		scale *= 2
	}
	rm := uint32(math.Floor(rc/scale + 0.5))
	gm := uint32(math.Floor(gc/scale + 0.5))
	bm := uint32(math.Floor(bc/scale + 0.5))
	return rm | gm<<9 | bm<<18 | uint32(exp)<<27
}

func clampE5(v, maxValue float64) float64 {
	if math.IsNaN(v) || v < 0 {
		return 0
	}
	return min(v, maxValue)
}
