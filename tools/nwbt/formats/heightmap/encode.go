package heightmap

import (
	"image/color"
)

func EncodeHeightToNRGBA(v float32) color.NRGBA {
	out := color.NRGBA{}
	value := uint32((v / 0xFFFF) * 0xFFFFFF)
	out.R = uint8(value >> 16)
	out.G = uint8(value >> 8)
	out.B = uint8(value)
	out.A = 0xff
	return out
}

func EncodeHeightToRGBA(v float32) color.RGBA {
	out := color.RGBA{}
	value := uint32((v / 0xFFFF) * 0xFFFFFF)
	out.R = uint8(value >> 16)
	out.G = uint8(value >> 8)
	out.B = uint8(value)
	out.A = 0xff
	return out
}
