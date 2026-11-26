// Package heightmap parses New World region.heightmap TIFF files.
//
// Heightmaps are 16-bit TIFF images. Samples are stored in source image
// (top-left) order; terrain-space lookups flip the Y axis.
//
// Standard Go TIFF libraries (golang.org/x/image/tiff, compress/lzw) cannot
// decode these files. This package implements a self-contained parser with a
// hand-rolled LZW decoder that handles the specific encoding quirks found in
// the wild. See [decodeTIFFLZW] for the full technical explanation.
package heightmap

import (
	"encoding/binary"
	"fmt"
	"image"
	"image/png"
	"io"
	"math"
)

// RegionHeightmap is the parsed region.heightmap data.
type RegionHeightmap struct {
	Width   uint32
	Height  uint32
	Samples []uint16 // row-major, top-left origin (source image order)
}

// SampleTopLeft reads a sample at source image coordinates (0,0 = top-left).
func (m *RegionHeightmap) SampleTopLeft(x, y uint32) (uint16, bool) {
	if x >= m.Width || y >= m.Height {
		return 0, false
	}
	return m.Samples[uint64(y)*uint64(m.Width)+uint64(x)], true
}

// SampleTerrainXY reads a sample at terrain coordinates (0,0 = bottom-left).
func (m *RegionHeightmap) SampleTerrainXY(x, y uint32) (uint16, bool) {
	if y >= m.Height {
		return 0, false
	}
	return m.SampleTopLeft(x, m.Height-y-1)
}

// The returned image references the heightmap's own sample data via the Pix
// slice, so it is only valid as long as the RegionHeightmap is alive. If you
// need the image to outlive the heightmap, copy it first.
func (m *RegionHeightmap) Image() *image.Gray16 {
	img := image.NewGray16(image.Rect(0, 0, int(m.Width), int(m.Height)))
	// image.Gray16 stores pixels as big-endian uint16 pairs. Convert from the
	// native sample slice rather than going through the slow At/Set path.
	for i, v := range m.Samples {
		img.Pix[i*2] = byte(v >> 8)
		img.Pix[i*2+1] = byte(v)
	}
	return img
}

// EncodePNG encodes the heightmap as a 16-bit grayscale PNG into w.
// The PNG uses source image order (top-left origin). Use SampleTerrainXY
// for terrain-space access on the raw samples instead.
func (m *RegionHeightmap) EncodePNG(w io.Writer) error {
	return png.Encode(w, m.Image())
}

// ParseTIFF parses a region.heightmap TIFF payload from bytes.
func ParseTIFF(data []byte) (*RegionHeightmap, error) {
	// Some encoders incorrectly tag single-channel images as RGB (photometric=2)
	// even when SamplesPerPixel=1. Patch that before parsing so strict decoders
	// don't reject the file.
	data = patchSingleChannelRGBPhotometric(data)

	p, err := newHMParser(data)
	if err != nil {
		return nil, err
	}
	entries, err := p.readIFD()
	if err != nil {
		return nil, err
	}
	tags, err := p.readTags(entries)
	if err != nil {
		return nil, err
	}
	offsets, byteCounts, err := p.readStrips(entries)
	if err != nil {
		return nil, err
	}

	if tags.width == 0 || tags.height == 0 {
		return nil, fmt.Errorf("empty heightmap image: %d x %d", tags.width, tags.height)
	}
	n := uint64(tags.width) * uint64(tags.height)
	if n > uint64(math.MaxInt/2) {
		return nil, fmt.Errorf("heightmap dimensions are too large: %d x %d", tags.width, tags.height)
	}
	expectedSamples := int(n)

	raw, err := p.decodeStrips(offsets, byteCounts, expectedSamples, tags)
	if err != nil {
		return nil, err
	}

	samples, err := convertSamples(raw, tags, expectedSamples, p.order)
	if err != nil {
		return nil, err
	}
	if len(samples) != expectedSamples {
		return nil, fmt.Errorf("heightmap sample count mismatch for %d x %d: expected %d, found %d",
			tags.width, tags.height, expectedSamples, len(samples))
	}

	return &RegionHeightmap{Width: tags.width, Height: tags.height, Samples: samples}, nil
}

