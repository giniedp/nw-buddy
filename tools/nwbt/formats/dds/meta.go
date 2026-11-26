package dds

import (
	"fmt"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/buf"
)

type Meta struct {
	Header     Header
	DX10Header *DX10Header
	HeaderSize int

	Data []byte
}

func LoadMeta(f nwfs.File) (*Meta, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return ParseMeta(data)
}

// ParseMeta reads the headers of DDS data, Data keeps the data
func ParseMeta(data []byte) (res *Meta, err error) {
	res = &Meta{}
	res.Data = data

	r := buf.NewReaderLE(data)
	header, err := readHeader(r)
	if err != nil {
		return nil, err
	}
	res.Header = header
	if header.PixelFormat.IsDX10() {
		dx10, err := readDX10Header(r)
		if err != nil {
			return nil, err
		}
		res.DX10Header = &dx10
	}
	res.HeaderSize = r.Pos()
	return
}

func (it *Meta) Stats() map[string]any {
	pf := it.Header.PixelFormat
	stats := map[string]any{
		"width":       it.Header.Width,
		"height":      it.Header.Height,
		"depth":       it.Header.Depth,
		"mipMapCount": it.Header.MipMapCount,
		"format":      it.FormatName(),
		"compression": it.IsCompressed(),
		"cubemap":     it.IsCubemap(),
		"volume":      it.IsVolume(),
		"hasAlpha":    pf.Flags&PixelFormatAlphaPixels != 0,
		"headerSize":  it.HeaderSize,
		"dataSize":    len(it.Data) - it.HeaderSize,
	}
	if it.DX10Header != nil {
		stats["dxgiFormat"] = it.DX10Header.DxgiFormat
		stats["resourceDimension"] = dxgiDimensionName(it.DX10Header.ResourceDimension)
		stats["arraySize"] = it.DX10Header.ArraySize
	}
	return stats
}

func dxgiDimensionName(dim uint32) string {
	switch dim {
	case 2:
		return "1D"
	case 3:
		return "2D"
	case 4:
		return "3D"
	default:
		return fmt.Sprintf("DIM_%d", dim)
	}
}
func (it *Meta) IsCompressed() bool {
	return it.Header.PixelFormat.Flags&PixelFormatFourCC != 0
}

func (it *Meta) IsCubemap() bool {
	return it.Header.Caps2&Caps2Cubemap != 0
}

func (it *Meta) IsVolume() bool {
	return it.Header.Caps2&Caps2Volume != 0
}

// DXGIFormat is the format of the DX10 header, false without one
func (it *Meta) DXGIFormat() (uint32, bool) {
	if it.DX10Header == nil {
		return 0, false
	}
	return it.DX10Header.DxgiFormat, true
}

func (it *Meta) FormatName() string {
	pf := it.Header.PixelFormat
	if pf.IsDX10() {
		if it.DX10Header != nil {
			return DXGIFormatName(it.DX10Header.DxgiFormat)
		}
		return "DX10"
	}
	if pf.Flags&PixelFormatFourCC != 0 {
		return string(pf.FourCC[:])
	}
	// Uncompressed — derive from bit masks
	switch pf.RGBBitCount {
	case 32:
		return "A8R8G8B8"
	case 24:
		return "R8G8B8"
	case 16:
		return "R5G6B5"
	default:
		return fmt.Sprintf("RGB%d", pf.RGBBitCount)
	}
}

// DXGIFormatName is the name of a DXGI format, e.g. BC7_UNORM_SRGB
func DXGIFormatName(format uint32) string {
	names := map[uint32]string{
		0:  "UNKNOWN",
		2:  "R32G32B32A32_FLOAT",
		10: "R16G16B16A16_FLOAT",
		28: "R8G8B8A8_UNORM",
		29: "R8G8B8A8_UNORM_SRGB",
		71: "BC1_UNORM",
		72: "BC1_UNORM_SRGB",
		74: "BC2_UNORM",
		75: "BC2_UNORM_SRGB",
		77: "BC3_UNORM",
		78: "BC3_UNORM_SRGB",
		80: "BC4_UNORM",
		81: "BC4_SNORM",
		83: "BC5_UNORM",
		84: "BC5_SNORM",
		87: "B8G8R8A8_UNORM",
		91: "B8G8R8A8_UNORM_SRGB",
		95: "BC6H_UF16",
		96: "BC6H_SF16",
		98: "BC7_UNORM",
		99: "BC7_UNORM_SRGB",
	}
	if name, ok := names[format]; ok {
		return name
	}
	return fmt.Sprintf("DXGI_%d", format)
}
