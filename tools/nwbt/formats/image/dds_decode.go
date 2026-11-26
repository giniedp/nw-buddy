package image

import (
	"encoding/binary"
	"errors"
	"fmt"
	goimage "image"
	"math"
	"nw-buddy/tools/formats/dds"

	"github.com/woozymasta/bcn"
	"golang.org/x/image/draw"
)

var ErrUnsupportedDDSFormat = errors.New("unsupported DDS format")

// DecodeDDSOptions configures DecodeDDS
type DecodeDDSOptions struct {
	// NormalMap rebuilds z from x and y, the result is RGB as Blender reads normal maps:
	//   - signed sources: [-1, 1] mapped to [0, 1] first
	//   - unsigned sources: read as [0, 1] → [-1, 1]
	//   - alpha: 255
	NormalMap bool
	// MaxSize limits width and height: the largest mip within the limit, resized when no mip fits (0: no limit)
	MaxSize int
}

// DecodeDDS decodes the largest mip (within MaxSize) of a DDS file. Cubemaps and arrays give their first face,
// volumes their first slice. The image type:
//   - one channel formats (BC4, R8, L8): *image.Gray
//   - BC6H: *image.NRGBA64, see decodeBC6H
//   - float formats: see decodeFloats
//   - all others: *image.NRGBA with the stored bytes (sRGB stays sRGB)
func DecodeDDS(data []byte, opts DecodeDDSOptions) (goimage.Image, error) {
	layout, err := readDDSLayout(data)
	if err != nil {
		return nil, err
	}
	w, h := layout.width, layout.height
	// float formats bcn doesn't read (engine textures)
	if layout.floatChannels > 0 {
		if len(data) < layout.headerLen+w*h*4 {
			return nil, fmt.Errorf("DDS data too short for a %dx%d float mip", w, h)
		}
		return fitSize(decodeFloats(data[layout.headerLen:], w, h, layout.floatChannels, layout.floatChannels == 2), opts.MaxSize), nil
	}
	format := layout.format
	level := 0
	for opts.MaxSize > 0 && max(w, h) > opts.MaxSize && level < layout.mips-1 {
		level++
		w = max(w/2, 1)
		h = max(h/2, 1)
	}
	payload, err := layout.mip(data, level)
	if err != nil {
		return nil, err
	}

	switch format {
	case bcn.FormatBC6HU, bcn.FormatBC6HS:
		img, err := decodeBC6H(payload, w, h, format == bcn.FormatBC6HS)
		if err != nil {
			return nil, err
		}
		return fitSize(img, opts.MaxSize), nil
	}

	img, err := bcn.DecodeImage(payload, w, h, format)
	if err != nil {
		return nil, err
	}
	if opts.MaxSize > 0 && max(w, h) > opts.MaxSize {
		img = fitSize(img, opts.MaxSize).(*goimage.NRGBA)
	}
	if opts.NormalMap {
		reconstructZ(img)
		return img, nil
	}
	if isOneChannel(format) {
		return grayOf(img, 0), nil
	}
	if format == bcn.FormatA8 {
		// alpha only data (attached alpha, masks): the consumers read the red channel of an alpha image
		return grayOf(img, 3), nil
	}
	return img, nil
}

// ddsLayout is where the mips of the first face of a DDS file are
type ddsLayout struct {
	format        bcn.Format
	width, height int
	mips          int
	headerLen     int
	// floatChannels is 1 (R32_FLOAT) or 2 (G16R16F) for the float formats bcn doesn't read, format is unknown then
	floatChannels int
}

func readDDSLayout(data []byte) (ddsLayout, error) {
	meta, err := dds.ParseMeta(data)
	if err != nil {
		return ddsLayout{}, err
	}
	header := meta.Header
	res := ddsLayout{
		width:     int(max(header.Width, 1)),
		height:    int(max(header.Height, 1)),
		mips:      int(max(header.MipMapCount, 1)),
		headerLen: meta.HeaderSize,
	}
	dxgi, dx10 := meta.DXGIFormat()
	if dx10 && dxgi == dds.DXGIFormatR32Float {
		res.floatChannels = 1
		return res, nil
	}
	fourCC := binary.LittleEndian.Uint32(header.PixelFormat.FourCC[:])
	if !dx10 && meta.IsCompressed() && fourCC == dds.FourCCG16R16F {
		res.floatChannels = 2
		return res, nil
	}
	res.format, err = bcnFormatOf(header.PixelFormat, dx10, dxgi)
	return res, err
}