// ---- internal tag bag ----

type hmTags struct {
	width           uint32
	height          uint32
	bitsPerSample   uint16
	samplesPerPixel uint16
	compression     uint16
	photometric     uint16
	planarConfig    uint16
	predictor       uint16 // 1 = none, 2 = horizontal differencing
	rowsPerStrip    uint32
}

// ---- parser ----

type hmParser struct {
	data  []byte
	order binary.ByteOrder
}

type hmIFDEntry struct {
	tag, fieldType uint16
	count, value   uint32
}

const (
	hmTypeShort = 3
	hmTypeLong  = 4

	hmCompressionNone = 1
	hmCompressionLZW  = 5
)

func newHMParser(data []byte) (*hmParser, error) {
	if len(data) < 8 {
		return nil, fmt.Errorf("decode heightmap TIFF: file too short")
	}
	var order binary.ByteOrder
	switch {
	case data[0] == 'I' && data[1] == 'I':
		order = binary.LittleEndian
	case data[0] == 'M' && data[1] == 'M':
		order = binary.BigEndian
	default:
		return nil, fmt.Errorf("decode heightmap TIFF: invalid byte order marker")
	}
	if order.Uint16(data[2:4]) != 42 {
		return nil, fmt.Errorf("decode heightmap TIFF: invalid magic number")
	}
	return &hmParser{data: data, order: order}, nil
}

func (p *hmParser) readIFD() ([]hmIFDEntry, error) {
	ifdOffset := int(p.order.Uint32(p.data[4:8]))
	if ifdOffset+2 > len(p.data) {
		return nil, fmt.Errorf("decode heightmap TIFF: IFD offset out of bounds")
	}
	count := int(p.order.Uint16(p.data[ifdOffset : ifdOffset+2]))
	pos := ifdOffset + 2
	entries := make([]hmIFDEntry, 0, count)
	for i := 0; i < count; i++ {
		if pos+12 > len(p.data) {
			return nil, fmt.Errorf("decode heightmap TIFF: IFD entry out of bounds")
		}
		entries = append(entries, hmIFDEntry{
			tag:       p.order.Uint16(p.data[pos:]),
			fieldType: p.order.Uint16(p.data[pos+2:]),
			count:     p.order.Uint32(p.data[pos+4:]),
			value:     p.order.Uint32(p.data[pos+8:]),
		})
		pos += 12
	}
	return entries, nil
}

// u16 reads an IFD entry as a uint16. A single SHORT value is stored inline
// in the value field; multiple SHORTs or a LONG are resolved via file offset.
func (p *hmParser) u16(e hmIFDEntry) (uint16, error) {
	switch e.fieldType {
	case hmTypeShort:
		if e.count == 1 {
			b := [4]byte{}
			p.order.PutUint32(b[:], e.value)
			return p.order.Uint16(b[:2]), nil
		}
		off := int(e.value)
		if off+2 > len(p.data) {
			return 0, fmt.Errorf("decode heightmap TIFF: tag %d offset out of bounds", e.tag)
		}
		return p.order.Uint16(p.data[off:]), nil
	case hmTypeLong:
		if e.value > 0xFFFF {
			return 0, fmt.Errorf("decode heightmap TIFF: tag %d LONG value overflows u16", e.tag)
		}
		return uint16(e.value), nil
	default:
		return 0, fmt.Errorf("decode heightmap TIFF: tag %d unsupported field type %d", e.tag, e.fieldType)
	}
}

// u32 reads an IFD entry as a uint32.
func (p *hmParser) u32(e hmIFDEntry) (uint32, error) {
	switch e.fieldType {
	case hmTypeShort:
		v, err := p.u16(e)
		return uint32(v), err
	case hmTypeLong:
		if e.count == 1 {
			return e.value, nil
		}
		off := int(e.value)
		if off+4 > len(p.data) {
			return 0, fmt.Errorf("decode heightmap TIFF: tag %d offset out of bounds", e.tag)
		}
		return p.order.Uint32(p.data[off:]), nil
	default:
		return 0, fmt.Errorf("decode heightmap TIFF: tag %d unsupported field type %d", e.tag, e.fieldType)
	}
}

