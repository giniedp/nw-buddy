package heightmap_test

import (
	"bytes"
	"encoding/binary"
	"nw-buddy/tools/formats/heightmap"
	"testing"
)

// makeTIFF builds a minimal uncompressed little-endian TIFF.
func makeTIFF(pixels []byte, width, height uint32, bitsPerSample, samplesPerPixel, photometric, compression uint16) []byte {
	const entryCount = 9
	ifdOffset := uint32(8)
	ifdLen := uint32(2 + entryCount*12 + 4)
	pixelOffset := ifdOffset + ifdLen

	buf := &bytes.Buffer{}
	le := binary.LittleEndian

	writeU16 := func(v uint16) { b := [2]byte{}; le.PutUint16(b[:], v); buf.Write(b[:]) }
	writeU32 := func(v uint32) { b := [4]byte{}; le.PutUint32(b[:], v); buf.Write(b[:]) }
	entry := func(tag, typ uint16, count, value uint32) {
		writeU16(tag)
		writeU16(typ)
		writeU32(count)
		writeU32(value)
	}

	buf.WriteString("II")
	writeU16(42)
	writeU32(ifdOffset)
	writeU16(entryCount)
	entry(256, 4, 1, width)
	entry(257, 4, 1, height)
	entry(258, 3, 1, uint32(bitsPerSample))
	entry(259, 3, 1, uint32(compression))
	entry(262, 3, 1, uint32(photometric))
	entry(273, 4, 1, pixelOffset)
	entry(277, 3, 1, uint32(samplesPerPixel))
	entry(279, 4, 1, uint32(len(pixels)))
	entry(284, 3, 1, 1) // PlanarConfig = chunky
	writeU32(0)         // next IFD = none
	buf.Write(pixels)
	return buf.Bytes()
}

func u16sLE(vals []uint16) []byte {
	out := make([]byte, len(vals)*2)
	for i, v := range vals {
		binary.LittleEndian.PutUint16(out[i*2:], v)
	}
	return out
}

// tiffLZWEncode produces a valid TIFF LZW stream for arbitrary bytes.
// Uses no back-references (every byte as a literal code), so the table
// never grows past 258 entries and 9-bit codes suffice throughout.
// This exercises the decoder's clear-code and EOI handling correctly.
func tiffLZWEncode(data []byte) []byte {
	const (
		clearCode = 256
		eoiCode   = 257
	)
	codes := make([]int, 0, len(data)+2)
	codes = append(codes, clearCode)
	for _, b := range data {
		codes = append(codes, int(b))
	}
	codes = append(codes, eoiCode)

	// Pack 9-bit codes MSB-first.
	var out []byte
	var bitBuf uint32
	nBits := 0
	for _, c := range codes {
		bitBuf = (bitBuf << 9) | uint32(c)
		nBits += 9
		for nBits >= 8 {
			nBits -= 8
			out = append(out, byte(bitBuf>>uint(nBits)))
		}
	}
	if nBits > 0 {
		out = append(out, byte(bitBuf<<uint(8-nBits)))
	}
	return out
}

func TestParsesLuma16TIFF(t *testing.T) {
	pixels := u16sLE([]uint16{10, 20, 30, 40})
	data := makeTIFF(pixels, 2, 2, 16, 1, 1 /*BlackIsZero*/, 1 /*no compression*/)

	m, err := heightmap.ParseTIFF(data)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if m.Width != 2 || m.Height != 2 {
		t.Errorf("expected 2x2, got %dx%d", m.Width, m.Height)
	}
	want := []uint16{10, 20, 30, 40}
	for i, v := range want {
		if m.Samples[i] != v {
			t.Errorf("samples[%d]: want %d, got %d", i, v, m.Samples[i])
		}
	}
	if v, ok := m.SampleTopLeft(0, 0); !ok || v != 10 {
		t.Errorf("SampleTopLeft(0,0): want 10, got %d", v)
	}
	if v, ok := m.SampleTerrainXY(0, 0); !ok || v != 30 {
		t.Errorf("SampleTerrainXY(0,0): want 30, got %d", v)
	}
}

func TestExpands8BitSamplesTo16Bit(t *testing.T) {
	data := makeTIFF([]byte{0, 255}, 2, 1, 8, 1, 1, 1)
	m, err := heightmap.ParseTIFF(data)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if m.Samples[0] != 0 || m.Samples[1] != 65535 {
		t.Errorf("want [0 65535], got %v", m.Samples[:2])
	}
}

func TestPatchesSingleChannelRGBPhotometric(t *testing.T) {
	// photometric=2 (RGB) with samplesPerPixel=1 — patch should fix it.
	data := makeTIFF([]byte{100, 200}, 2, 1, 8, 1, 2 /*RGB*/, 1)
	_, err := heightmap.ParseTIFF(data)
	if err != nil {
		t.Errorf("expected patch to fix RGB+single-channel tag, got error: %v", err)
	}
}

func TestParsesLZWCompressed(t *testing.T) {
	raw := u16sLE([]uint16{1000, 2000, 3000, 4000})
	compressed := tiffLZWEncode(raw)
	data := makeTIFF(compressed, 2, 2, 16, 1, 1, 5 /*LZW*/)

	m, err := heightmap.ParseTIFF(data)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []uint16{1000, 2000, 3000, 4000}
	for i, v := range want {
		if m.Samples[i] != v {
			t.Errorf("samples[%d]: want %d, got %d", i, v, m.Samples[i])
		}
	}
}

func TestMultiChannelTakesFirstChannel(t *testing.T) {
	// RGB16: 2 pixels, 3 channels each. Channel 0: 100, 200.
	raw := u16sLE([]uint16{100, 0, 0, 200, 0, 0})
	data := makeTIFF(raw, 2, 1, 16, 3, 2 /*RGB*/, 1)
	m, err := heightmap.ParseTIFF(data)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if m.Samples[0] != 100 || m.Samples[1] != 200 {
		t.Errorf("want [100 200], got %v", m.Samples)
	}
}

func TestOutOfBoundsReturnsNotOk(t *testing.T) {
	data := makeTIFF(u16sLE([]uint16{1, 2, 3, 4}), 2, 2, 16, 1, 1, 1)
	m, _ := heightmap.ParseTIFF(data)

	if _, ok := m.SampleTopLeft(2, 0); ok {
		t.Error("expected out-of-bounds x to return false")
	}
	if _, ok := m.SampleTerrainXY(0, 2); ok {
		t.Error("expected out-of-bounds y to return false")
	}
}