// mip is the data of a mip level of the first face
func (l ddsLayout) mip(data []byte, level int) ([]byte, error) {
	w, h := l.width, l.height
	offset := l.headerLen
	for range level {
		offset += mipBytes(l.format, w, h)
		w = max(w/2, 1)
		h = max(h/2, 1)
	}
	size := mipBytes(l.format, w, h)
	if len(data) < offset+size {
		return nil, fmt.Errorf("DDS data too short: %d bytes for the %dx%d %s mip %d", len(data)-offset, w, h, l.format, level)
	}
	return data[offset : offset+size], nil
}

// DecodeDDSNormalMips decodes every mip of a normal map (any two or three channel format) with z rebuilt, see
// DecodeDDSOptions.NormalMap
func DecodeDDSNormalMips(data []byte) ([]*goimage.NRGBA, error) {
	layout, err := readDDSLayout(data)
	if err != nil {
		return nil, err
	}
	if layout.floatChannels > 0 {
		return nil, fmt.Errorf("%w: float normal map", ErrUnsupportedDDSFormat)
	}
	res := make([]*goimage.NRGBA, 0, layout.mips)
	w, h := layout.width, layout.height
	for level := range layout.mips {
		payload, err := layout.mip(data, level)
		if err != nil {
			return nil, err
		}
		img, err := bcn.DecodeImage(payload, w, h, layout.format)
		if err != nil {
			return nil, err
		}
		reconstructZ(img)
		res = append(res, img)
		w = max(w/2, 1)
		h = max(h/2, 1)
	}
	return res, nil
}

// fitSize scales the image down to fit maxSize (keeping the aspect), as is when it fits. The result has the type of
// the input (NRGBA or NRGBA64).
func fitSize(img goimage.Image, maxSize int) goimage.Image {
	r := img.Bounds()
	if maxSize <= 0 || max(r.Dx(), r.Dy()) <= maxSize {
		return img
	}
	w, h := maxSize, maxSize
	if r.Dx() > r.Dy() {
		h = max(1, r.Dy()*maxSize/r.Dx())
	} else {
		w = max(1, r.Dx()*maxSize/r.Dy())
	}
	var dst draw.Image
	switch img.(type) {
	case *goimage.NRGBA64, *goimage.Gray16:
		dst = goimage.NewNRGBA64(goimage.Rect(0, 0, w, h))
	default:
		dst = goimage.NewNRGBA(goimage.Rect(0, 0, w, h))
	}
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, r, draw.Src, nil)
	return dst
}

