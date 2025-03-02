package heightmap

import (
	"image/color"
)

func EncodeHeightToR8G8B8(v float32) color.RGBA {
	out := color.RGBA{}
	value := uint32((v / 0xFFFF) * 0xFFFFFF)
	out.R = uint8(value >> 16)
	out.G = uint8(value >> 8)
	out.B = uint8(value)
	out.A = 0xff
	return out
}
