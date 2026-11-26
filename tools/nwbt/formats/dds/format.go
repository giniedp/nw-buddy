package dds

import (
	"encoding/binary"
	"errors"
)

const (
	// HeaderSize is the size of the magic and DDS_HEADER
	HeaderSize = 128
	// DX10HeaderSize is HeaderSize plus DDS_HEADER_DXT10
	DX10HeaderSize = 148
)

// DDS_PIXELFORMAT flags
const (
	PixelFormatAlphaPixels = 0x1
	PixelFormatFourCC      = 0x4
	PixelFormatRGB         = 0x40
	PixelFormatLuminance   = 0x20000
)

// DDS_HEADER caps2 flags
const (
	Caps2Cubemap = 0x200
	Caps2Volume  = 0x200000
)

// DXGI formats used by name
const (
	DXGIFormatR32Float     = 41
	DXGIFormatBC5SNorm     = 84
	DXGIFormatBC7UnormSRGB = 99
)

// FourCCG16R16F is the legacy FourCC value of D3DFMT_G16R16F
const FourCCG16R16F = 112

var ErrNoDX10Header = errors.New("DDS without DX10 header")

// SetDXGIFormat overwrites the DXGI format in the DX10 header of the data
func SetDXGIFormat(data []byte, format uint32) error {
	if len(data) < DX10HeaderSize || string(data[84:88]) != "DX10" {
		return ErrNoDX10Header
	}
	binary.LittleEndian.PutUint32(data[HeaderSize:], format)
	return nil
}