// u32vec reads an IFD entry as a slice of uint32 values.
func (p *hmParser) u32vec(e hmIFDEntry) ([]uint32, error) {
	if e.count == 1 {
		v, err := p.u32(e)
		return []uint32{v}, err
	}
	out := make([]uint32, e.count)
	switch e.fieldType {
	case hmTypeShort:
		off := int(e.value)
		for i := range out {
			if off+2 > len(p.data) {
				return nil, fmt.Errorf("decode heightmap TIFF: tag %d array out of bounds", e.tag)
			}
			out[i] = uint32(p.order.Uint16(p.data[off:]))
			off += 2
		}
	case hmTypeLong:
		off := int(e.value)
		for i := range out {
			if off+4 > len(p.data) {
				return nil, fmt.Errorf("decode heightmap TIFF: tag %d array out of bounds", e.tag)
			}
			out[i] = p.order.Uint32(p.data[off:])
			off += 4
		}
	default:
		return nil, fmt.Errorf("decode heightmap TIFF: tag %d unsupported field type %d", e.tag, e.fieldType)
	}
	return out, nil
}

func findEntry(entries []hmIFDEntry, tag uint16) (hmIFDEntry, bool) {
	for _, e := range entries {
		if e.tag == tag {
			return e, true
		}
	}
	return hmIFDEntry{}, false
}

func (p *hmParser) readTags(entries []hmIFDEntry) (hmTags, error) {
	var t hmTags
	var err error

	mustU32 := func(tag uint16, name string) (uint32, error) {
		e, ok := findEntry(entries, tag)
		if !ok {
			return 0, fmt.Errorf("decode heightmap TIFF: missing tag %s", name)
		}
		return p.u32(e)
	}
	optU16 := func(tag uint16, def uint16) (uint16, error) {
		e, ok := findEntry(entries, tag)
		if !ok {
			return def, nil
		}
		return p.u16(e)
	}

	if t.width, err = mustU32(256, "ImageWidth"); err != nil {
		return t, err
	}
	if t.height, err = mustU32(257, "ImageLength"); err != nil {
		return t, err
	}
	if t.bitsPerSample, err = optU16(258, 1); err != nil {
		return t, err
	}
	if t.compression, err = optU16(259, hmCompressionNone); err != nil {
		return t, err
	}
	if t.photometric, err = optU16(262, 1); err != nil {
		return t, err
	}
	if t.planarConfig, err = optU16(284, 1); err != nil {
		return t, err
	}
	if e, ok := findEntry(entries, 277); ok {
		if t.samplesPerPixel, err = p.u16(e); err != nil {
			return t, err
		}
	} else {
		// Default: RGB needs 3 channels, everything else 1.
		if t.photometric == 2 {
			t.samplesPerPixel = 3
		} else {
			t.samplesPerPixel = 1
		}
	}

	switch t.compression {
	case hmCompressionNone, hmCompressionLZW:
	default:
		return t, fmt.Errorf("decode heightmap TIFF: unsupported compression %d", t.compression)
	}
	if t.planarConfig != 1 {
		return t, fmt.Errorf("decode heightmap TIFF: unsupported planar config %d", t.planarConfig)
	}
	if t.predictor, err = optU16(317, 1); err != nil {
		return t, err
	}
	if t.predictor != 1 && t.predictor != 2 {
		return t, fmt.Errorf("decode heightmap TIFF: unsupported predictor %d", t.predictor)
	}
	if e, ok := findEntry(entries, 278); ok {
		if t.rowsPerStrip, err = p.u32(e); err != nil {
			return t, err
		}
	} else {
		t.rowsPerStrip = t.height // default: single strip
	}
	return t, nil
}

func (p *hmParser) readStrips(entries []hmIFDEntry) (offsets, byteCounts []uint32, err error) {
	e, ok := findEntry(entries, 273)
	if !ok {
		return nil, nil, fmt.Errorf("decode heightmap TIFF: missing StripOffsets")
	}
	if offsets, err = p.u32vec(e); err != nil {
		return nil, nil, err
	}
	e, ok = findEntry(entries, 279)
	if !ok {
		return nil, nil, fmt.Errorf("decode heightmap TIFF: missing StripByteCounts")
	}
	if byteCounts, err = p.u32vec(e); err != nil {
		return nil, nil, err
	}
	if len(offsets) != len(byteCounts) {
		return nil, nil, fmt.Errorf("decode heightmap TIFF: strip table mismatch: %d offsets vs %d byte counts",
			len(offsets), len(byteCounts))
	}
	return offsets, byteCounts, nil
}