// bcnFormatOf maps the DDS pixel format onto a bcn format: DX10 DXGI formats, the legacy FourCCs and the bit mask
// formats of the game files (A8R8G8B8, R8G8B8, L8 / A8)
func bcnFormatOf(pf dds.PixelFormat, dx10 bool, dxgi uint32) (bcn.Format, error) {
	if dx10 {
		switch dxgi {
		case 24:
			return bcn.FormatRGB10A2, nil
		case 28, 29:
			return bcn.FormatRGBA8, nil
		case 49:
			return bcn.FormatRG8, nil
		case 51:
			return bcn.FormatRG8S, nil
		case 61:
			return bcn.FormatR8, nil
		case 63:
			return bcn.FormatR8S, nil
		case 65:
			return bcn.FormatA8, nil
		case 71, 72:
			return bcn.FormatBC1, nil
		case 74, 75:
			return bcn.FormatBC2, nil
		case 77, 78:
			return bcn.FormatBC3, nil
		case 80:
			return bcn.FormatBC4, nil
		case 81:
			return bcn.FormatBC4S, nil
		case 83:
			return bcn.FormatBC5, nil
		case 84:
			return bcn.FormatBC5S, nil
		case 85:
			return bcn.FormatRGB565, nil
		case 86:
			return bcn.FormatRGBA5551, nil
		case 87, 91:
			return bcn.FormatBGRA8, nil
		case 88, 93:
			return bcn.FormatBGRX8, nil
		case 95:
			return bcn.FormatBC6HU, nil
		case 96:
			return bcn.FormatBC6HS, nil
		case 98, 99:
			return bcn.FormatBC7, nil
		case 115:
			return bcn.FormatRGBA4444, nil
		}
		return bcn.FormatUnknown, fmt.Errorf("%w: %s", ErrUnsupportedDDSFormat, dds.DXGIFormatName(dxgi))
	}
	if pf.Flags&dds.PixelFormatFourCC != 0 {
		switch string(pf.FourCC[:]) {
		case "DXT1":
			return bcn.FormatBC1, nil
		case "DXT2", "DXT3":
			return bcn.FormatBC2, nil
		case "DXT4", "DXT5":
			return bcn.FormatBC3, nil
		case "ATI1", "BC4U":
			return bcn.FormatBC4, nil
		case "BC4S":
			return bcn.FormatBC4S, nil
		case "ATI2", "BC5U":
			return bcn.FormatBC5, nil
		case "BC5S":
			return bcn.FormatBC5S, nil
		}
		return bcn.FormatUnknown, fmt.Errorf("%w: FourCC %q", ErrUnsupportedDDSFormat, string(pf.FourCC[:]))
	}
	switch pf.RGBBitCount {
	case 32:
		if pf.RBitMask == 0x000000ff && pf.GBitMask == 0x0000ff00 && pf.BBitMask == 0x00ff0000 {
			if pf.Flags&dds.PixelFormatAlphaPixels != 0 {
				return bcn.FormatRGBA8, nil
			}
		}
		if pf.RBitMask == 0x00ff0000 && pf.GBitMask == 0x0000ff00 && pf.BBitMask == 0x000000ff {
			if pf.Flags&dds.PixelFormatAlphaPixels != 0 {
				return bcn.FormatBGRA8, nil
			}
			return bcn.FormatBGRX8, nil
		}
	case 24:
		if pf.RBitMask == 0x000000ff && pf.GBitMask == 0x0000ff00 && pf.BBitMask == 0x00ff0000 {
			return bcn.FormatRGB8, nil
		}
		if pf.RBitMask == 0x00ff0000 && pf.GBitMask == 0x0000ff00 && pf.BBitMask == 0x000000ff {
			return bcn.FormatBGR8, nil
		}
	case 8:
		if pf.Flags&(dds.PixelFormatLuminance|dds.PixelFormatRGB) != 0 && pf.RBitMask == 0xff {
			return bcn.FormatR8, nil
		}
		if pf.ABitMask == 0xff {
			return bcn.FormatA8, nil
		}
	}
	return bcn.FormatUnknown, fmt.Errorf("%w: %d bit masks r%08x g%08x b%08x a%08x", ErrUnsupportedDDSFormat,
		pf.RGBBitCount, pf.RBitMask, pf.GBitMask, pf.BBitMask, pf.ABitMask)
}

// mipBytes is the data size of one mip level
func mipBytes(format bcn.Format, w, h int) int {
	blocks := ((w + 3) / 4) * ((h + 3) / 4)
	switch format {
	case bcn.FormatBC1, bcn.FormatBC4, bcn.FormatBC4S:
		return blocks * 8
	case bcn.FormatBC2, bcn.FormatBC3, bcn.FormatBC5, bcn.FormatBC5S, bcn.FormatBC6HU, bcn.FormatBC6HS, bcn.FormatBC7:
		return blocks * 16
	case bcn.FormatR8, bcn.FormatR8S, bcn.FormatA8:
		return w * h
	case bcn.FormatRG8, bcn.FormatRG8S, bcn.FormatRGB565, bcn.FormatRGBA5551, bcn.FormatRGBA4444:
		return w * h * 2
	case bcn.FormatRGB8, bcn.FormatBGR8:
		return w * h * 3
	default:
		return w * h * 4
	}
}

func isOneChannel(format bcn.Format) bool {
	switch format {
	case bcn.FormatBC4, bcn.FormatBC4S, bcn.FormatR8, bcn.FormatR8S:
		return true
	}
	return false
}

