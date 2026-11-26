package image_test

import (
	"bytes"
	goimage "image"
	"image/color"
	"image/png"
	"nw-buddy/tools/formats/image"
	"testing"

	"github.com/deepteams/webp"
	"github.com/stretchr/testify/require"
)

// 16 bit images (BC6H decodes to NRGBA64) encode to WebP as 8 bit
func TestConvertPNG16BitToWebp(t *testing.T) {
	src := goimage.NewNRGBA64(goimage.Rect(0, 0, 64, 32))
	for y := range 32 {
		for x := range 64 {
			src.SetNRGBA64(x, y, color.NRGBA64{uint16(x * 1024), uint16(y * 2048), 0x8000, 0xffff})
		}
	}
	buf := new(bytes.Buffer)
	require.NoError(t, png.Encode(buf, src))
	out, err := image.ConvertPNG(buf.Bytes(), image.FormatWEBP)
	require.NoError(t, err)
	img, err := webp.Decode(bytes.NewReader(out))
	require.NoError(t, err)
	require.Equal(t, src.Bounds(), img.Bounds())
	r, g, _, _ := img.At(63, 31).RGBA()
	require.Greater(t, r, uint32(0xc000))
	require.Greater(t, g, uint32(0xc000))
}