func (p *hmParser) decodeStrips(offsets, byteCounts []uint32, expectedSamples int, tags hmTags) ([]byte, error) {
	bytesPerSample := int((tags.bitsPerSample + 7) / 8)
	stride := int(tags.samplesPerPixel) * bytesPerSample
	expectedBytes := expectedSamples * stride
	rowBytes := int(tags.width) * stride // bytes per image row, used for predictor

	out := make([]byte, 0, expectedBytes)

	for i, off := range offsets {
		start, end := int(off), int(off)+int(byteCounts[i])
		if end < start || end > len(p.data) {
			return nil, fmt.Errorf("decode heightmap TIFF: strip %d out of bounds", i)
		}

		var stripRaw []byte
		switch tags.compression {
		case hmCompressionNone:
			stripRaw = p.data[start:end]
		case hmCompressionLZW:
			// Limit to the per-strip expected byte count, not the total remaining.
			// Without this cap the LZW decoder overruns into the next strip's data
			// after a CLEAR code resets the table mid-stream. See decodeTIFFLZW.
			stripExpected := rowBytes * int(tags.rowsPerStrip)
			if remaining := expectedBytes - len(out); stripExpected > remaining {
				stripExpected = remaining // last strip may be smaller
			}
			dec, err := decodeTIFFLZW(p.data[start:end], stripExpected)
			if err != nil {
				return nil, fmt.Errorf("decode heightmap TIFF: strip %d LZW: %w", i, err)
			}
			stripRaw = dec
		}

		// Undo horizontal differencing predictor (tag 317 = 2).
		// The TIFF spec defines predictor differencing on the sample values
		// themselves, not on raw bytes. For 16-bit data each uint16 sample is
		// stored as a delta from the previous sample in the same row. We undo
		// this with modular uint16 addition, reading and writing in the file's
		// native byte order.
		if tags.predictor == 2 && rowBytes > 0 && bytesPerSample > 0 {
			b := make([]byte, len(stripRaw))
			copy(b, stripRaw)
			samplesPerRow := rowBytes / bytesPerSample
			for rowStart := 0; rowStart+rowBytes <= len(b); rowStart += rowBytes {
				for col := 1; col < samplesPerRow; col++ {
					off := rowStart + col*bytesPerSample
					prev := rowStart + (col-1)*bytesPerSample
					cur := p.order.Uint16(b[off:])
					pre := p.order.Uint16(b[prev:])
					p.order.PutUint16(b[off:], cur+pre)
				}
			}
			stripRaw = b
		}

		out = append(out, stripRaw...)
	}
	return out, nil
}

// convertSamples turns raw strip bytes into []uint16, taking only channel 0
// for multi-channel data (matching the Rust behaviour for all pixel formats).
func convertSamples(raw []byte, tags hmTags, expectedSamples int, order binary.ByteOrder) ([]uint16, error) {
	spp := int(tags.samplesPerPixel)
	if spp < 1 {
		spp = 1
	}
	out := make([]uint16, expectedSamples)
	switch tags.bitsPerSample {
	case 8:
		if len(raw) < expectedSamples*spp {
			return nil, fmt.Errorf("decode heightmap TIFF: not enough raw bytes for 8-bit samples")
		}
		for i := range out {
			out[i] = expandU8(raw[i*spp])
		}
	case 16:
		stride := spp * 2
		if len(raw) < expectedSamples*stride {
			return nil, fmt.Errorf("decode heightmap TIFF: not enough raw bytes for 16-bit samples")
		}
		for i := range out {
			out[i] = order.Uint16(raw[i*stride:])
		}
	default:
		return nil, fmt.Errorf("decode heightmap TIFF: unsupported BitsPerSample %d", tags.bitsPerSample)
	}
	return out, nil
}

