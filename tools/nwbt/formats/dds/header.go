package dds

import (
	"fmt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type Header struct {
	Size              uint32
	Flags             uint32
	Height            uint32
	Width             uint32
	PitchOrLinearSize uint32
	Depth             uint32
	MipMapCount       uint32
	Reserved          [11]uint32
	PixelFormat       PixelFormat
	Caps              uint32
	Caps2             uint32
	Caps3             uint32
	Caps4             uint32
	Reserved6         uint32
}

type DX10Header struct {
	DxgiFormat        uint32
	ResourceDimension uint32
	MiscFlag          uint32
	ArraySize         uint32
	MiscFlags2        uint32
}

type PixelFormat struct {
	Size        uint32
	Flags       uint32
	FourCC      [4]byte
	RGBBitCount uint32
	RBitMask    uint32
	GBitMask    uint32
	BBitMask    uint32
	ABitMask    uint32
}

func (it *PixelFormat) IsDX10() bool {
	return it.FourCC[0] == 'D' && it.FourCC[1] == 'X' && it.FourCC[2] == '1' && it.FourCC[3] == '0'
}

func ParseHeader(data []byte) (res Header, err error) {
	return readHeader(buf.NewReaderLE(data))
}

func readHeader(r *buf.Reader) (res Header, err error) {
	defer utils.HandleRecover(&err)

	magic := r.MustReadBytes(4)
	if string(magic) != "DDS " {
		return res, fmt.Errorf("expected magic bytes to be 'DDS ' but was '%s'", magic)
	}
	res.Size = r.MustReadUint32()
	res.Flags = r.MustReadUint32()
	res.Height = r.MustReadUint32()
	res.Width = r.MustReadUint32()
	res.PitchOrLinearSize = r.MustReadUint32()
	res.Depth = r.MustReadUint32()
	res.MipMapCount = r.MustReadUint32()
	for i := range 11 {
		res.Reserved[i] = r.MustReadUint32()
	}
	res.PixelFormat.Size = r.MustReadUint32()
	res.PixelFormat.Flags = r.MustReadUint32()
	for i := range 4 {
		res.PixelFormat.FourCC[i] = r.MustReadByte()
	}
	res.PixelFormat.RGBBitCount = r.MustReadUint32()
	res.PixelFormat.RBitMask = r.MustReadUint32()
	res.PixelFormat.GBitMask = r.MustReadUint32()
	res.PixelFormat.BBitMask = r.MustReadUint32()
	res.PixelFormat.ABitMask = r.MustReadUint32()
	res.Caps = r.MustReadUint32()
	res.Caps2 = r.MustReadUint32()
	res.Caps3 = r.MustReadUint32()
	res.Caps4 = r.MustReadUint32()
	res.Reserved6 = r.MustReadUint32()

	return res, nil
}

func readDX10Header(r *buf.Reader) (res DX10Header, err error) {
	defer utils.HandleRecover(&err)

	res.DxgiFormat = r.MustReadUint32()
	res.ResourceDimension = r.MustReadUint32()
	res.MiscFlag = r.MustReadUint32()
	res.ArraySize = r.MustReadUint32()
	res.MiscFlags2 = r.MustReadUint32()

	return res, nil
}