// grayOf keeps one channel: red (bcn replicates one channel formats to RGB) or alpha (A8)
func grayOf(img *goimage.NRGBA, channel int) *goimage.Gray {
	res := goimage.NewGray(img.Rect)
	for i, j := 0, channel; i < len(res.Pix); i, j = i+1, j+4 {
		res.Pix[i] = img.Pix[j]
	}
	return res
}

// reconstructZ rebuilds the blue channel of a normal map from red and green, alpha becomes 255
func reconstructZ(img *goimage.NRGBA) {
	for i := 0; i+3 < len(img.Pix); i += 4 {
		x := float64(img.Pix[i])/127.5 - 1
		y := float64(img.Pix[i+1])/127.5 - 1
		z := math.Sqrt(max(0, 1-x*x-y*y))
		img.Pix[i+2] = uint8(math.Round((z*0.5 + 0.5) * 255))
		img.Pix[i+3] = 255
	}
}

// decodeBC6H decodes HDR blocks to 16 bit RGBA, clamped to 0..1 and sRGB encoded: a display image of the linear
// HDR data
func decodeBC6H(payload []byte, w, h int, signed bool) (*goimage.NRGBA64, error) {
	rgba, err := bcn.DecodeBC6HFloat32(payload, w, h, signed)
	if err != nil {
		return nil, err
	}
	res := goimage.NewNRGBA64(goimage.Rect(0, 0, w, h))
	channels := len(rgba) / (w * h)
	for p := 0; p < w*h; p++ {
		for c := 0; c < 4; c++ {
			v := 1.0
			if c < channels {
				v = linearToSRGB(min(max(float64(rgba[p*channels+c]), 0), 1))
			}
			u := uint16(math.Round(v * 65535))
			binary.BigEndian.PutUint16(res.Pix[p*8+c*2:], u)
		}
	}
	return res, nil
}

// decodeFloats reads 32 bit (or 16 bit half) floats with 1 or 2 channels into a 16 bit image clamped to 0..1:
// one channel gives *image.Gray16, two channels *image.NRGBA64 with blue 0 and alpha 1
func decodeFloats(payload []byte, w, h, channels int, half bool) goimage.Image {
	size := 4
	if half {
		size = 2
	}
	read := func(i int) uint16 {
		var v float64
		if half {
			v = float64(halfToFloat32(binary.LittleEndian.Uint16(payload[i*size:])))
		} else {
			v = float64(math.Float32frombits(binary.LittleEndian.Uint32(payload[i*size:])))
		}
		return uint16(math.Round(min(max(v, 0), 1) * 65535))
	}
	if channels == 1 {
		res := goimage.NewGray16(goimage.Rect(0, 0, w, h))
		for p := 0; p < w*h; p++ {
			binary.BigEndian.PutUint16(res.Pix[p*2:], read(p))
		}
		return res
	}
	res := goimage.NewNRGBA64(goimage.Rect(0, 0, w, h))
	for p := 0; p < w*h; p++ {
		binary.BigEndian.PutUint16(res.Pix[p*8:], read(p*2))
		binary.BigEndian.PutUint16(res.Pix[p*8+2:], read(p*2+1))
		binary.BigEndian.PutUint16(res.Pix[p*8+6:], 0xffff)
	}
	return res
}

// halfToFloat32 converts an IEEE 754 half float
func halfToFloat32(h uint16) float32 {
	sign := uint32(h>>15) << 31
	exp := uint32(h>>10) & 0x1f
	mant := uint32(h) & 0x3ff
	switch {
	case exp == 0 && mant == 0:
		return math.Float32frombits(sign)
	case exp == 0:
		// subnormal
		v := float32(mant) / 1024 / 16384
		if sign != 0 {
			return -v
		}
		return v
	case exp == 0x1f:
		return math.Float32frombits(sign | 0x7f800000 | mant<<13)
	}
	return math.Float32frombits(sign | (exp+112)<<23 | mant<<13)
}

// linearToSRGB is the sRGB transfer function of a value in 0..1
func linearToSRGB(v float64) float64 {
	if v <= 0.0031308 {
		return v * 12.92
	}
	return 1.055*math.Pow(v, 1/2.4) - 0.055
}