// expandU8 scales an 8-bit sample to the full 16-bit range.
// Matches the Rust equivalent: u16::from(v) * 257, which maps 0->0 and 255->65535.
func expandU8(v uint8) uint16 { return uint16(v) * 257 }

// patchSingleChannelRGBPhotometric returns a copy of data with the
// PhotometricInterpretation tag rewritten from RGB (2) to BlackIsZero (1)
// when SamplesPerPixel == 1. Some encoders produce this invalid combination
// for single-channel images, causing strict decoders to reject the file.
func patchSingleChannelRGBPhotometric(data []byte) []byte {
	out := make([]byte, len(data))
	copy(out, data)
	if len(out) < 8 {
		return out
	}
	var order binary.ByteOrder
	switch {
	case out[0] == 'I' && out[1] == 'I':
		order = binary.LittleEndian
	case out[0] == 'M' && out[1] == 'M':
		order = binary.BigEndian
	default:
		return out
	}
	if order.Uint16(out[2:4]) != 42 {
		return out
	}
	ifdOffset := int(order.Uint32(out[4:8]))
	if ifdOffset+2 > len(out) {
		return out
	}
	entryCount := int(order.Uint16(out[ifdOffset : ifdOffset+2]))
	start := ifdOffset + 2
	end := start + entryCount*12
	if end > len(out) {
		return out
	}

	// Scan for PhotometricInterpretation (262) and SamplesPerPixel (277).
	// Only handle inline SHORT values (type=3, count=1) — the only form
	// these tags appear in for single-IFD baseline TIFFs.
	var photometricValueOff int
	var samplesPerPixel uint16
	for pos := start; pos < end; pos += 12 {
		tag := order.Uint16(out[pos:])
		fieldType := order.Uint16(out[pos+2:])
		count := order.Uint32(out[pos+4:])
		if fieldType != 3 || count != 1 {
			continue
		}
		switch tag {
		case 262:
			photometricValueOff = pos + 8
		case 277:
			samplesPerPixel = order.Uint16(out[pos+8:])
		}
	}
	if photometricValueOff > 0 &&
		samplesPerPixel == 1 &&
		photometricValueOff+2 <= len(out) &&
		order.Uint16(out[photometricValueOff:]) == 2 {
		order.PutUint16(out[photometricValueOff:], 1)
	}
	return out
}

