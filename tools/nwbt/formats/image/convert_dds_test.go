package image_test

import (
	"bytes"
	"encoding/binary"
	goimage "image"
	"image/color"
	"image/png"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/image"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// DDS targets for Blender: BC5_SNORM normal maps are converted, the rest stays as stored, bakes are encoded
// png → DDS.

// ddsFormat returns the DXGI format, also of legacy headers (FourCC BC5U, bit mask RGBA8)
func ddsFormat(t *testing.T, data []byte) (dxgi uint32, width uint32, mips uint32) {
	header, err := dds.ParseHeader(data)
	require.NoError(t, err)
	pf := header.PixelFormat
	switch {
	case pf.IsDX10():
		dxgi = binary.LittleEndian.Uint32(data[128:])
	case string(pf.FourCC[:]) == "BC5U" || string(pf.FourCC[:]) == "ATI2":
		dxgi = 83
	case pf.RGBBitCount == 32 && pf.RBitMask == 0xff && pf.ABitMask == 0xff000000:
		dxgi = 28
	default:
		t.Fatalf("unexpected DDS pixel format %+v", pf)
	}
	return dxgi, header.Width, header.MipMapCount
}

func TestConvertDDSNormalFormats(t *testing.T) {
	data, err := os.ReadFile("./sample/fish_ddna.dds")
	require.NoError(t, err)
	srcFormat, srcWidth, srcMips := ddsFormat(t, data)
	require.Equal(t, uint32(84), srcFormat, "sample is BC5_SNORM")

	// keep: the bytes as stored (the viewers read BC5_SNORM)
	keep, err := image.ConvertDDS(data, image.FormatDDS)
	require.NoError(t, err)
	assert.Equal(t, data, keep)

	// RGBA8 with z, every mip: as Blender reads normal maps
	out, err := image.ConvertDDS(data, image.FormatDDS,
		image.WithNormalFormat(image.NormalFormatRGBA8))
	require.NoError(t, err)
	dxgi, width, mips := ddsFormat(t, out)
	assert.Equal(t, uint32(28), dxgi) // R8G8B8A8_UNORM
	assert.Equal(t, srcWidth, width)
	assert.Equal(t, srcMips, mips)
	// a flat area keeps z near 1 (blue near 255), never 0 of a two channel format
	mipsImg, err := image.DecodeDDSNormalMips(data)
	require.NoError(t, err)
	assert.Len(t, mipsImg, int(max(srcMips, 1)))
	last := mipsImg[len(mipsImg)-1]
	assert.Greater(t, last.Pix[2], uint8(128))

	// other formats pass unchanged, even with a normal format
	diff, err := os.ReadFile("./sample/fish_diff.dds")
	require.NoError(t, err)
	out, err = image.ConvertDDS(diff, image.FormatDDS,
		image.WithNormalFormat(image.NormalFormatRGBA8))
	require.NoError(t, err)
	assert.Equal(t, diff, out)
}

func TestConvertPNGToDDS(t *testing.T) {
	diff, err := os.ReadFile("./sample/fish_diff.dds")
	require.NoError(t, err)
	diffPng, err := image.ConvertDDS(diff, image.FormatPNG)
	require.NoError(t, err)
	// the bakes are png bytes from Go's encoder (MapPngImage / MixPngImages)
	srcPng, err := image.MapPngImage(diffPng, func(c color.NRGBA) color.NRGBA { return c })
	require.NoError(t, err)

	cases := []struct {
		format string
		srgb   bool
		dxgi   uint32
	}{
		{"BC7_UNORM", false, 98},
		{"BC7_UNORM_SRGB", true, 99},
	}
	for _, c := range cases {
		out, err := image.ConvertPNG(srcPng, image.FormatDDS,
			image.WithDDSFormat(c.format), image.WithSRGB(c.srgb))
		require.NoError(t, err, c.format)
		dxgi, _, mips := ddsFormat(t, out)
		assert.Equal(t, c.dxgi, dxgi, c.format)
		assert.Greater(t, mips, uint32(1), c.format)

		// the stored bytes survive the round trip (no color space conversion), up to the BC7 error
		back, err := image.ConvertDDS(out, image.FormatPNG)
		require.NoError(t, err, c.format)
		a, b := meanRGB(t, srcPng), meanRGB(t, back)
		for i := range a {
			assert.InDelta(t, a[i], b[i], 2, "%s channel %d mean", c.format, i)
		}
	}
}

func meanRGB(t *testing.T, data []byte) [3]float64 {
	img, err := png.Decode(bytes.NewReader(data))
	require.NoError(t, err)
	bounds := img.Bounds()
	nrgba := goimage.NewNRGBA(bounds)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			nrgba.Set(x, y, img.At(x, y))
		}
	}
	var sum [3]float64
	for i := 0; i < len(nrgba.Pix); i += 4 {
		sum[0] += float64(nrgba.Pix[i])
		sum[1] += float64(nrgba.Pix[i+1])
		sum[2] += float64(nrgba.Pix[i+2])
	}
	n := float64(len(nrgba.Pix) / 4)
	return [3]float64{sum[0] / n, sum[1] / n, sum[2] / n}
}