// decodeTIFFLZW decodes a single TIFF LZW compressed strip.
//
// # Why not compress/lzw or golang.org/x/image/tiff?
//
// Go's standard compress/lzw implements GIF LZW, which differs from TIFF LZW
// in code-width timing. Both increase the code width as the table fills, but
// they do so at different moments relative to the table boundary. Using the
// wrong decoder produces "invalid code" errors immediately.
//
// golang.org/x/image/tiff also fails on these specific files, likely due to
// the same underlying LZW issue combined with non-standard encoder behaviour.
//
// # Three quirks found by reverse-engineering real files
//
// 1. Early-change widening (threshold: nextCode == (1<<width)-1)
//
// The encoder increments its code width when nextCode reaches (1<<width)-1,
// one slot before the table would be completely full. This is "early change"
// as opposed to "late change" at (1<<width). Using the wrong threshold
// causes the decoder to read subsequent codes at the wrong width.
//
// 2. Deferred widening (pendingWiden flag)
//
// Even with the correct threshold, applying the width increase immediately
// causes CLEAR and EOI codes to be read at the new wider width. The encoder
// writes those control codes at the pre-widen width. The fix is to set a
// pendingWiden flag and apply the width increase at the top of the next
// iteration, so the very next code is still read at the old width.
//
// 3. Per-strip maxOut budget
//
// Each strip is an independent LZW stream. When a CLEAR code resets the
// table mid-stream, the encoder starts building a new table from scratch.
// If the decoder is given a budget equal to the total remaining bytes across
// all strips (rather than just this strip's worth), it overruns past the
// strip's natural EOI after a CLEAR reset, reads garbage bits from the next
// strip's data with a half-built table, and fails. The fix is to cap maxOut
// at rowsPerStrip * rowBytes per strip.
func decodeTIFFLZW(src []byte, maxOut int) ([]byte, error) {
	const (
		clearCode = 256
		eoiCode   = 257
		firstFree = 258
		maxCodes  = 4096
	)

	// MSB-first bit reader: bits are packed from the most significant end of
	// each byte, matching the TIFF LZW spec (opposite of GIF's LSB-first).
	var bitBuf uint32
	nBits := 0
	pos := 0
	readCode := func(width int) (int, bool) {
		for nBits < width {
			if pos >= len(src) {
				return 0, false
			}
			bitBuf = (bitBuf << 8) | uint32(src[pos])
			pos++
			nBits += 8
		}
		nBits -= width
		return int((bitBuf >> uint(nBits)) & uint32((1<<uint(width))-1)), true
	}

	// String table: each entry is (prefix code, suffix byte). Strings are
	// reconstructed by chasing prefix links back to a literal (prefix == -1).
	type lzwEntry struct {
		prefix int16 // -1 for single-byte literals
		suffix byte
	}
	table := make([]lzwEntry, maxCodes)
	for i := 0; i < 256; i++ {
		table[i] = lzwEntry{prefix: -1, suffix: byte(i)}
	}
	// Entries 256 (clear) and 257 (EOI) are never dereferenced via prefix chain.

	var strBuf [maxCodes]byte // scratch buffer for string reconstruction
	stringify := func(c int) ([]byte, bool) {
		n := 0
		for c != -1 {
			if n >= maxCodes || c >= maxCodes {
				return nil, false
			}
			strBuf[n] = table[c].suffix
			n++
			c = int(table[c].prefix)
		}
		for i, j := 0, n-1; i < j; i, j = i+1, j-1 {
			strBuf[i], strBuf[j] = strBuf[j], strBuf[i]
		}
		return strBuf[:n], true
	}

	reset := func(nextCode *int, width *int) {
		*nextCode = firstFree
		*width = 9
	}

	out := make([]byte, 0, maxOut)
	nextCode := firstFree
	codeWidth := 9
	prevCode := -1
	// pendingWiden defers the code-width increase by one iteration.
	// See quirk 2 in the function doc above.
	pendingWiden := false

	for {
		if pendingWiden {
			codeWidth++
			pendingWiden = false
		}

		code, ok := readCode(codeWidth)
		if !ok {
			break
		}

		switch code {
		case eoiCode:
			goto done
		case clearCode:
			reset(&nextCode, &codeWidth)
			prevCode = -1
			pendingWiden = false
			continue
		}

		var s []byte
		switch {
		case code < nextCode:
			s, ok = stringify(code)
			if !ok {
				return nil, fmt.Errorf("corrupt LZW: bad code %d", code)
			}
			if prevCode != -1 && nextCode < maxCodes {
				table[nextCode] = lzwEntry{prefix: int16(prevCode), suffix: s[0]}
				nextCode++
				// Quirks 1 & 2: schedule widen at (1<<codeWidth)-1, deferred.
				if nextCode == (1<<uint(codeWidth))-1 && codeWidth < 12 {
					pendingWiden = true
				}
			}

		case code == nextCode:
			// The encoder referenced the code it's simultaneously defining.
			// The new entry's first byte equals the first byte of the previous string.
			prev, ok2 := stringify(prevCode)
			if !ok2 || prevCode == -1 {
				return nil, fmt.Errorf("corrupt LZW: bad code %d", code)
			}
			if nextCode < maxCodes {
				table[nextCode] = lzwEntry{prefix: int16(prevCode), suffix: prev[0]}
				nextCode++
				if nextCode == (1<<uint(codeWidth))-1 && codeWidth < 12 {
					pendingWiden = true
				}
			}
			s, ok = stringify(code)
			if !ok {
				return nil, fmt.Errorf("corrupt LZW: bad code %d", code)
			}

		default:
			return nil, fmt.Errorf("corrupt LZW: code %d out of range (next=%d)", code, nextCode)
		}

		out = append(out, s...)
		prevCode = code

		if maxOut > 0 && len(out) >= maxOut {
			goto done
		}
	}

done:
	if maxOut > 0 && len(out) > maxOut {
		out = out[:maxOut]
	}
	return out, nil
}
